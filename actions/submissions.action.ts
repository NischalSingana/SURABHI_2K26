"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitEventWork(eventId: string, submissionLink: string, youtubeChannelName?: string, notes?: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return { success: false, error: "Please login to submit your work" };
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { allowSubmissions: true }
        });
        if (!event) {
            return { success: false, error: "Event not found" };
        }
        if (!event.allowSubmissions) {
            return { success: false, error: "Submissions are disabled for this event" };
        }

        if (!submissionLink || !submissionLink.trim()) {
            return { success: false, error: "YouTube video link is required" };
        }
        if (!youtubeChannelName || !youtubeChannelName.trim()) {
            return { success: false, error: "YouTube channel name is required" };
        }

        const trimmedLink = submissionLink.trim();
        try {
            new URL(trimmedLink);
        } catch {
            return { success: false, error: "Please enter a valid URL" };
        }
        if (!(trimmedLink.includes("youtube.com") || trimmedLink.includes("youtu.be"))) {
            return { success: false, error: "Please enter a valid YouTube video link" };
        }

        // Check if user is registered for the event
        const individualReg = await prisma.individualRegistration.findUnique({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId: eventId,
                },
            },
        });

        const groupReg = await prisma.groupRegistration.findUnique({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId: eventId,
                },
            },
        });

        const memberInGroup = await prisma.groupRegistration.findFirst({
            where: {
                eventId: eventId,
                members: {
                    array_contains: [{ email: session.user.email }]
                }
            }
        });

        if (!individualReg && !groupReg && !memberInGroup) {
            return { success: false, error: "You must be registered for this event to submit" };
        }

        // Check if submission already exists
        const existingSubmission = await prisma.eventSubmission.findUnique({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId: eventId,
                },
            },
        });

        if (existingSubmission) {
            // Update existing submission
            await prisma.eventSubmission.update({
                where: {
                    userId_eventId: {
                        userId: session.user.id,
                        eventId: eventId,
                    },
                },
                data: {
                    submissionLink: trimmedLink,
                    youtubeChannelName: youtubeChannelName.trim(),
                    notes: notes?.trim() || null,
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create new submission
            await prisma.eventSubmission.create({
                data: {
                    userId: session.user.id,
                    eventId: eventId,
                    submissionLink: trimmedLink,
                    youtubeChannelName: youtubeChannelName.trim(),
                    notes: notes?.trim() || null,
                },
            });
        }

        revalidatePath("/profile/events");
        return { success: true, message: "Submission saved successfully" };
    } catch (error) {
        console.error("Error submitting event work:", error);
        return { success: false, error: "Failed to submit work" };
    }
}

export async function getEventSubmission(eventId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return { success: false, error: "Please login to view submissions" };
        }

        const submission = await prisma.eventSubmission.findUnique({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId: eventId,
                },
            },
        });

        return { success: true, data: submission };
    } catch (error) {
        console.error("Error fetching submission:", error);
        return { success: false, error: "Failed to fetch submission" };
    }
}

export async function getUserSubmissions() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return { success: false, error: "Please login to view submissions" };
        }

        const submissions = await prisma.eventSubmission.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                event: {
                    include: {
                        Category: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return { success: true, data: submissions };
    } catch (error) {
        console.error("Error fetching user submissions:", error);
        return { success: false, error: "Failed to fetch submissions" };
    }
}

export async function getUserRegisteredEvents() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return { success: false, error: "Please login to view your events" };
        }

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            include: {
                individualRegistrations: {
                    where: {
                        paymentStatus: { not: "REJECTED" }
                    },
                    include: {
                        event: {
                            include: {
                                Category: true,
                                _count: {
                                    select: {
                                        individualRegistrations: true,
                                        groupRegistrations: true,
                                    },
                                },
                            },
                        },
                    },
                },
                groupRegistrations: {
                    where: {
                        paymentStatus: { not: "REJECTED" }
                    },
                    include: {
                        event: {
                            include: {
                                Category: true,
                                _count: {
                                    select: {
                                        individualRegistrations: true,
                                        groupRegistrations: true,
                                    },
                                },
                            },
                        },
                    },
                },
                eventSubmissions: true,
            },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Find groups where user is a member (exclude REJECTED)
        const memberInGroups = await prisma.groupRegistration.findMany({
            where: {
                members: {
                    array_contains: [{ email: session.user.email }]
                },
                userId: { not: session.user.id },
                paymentStatus: { not: "REJECTED" }
            },
            include: {
                event: {
                    include: {
                        Category: true,
                        _count: {
                            select: {
                                individualRegistrations: true,
                                groupRegistrations: true,
                            },
                        },
                    },
                },
            }
        });

        // Combine events - REJECTED registrations already filtered at database level
        const individualEvents = user.individualRegistrations.map(reg => ({
            ...reg.event,
            registrationStatus: reg.paymentStatus as any,
            isVirtual: reg.isVirtual || false
        }));

        const groupEvents = user.groupRegistrations.map(reg => ({
            ...reg.event,
            registrationStatus: reg.paymentStatus as any,
            isVirtual: false // Group registrations don't have isVirtual field yet
        }));

        const memberEvents = memberInGroups.map(reg => ({
            ...reg.event,
            registrationStatus: reg.paymentStatus as any,
            isVirtual: false // Group registrations don't have isVirtual field yet
        }));

        const allEvents = [...individualEvents, ...groupEvents, ...memberEvents];
        const uniqueEventsMap = new Map();
        allEvents.forEach(e => {
            uniqueEventsMap.set(e.id, e);
        });

        const uniqueEvents = Array.from(uniqueEventsMap.values()).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return {
            success: true,
            data: uniqueEvents,
            submissions: user.eventSubmissions,
            groupRegistrations: [...user.groupRegistrations, ...memberInGroups]
        };
    } catch (error) {
        console.error("Error fetching registered events:", error);
        return { success: false, error: "Failed to fetch registered events" };
    }
}
