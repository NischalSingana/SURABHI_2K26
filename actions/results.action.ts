"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const CRITERIA_REMARKS_PREFIX = "__CRITERIA__:";

type RubricCriterion = {
    key: string;
    label: string;
    max: number;
};

function normalizeText(value?: string | null): string {
    return (value || "").trim().toLowerCase();
}

function isCinecarnicalCategory(categoryName?: string | null): boolean {
    const category = normalizeText(categoryName);
    return (
        category.includes("cinecarnical") ||
        category.includes("cine carnival") ||
        category.includes("cinecarnival")
    );
}

function getEventRubric(categoryName?: string | null, eventName?: string | null): RubricCriterion[] | null {
    const category = normalizeText(categoryName);
    const event = normalizeText(eventName);

    if (category.includes("natyaka")) {
        if (event.includes("mono") && event.includes("action")) {
            return [
                { key: "dialogueDelivery", label: "Dialogue Delivery", max: 10 },
                { key: "expressions", label: "Expressions", max: 10 },
                { key: "bodyLanguage", label: "Body Language", max: 10 },
                { key: "confidenceAndPresence", label: "Confidence and Stage Presence", max: 10 },
                { key: "overallPerformance", label: "Overall Performance", max: 10 },
            ];
        }
        if (event.includes("skit")) {
            return [
                { key: "dialogueDelivery", label: "Dialogue Delivery", max: 10 },
                { key: "expressionAndActing", label: "Expression and Acting", max: 10 },
                { key: "bodyLanguage", label: "Body Language", max: 10 },
                { key: "teamworkAndPresence", label: "Team Work and Stage Presence", max: 15 },
                { key: "overallPerformance", label: "Overall Performance", max: 15 },
            ];
        }
        return null;
    }

    if (!isCinecarnicalCategory(categoryName)) return null;
    if (event.includes("short") && event.includes("film")) {
        return [
            { key: "socialMessage", label: "Social Message", max: 10 },
            { key: "direction", label: "Direction", max: 10 },
            { key: "editing", label: "Editing", max: 10 },
            { key: "cinematography", label: "Cinematography", max: 10 },
            { key: "dialogues", label: "Dialogues", max: 5 },
            { key: "screenplay", label: "Screenplay", max: 20 },
            { key: "acting", label: "Acting", max: 15 },
            { key: "sfx", label: "SFX", max: 5 },
            { key: "aiUsage", label: "AI Usage", max: 5 },
            { key: "inTimeLimit", label: "In Time Limit", max: 10 },
        ];
    }
    if (event.includes("cover") && event.includes("song")) {
        return [
            { key: "story", label: "Story", max: 10 },
            { key: "direction", label: "Direction", max: 10 },
            { key: "editing", label: "Editing", max: 10 },
            { key: "cinematography", label: "Cinematography", max: 10 },
            { key: "screenplay", label: "Screenplay", max: 20 },
            { key: "acting", label: "Acting", max: 15 },
            { key: "aiUsage", label: "AI Usage", max: 5 },
            { key: "inTimeLimit", label: "In Time Limit", max: 10 },
            { key: "understandableForEveryone", label: "Understandable for Everyone", max: 10 },
        ];
    }
    return null;
}

