"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function submitEventWork(eventId: string, submissionLink: string, notes?: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return { success: false, error: "Please login to submit your work" };
        }

        // Validate URL format
        if (!submissionLink || !submissionLink.trim()) {
            return { success: false, error: "Submission link is required" };
        }

        // Basic URL validation
        try {
            new URL(submissionLink);
        } catch {
            return { success: false, error: "Please enter a valid URL" };
        }

        // Check if user is registered for the event
        const registration = await prisma.user.findFirst({
            where: {
                id: session.user.id,
                registeredEvents: {
                    some: {
                        id: eventId,
                    },
                },
            },
        });

        if (!registration) {
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
                    submissionLink: submissionLink.trim(),
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
                    submissionLink: submissionLink.trim(),
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
                registeredEvents: {
                    include: {
                        Category: true,
                        _count: {
                            select: {
                                registeredStudents: true,
                            },
                        },
                    },
                    orderBy: {
                        date: "asc",
                    },
                },
                eventSubmissions: true,
                individualRegistrations: true,
                groupRegistrations: true,
            },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Fetch group registrations only for events the user is registered for
        const eventIds = user.registeredEvents.map(e => e.id);
        const allGroupRegs = await prisma.groupRegistration.findMany({
            where: {
                eventId: { in: eventIds },
            },
        });

        // Filter for groups where the user is either the leader OR a member
        const relevantGroupRegs = allGroupRegs.filter(gr => {
            if (gr.userId === session.user.id) return true;
            const members = gr.members as any[];
            return Array.isArray(members) && members.some((m: any) => m.userId === session.user.id || m.email === session.user.email);
        });

        // Map status to events
        const eventsWithStatus = user.registeredEvents.map(event => {
            // Check individual registration
            const individualReg = user.individualRegistrations.find(r => r.eventId === event.id);
            if (individualReg) {
                return { ...event, registrationStatus: individualReg.paymentStatus };
            }

            // Check group registration (from fetched user.groupRegistrations directly to avoid extra query logic issues, or verify if the relevant one applies)
            const groupReg = relevantGroupRegs.find(r => r.eventId === event.id);
            if (groupReg) {
                return { ...event, registrationStatus: groupReg.paymentStatus };
            }

            // Fallback (assume approved if legacy/KL)
            return { ...event, registrationStatus: "APPROVED" };
        });

        return {
            success: true,
            data: eventsWithStatus,
            submissions: user.eventSubmissions,
            groupRegistrations: relevantGroupRegs
        };
    } catch (error) {
        console.error("Error fetching registered events:", error);
        return { success: false, error: "Failed to fetch registered events" };
    }
}
