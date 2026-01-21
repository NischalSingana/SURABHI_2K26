"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth"; // Assuming auth is needed, though results might be public?
// Actually if it's public results, we might not need auth check, but let's check requirements.
// "display that page to students at last" -> implies public.

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            select: { id: true, name: true, slug: true },
        });
        return { success: true, data: categories };
    } catch (error) {
        return { success: false, error: "Failed to fetch categories" };
    }
}

export async function getEventsByCategory(categoryId: string) {
    try {
        const events = await prisma.event.findMany({
            where: { categoryId },
            select: { id: true, name: true, slug: true, isGroupEvent: true },
        });
        return { success: true, data: events };
    } catch (error) {
        return { success: false, error: "Failed to fetch events" };
    }
}

export async function getEventResults(eventSlug: string) {
    try {


        // Let's refine the query. We need to fetch participants and their evaluations.
        // It's better to query Event and then fetch participants based on type.

        const eventDetails = await prisma.event.findUnique({
            where: { slug: eventSlug },
            include: {
                Category: { select: { name: true } }
            }
        });

        if (!eventDetails) return { success: false, error: "Event not found" };

        let participants = [];

        if (eventDetails.isGroupEvent) {
            // Fetch Group Registrations
            const groups = await prisma.groupRegistration.findMany({
                where: { eventId: eventDetails.id },
                include: {
                    user: { select: { id: true, name: true, collageId: true } } // Leader
                }
            });

            // Fetch all evaluations for this event
            const evaluations = await prisma.evaluation.findMany({
                where: { eventId: eventDetails.id }
            });

            // Construct result objects
            participants = groups.map(group => {
                const members = group.members as any[]; // Array of { userId, name, ... }

                // Get Leader Score
                const leaderEval = evaluations.find(e => e.participantId === group.user.id);
                let totalScore = leaderEval ? leaderEval.score : 0;
                let evaluatedCount = leaderEval ? 1 : 0;

                // Get Members Scores
                if (Array.isArray(members)) {
                    members.forEach(member => {
                        if (member.userId) {
                            const memEval = evaluations.find(e => e.participantId === member.userId);
                            if (memEval) {
                                totalScore += memEval.score;
                                evaluatedCount++;
                            }
                        }
                    });
                }

                const averageScore = evaluatedCount > 0 ? totalScore / evaluatedCount : 0;

                return {
                    id: group.id,
                    name: group.groupName || `${group.user.name}'s Team`,
                    type: 'GROUP',
                    collageId: group.user.collageId,
                    score: parseFloat(averageScore.toFixed(2)), // Keep 2 decimals
                    isEvaluated: evaluatedCount > 0
                };
            });

        } else {
            // Solo Event
            // Fetch registered students (Users)
            // Need to look at schema again for correct relation usage.
            // Event has `registeredStudents User[] @relation("EventToUser")`

            const eventWithParticipants = await prisma.event.findUnique({
                where: { id: eventDetails.id },
                include: {
                    individualRegistrations: {
                        include: {
                            user: {
                                select: { id: true, name: true, collageId: true }
                            }
                        }
                    }
                }
            });

            const evaluations = await prisma.evaluation.findMany({
                where: { eventId: eventDetails.id }
            });

            participants = (eventWithParticipants?.individualRegistrations || []).map(reg => {
                const student = reg.user;
                const evals = evaluations.filter(e => e.participantId === student.id);
                // If multiple judges? 
                // Assuming single judge per participant for now as per current schema allowing one eval per judge per participant.
                // But if multiple judges evaluate same participant, we should average them.

                let totalScore = 0;
                if (evals.length > 0) {
                    totalScore = evals.reduce((sum, e) => sum + e.score, 0) / evals.length;
                }

                return {
                    id: student.id,
                    name: student.name,
                    type: 'INDIVIDUAL',
                    collageId: student.collageId,
                    score: parseFloat(totalScore.toFixed(2)),
                    isEvaluated: evals.length > 0
                };
            });
        }

        // Sort by Score DESC
        participants.sort((a, b) => b.score - a.score);

        return { success: true, data: { event: eventDetails, participants } };

    } catch (error) {
        console.error("Error fetching event results:", error);
        return { success: false, error: "Failed to fetch results" };
    }
}