function parseStoredRemarks(remarks?: string | null): {
    judgeRemarks: string | null;
    criteriaScores: Record<string, number>;
} {
    if (!remarks) return { judgeRemarks: null, criteriaScores: {} };
    if (!remarks.startsWith(CRITERIA_REMARKS_PREFIX)) {
        return { judgeRemarks: remarks, criteriaScores: {} };
    }
    try {
        const raw = remarks.slice(CRITERIA_REMARKS_PREFIX.length);
        const parsed = JSON.parse(raw) as { judgeRemarks?: string | null; criteriaScores?: Record<string, number> };
        return {
            judgeRemarks: parsed?.judgeRemarks ?? null,
            criteriaScores: parsed?.criteriaScores || {},
        };
    } catch {
        return { judgeRemarks: null, criteriaScores: {} };
    }
}

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            select: { id: true, name: true, slug: true },
        });
        return { success: true, data: categories };
    } catch {
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
    } catch {
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
        const rubric = getEventRubric(eventDetails.Category?.name, eventDetails.name);

        let participants = [];

        if (eventDetails.isGroupEvent) {
            // Fetch Group Registrations
            const groups = await prisma.groupRegistration.findMany({
                where: { eventId: eventDetails.id },
                include: {
                    user: { select: { id: true, name: true, collageId: true } } // Leader
                }
            });

            // Fetch all evaluations for this event (include judge for per-judge breakdown)
            const evaluations = await prisma.evaluation.findMany({
                where: { eventId: eventDetails.id },
                include: {
                    judge: { select: { id: true, name: true } },
                },
            });

            // Construct result objects
            participants = groups.map(group => {
                const members = group.members as any[]; // Array of { userId, name, ... }

                // Team is evaluated once using team leader participantId.
                const teamEvals = evaluations.filter((e) => e.participantId === group.user.id);

                // Group evaluations by judge -> compute "team score per judge" as average across evaluated members
                const byJudge = new Map<string, { judgeId: string; judgeName: string | null; scores: number[]; remarks: string[] }>();
                for (const ev of teamEvals) {
                    const judgeId = ev.judgeId;
                    const judgeName = ev.judge?.name ?? null;
                    const entry = byJudge.get(judgeId) ?? { judgeId, judgeName, scores: [], remarks: [] };
                    entry.scores.push(ev.score);
                    const parsed = parseStoredRemarks(ev.remarks);
                    if (parsed.judgeRemarks) entry.remarks.push(parsed.judgeRemarks);
                    byJudge.set(judgeId, entry);
                }

                const judgeScores = Array.from(byJudge.values()).map((j) => {
                    const avg = j.scores.length > 0 ? j.scores.reduce((a, b) => a + b, 0) / j.scores.length : 0;
                    return {
                        judgeId: j.judgeId,
                        judgeName: j.judgeName,
                        score: parseFloat(avg.toFixed(2)),
                        remarks: j.remarks.length ? j.remarks.join(" | ") : null,
                    };
                });

                const criteriaBreakdown = rubric
                    ? rubric.map((criterion) => {
                        const criteriaValues = teamEvals
                            .map((ev) => parseStoredRemarks(ev.remarks).criteriaScores?.[criterion.key])
                            .filter((v): v is number => typeof v === "number");
                        const criteriaScore = criteriaValues.length
                            ? parseFloat(criteriaValues.reduce((a, b) => a + b, 0).toFixed(2))
                            : 0;
                        return {
                            key: criterion.key,
                            label: criterion.label,
                            max: criterion.max * (criteriaValues.length || 1),
                            score: criteriaScore,
                        };
                    })
                    : null;

                // Overall team average = average of per-judge averages (so each judge has equal weight)
                const averageScore =
                    judgeScores.length > 0
                        ? judgeScores.reduce((sum, j) => sum + j.score, 0) / judgeScores.length
                        : 0;

                // Collect all remarks (all judges, all members) for legacy UI display
                const allRemarks: string[] = [];
                judgeScores.forEach((j) => {
                    if (j.remarks) allRemarks.push(j.remarks);
                });

                return {
                    id: group.id,
                    name: group.groupName || `${group.user.name}'s Team`,
                    type: 'GROUP',
                    collageId: group.user.collageId,
                    score: parseFloat(averageScore.toFixed(2)), // Keep 2 decimals
                    isEvaluated: judgeScores.length > 0,
                    remarks: allRemarks.length > 0 ? allRemarks.join(' | ') : null,
                    judgeScores,
                    criteriaBreakdown,
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
                where: { eventId: eventDetails.id },
                include: {
                    judge: { select: { id: true, name: true } },
                },
            });

            participants = (eventWithParticipants?.individualRegistrations || []).map(reg => {
                const student = reg.user;
                const evals = evaluations.filter(e => e.participantId === student.id);
                // If multiple judges? 
                // Assuming single judge per participant for now as per current schema allowing one eval per judge per participant.
                // But if multiple judges evaluate same participant, we should average them.

                const judgeScores = evals.map((e) => ({
                    judgeId: e.judgeId,
                    judgeName: e.judge?.name ?? null,
                    score: parseFloat(e.score.toFixed(2)),
                    remarks: parseStoredRemarks(e.remarks).judgeRemarks,
                }));

                const criteriaBreakdown = rubric
                    ? rubric.map((criterion) => {
                        const criteriaValues = evals
                            .map((ev) => parseStoredRemarks(ev.remarks).criteriaScores?.[criterion.key])
                            .filter((v): v is number => typeof v === "number");
                        const criteriaScore = criteriaValues.length
                            ? parseFloat(criteriaValues.reduce((a, b) => a + b, 0).toFixed(2))
                            : 0;
                        return {
                            key: criterion.key,
                            label: criterion.label,
                            max: criterion.max * (criteriaValues.length || 1),
                            score: criteriaScore,
                        };
                    })
                    : null;

                let totalScore = 0;
                const allRemarks: string[] = [];
                if (judgeScores.length > 0) {
                    totalScore = judgeScores.reduce((sum, e) => sum + e.score, 0) / judgeScores.length;
                    judgeScores.forEach(e => {
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
                    remarks: allRemarks.length > 0 ? allRemarks.join(' | ') : null,
                    judgeScores,
                    criteriaBreakdown,
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
