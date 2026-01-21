"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

                // Collect all remarks
                const allRemarks: string[] = [];
                if (leaderEval?.remarks) allRemarks.push(leaderEval.remarks);
                if (Array.isArray(members)) {
                    members.forEach(member => {
                        if (member.userId) {
                            const memEval = evaluations.find(e => e.participantId === member.userId);
                            if (memEval?.remarks) allRemarks.push(memEval.remarks);
                        }
                    });
                }

                return {
                    id: group.id,
                    name: group.groupName || `${group.user.name}'s Team`,
                    type: 'GROUP',
                    collageId: group.user.collageId,
                    score: parseFloat(averageScore.toFixed(2)), // Keep 2 decimals
                    isEvaluated: evaluatedCount > 0,
                    remarks: allRemarks.length > 0 ? allRemarks.join(' | ') : null
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
                const allRemarks: string[] = [];
                if (evals.length > 0) {
                    totalScore = evals.reduce((sum, e) => sum + e.score, 0) / evals.length;
                    evals.forEach(e => {
                        if (e.remarks) allRemarks.push(e.remarks);
                    });
                }

                return {
                    id: student.id,
                    name: student.name,
                    type: 'INDIVIDUAL',
                    collageId: student.collageId,
                    score: parseFloat(totalScore.toFixed(2)),
                    isEvaluated: evals.length > 0,
                    remarks: allRemarks.length > 0 ? allRemarks.join(' | ') : null
                };
            });
        }

        // Sort by Score DESC
        participants.sort((a, b) => b.score - a.score);

        // Check if results are released
        // If not released, we only return participants if the requester is an admin (optional, for preview) 
        // OR we just return empty list with a flag.
        // For simplicity and security, if not released, we return empty list for public.
        // IF we want admins to preview, we'd need to check auth.
        // Let's check auth to see if user is ADMIN/MASTER, if so, they can see even if not published.

        let canView = eventDetails.isResultPublished;
        if (!canView) {
            const headersList = await headers();
            const session = await auth.api.getSession({ headers: headersList });
            if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MASTER' || session?.user?.role === 'MANAGER') {
                canView = true;
            }
        }

        if (!canView) {
            return {
                success: true,
                data: {
                    event: eventDetails,
                    participants: [],
                    isPublished: false
                }
            };
        }

        return {
            success: true,
            data: {
                event: eventDetails,
                participants,
                isPublished: true
            }
        };

    } catch (error) {
        console.error("Error fetching event results:", error);
        return { success: false, error: "Failed to fetch results" };
    }
}
