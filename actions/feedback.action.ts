"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { FEEDBACK_RATING_FIELDS, type FeedbackRatings } from "@/lib/feedback";

export async function getFeedbackReleasesForUser() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: "Please login", eventIds: [] as string[] };
    }

    const releases = await prisma.feedbackRelease.findMany({
      where: { isReleased: true },
      select: { eventId: true },
    });
    return {
      success: true,
      eventIds: releases.map((r) => r.eventId),
    };
  } catch (e) {
    console.error("getFeedbackReleasesForUser:", e);
    return { success: false, error: "Failed to load", eventIds: [] as string[] };
  }
}

export async function getUserFeedbackForEvent(eventId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: "Please login" };
    }

    const feedback = await prisma.competitionFeedback.findUnique({
      where: {
        userId_eventId: { userId: session.user.id, eventId },
      },
    });

    if (!feedback) {
      return { success: false, error: "Feedback not found" };
    }

    return {
      success: true,
      feedback: {
        overallRating: feedback.overallRating,
        ratings: feedback.ratings as FeedbackRatings,
        suggestions: feedback.suggestions,
        createdAt: feedback.createdAt,
      },
    };
  } catch (e) {
    console.error("getUserFeedbackForEvent:", e);
    return { success: false, error: "Failed to load feedback" };
  }
}

export async function getFeedbackStatusForUser(eventIds: string[]) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || eventIds.length === 0) {
      return { success: true, submitted: {} as Record<string, boolean> };
    }

    const feedbacks = await prisma.competitionFeedback.findMany({
      where: {
        userId: session.user.id,
        eventId: { in: eventIds },
      },
      select: { eventId: true },
    });
    const submitted: Record<string, boolean> = {};
    eventIds.forEach((id) => {
      submitted[id] = feedbacks.some((f) => f.eventId === id);
    });
    return { success: true, submitted };
  } catch (e) {
    console.error("getFeedbackStatusForUser:", e);
    return { success: true, submitted: {} as Record<string, boolean> };
  }
}

export async function submitFeedback(
  eventId: string,
  data: {
    overallRating: number;
    ratings: FeedbackRatings;
    suggestions?: string;
  }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: "Please login to submit feedback" };
    }

    const release = await prisma.feedbackRelease.findUnique({
      where: { eventId },
    });
    if (!release?.isReleased) {
      return { success: false, error: "Feedback submission is not open for this competition" };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true },
    });
    if (!event) {
      return { success: false, error: "Competition not found" };
    }

    const [hasIndividual, hasGroup] = await Promise.all([
      prisma.individualRegistration.findUnique({
        where: { userId_eventId: { userId: session.user.id, eventId } },
      }),
      prisma.groupRegistration.findUnique({
        where: { userId_eventId: { userId: session.user.id, eventId } },
      }),
    ]);
    if (!hasIndividual && !hasGroup) {
      return { success: false, error: "You must be registered for this competition to submit feedback" };
    }

    const { overallRating, ratings, suggestions } = data;
    if (overallRating < 0 || overallRating > 10) {
      return { success: false, error: "Overall rating must be between 0 and 10" };
    }

    for (const field of FEEDBACK_RATING_FIELDS) {
      const val = ratings[field.key];
      if (typeof val !== "number" || val < 0 || val > 10) {
        return { success: false, error: `${field.label} must be between 0 and 10` };
      }
    }

    await prisma.competitionFeedback.upsert({
      where: {
        userId_eventId: { userId: session.user.id, eventId },
      },
      create: {
        userId: session.user.id,
        eventId,
        overallRating,
        ratings: ratings as object,
        suggestions: suggestions?.trim() || null,
      },
      update: {
        overallRating,
        ratings: ratings as object,
        suggestions: suggestions?.trim() || null,
      },
    });

    return { success: true, message: "Thank you for your feedback!" };
  } catch (e) {
    console.error("submitFeedback:", e);
    return { success: false, error: "Failed to submit feedback" };
  }
}

// Admin: Get events with feedback release status
export async function getFeedbackAdminData() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
      return { success: false, error: "Unauthorized" };
    }

    const events = await prisma.event.findMany({
      orderBy: [{ date: "desc" }],
      select: {
        id: true,
        name: true,
        date: true,
        Category: { select: { name: true } },
        _count: {
          select: {
            individualRegistrations: true,
            groupRegistrations: true,
            competitionFeedbacks: true,
          },
        },
      },
    });

    const releases = await prisma.feedbackRelease.findMany({
      where: { eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true, isReleased: true, releasedAt: true },
    });
    const releaseMap = new Map(releases.map((r) => [r.eventId, r]));

    const data = events.map((e) => ({
      ...e,
      isReleased: releaseMap.get(e.id)?.isReleased ?? false,
      releasedAt: releaseMap.get(e.id)?.releasedAt ?? null,
    }));

    return { success: true, data };
  } catch (e) {
    console.error("getFeedbackAdminData:", e);
    return { success: false, error: "Failed to load" };
  }
}

// Admin: Release or unrelease feedback for an event
export async function setFeedbackRelease(eventId: string, isReleased: boolean) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.feedbackRelease.upsert({
      where: { eventId },
      create: {
        eventId,
        isReleased,
        releasedAt: isReleased ? new Date() : null,
        releasedBy: isReleased ? session.user.id : null,
      },
      update: {
        isReleased,
        releasedAt: isReleased ? new Date() : null,
        releasedBy: isReleased ? session.user.id : null,
      },
    });

    return {
      success: true,
      message: isReleased ? "Feedback submission is now open" : "Feedback submission is now closed",
    };
  } catch (e) {
    console.error("setFeedbackRelease:", e);
    return { success: false, error: "Failed to update" };
  }
}

// Admin: Get feedback for an event (for viewing and PDF)
export async function getFeedbackForEvent(eventId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
      return { success: false, error: "Unauthorized" };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true, Category: { select: { name: true } } },
    });
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const feedbacks = await prisma.competitionFeedback.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            collage: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      event,
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        overallRating: f.overallRating,
        ratings: f.ratings as FeedbackRatings,
        suggestions: f.suggestions,
        createdAt: f.createdAt,
        user: f.user,
      })),
    };
  } catch (e) {
    console.error("getFeedbackForEvent:", e);
    return { success: false, error: "Failed to load feedback" };
  }
}
