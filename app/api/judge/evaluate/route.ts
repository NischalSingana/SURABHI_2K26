
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const CRITERIA_REMARKS_PREFIX = "__CRITERIA__:";

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

type RubricCriterion = {
    key: string;
    label: string;
    max: number;
    description?: string;
};

function getEventRubric(categoryName?: string | null, eventName?: string | null): RubricCriterion[] | null {
    const category = normalizeText(categoryName);
    const event = normalizeText(eventName);

    if (category.includes("nrithya")) {
        if (event.includes("solo")) {
            return [
                { key: "choreography", label: "Choreography", max: 10 },
                { key: "confidence", label: "Confidence", max: 10 },
                { key: "expression", label: "Expression", max: 10 },
                { key: "costume", label: "Costume", max: 10 },
                { key: "stageUsage", label: "Stage Usage", max: 10 },
            ];
        }
        return [
            { key: "choreography", label: "Choreography", max: 10 },
            { key: "coordination", label: "Coordination", max: 10 },
            { key: "expression", label: "Expression", max: 10 },
            { key: "costume", label: "Costume", max: 10 },
            { key: "stageUsage", label: "Stage Usage", max: 10 },
        ];
    }

    if (category.includes("parliament") || category.includes("mock parliament") || event.includes("parliament")) {
        return [
            { key: "parliamentaryCommunication", label: "Parliamentary Communication", description: "Confidence, clarity, persuasion", max: 20 },
            { key: "strengthOfArguments", label: "Strength of Arguments", description: "Logical Reasoning, evidence, relevance", max: 15 },
            { key: "understandingOfBill", label: "Understanding of Bill / Policy", description: "Policy Knowledge, Realism", max: 15 },
            { key: "rebuttalPresenceOfMind", label: "Rebuttal & Presence of Mind", description: "Counter arguments, quick thinking", max: 10 },
            { key: "parliamentaryHouse", label: "Parliamentary House", description: "Taking Initiative, discussion", max: 10 },
            { key: "leadershipAndInitiative", label: "Leadership & Initiative", description: "Taking Initiative, discussion", max: 30 },
        ];
    }

    if (category.includes("raaga")) {
        if (event.includes("voice") && event.includes("raaga")) {
            return [
                { key: "scale", label: "Scale", max: 10 },
                { key: "tempo", label: "Tempo", max: 10 },
                { key: "stagePresence", label: "Stage Presence", max: 10 },
                { key: "dynamics", label: "Dynamics", max: 10 },
            ];
        }
        if (event.includes("instrumental")) {
            return [
                { key: "scale", label: "Scale", max: 10 },
                { key: "tempo", label: "Tempo", max: 10 },
                { key: "stagePresence", label: "Stage Presence", max: 10 },
                { key: "dynamics", label: "Dynamics", max: 10 },
            ];
        }
        if (event.includes("battle") && event.includes("band")) {
            return [
                { key: "coordination", label: "Co-ordination", max: 10 },
                { key: "scale", label: "Scale", max: 10 },
                { key: "tempo", label: "Tempo", max: 10 },
                { key: "stagePresence", label: "Stage Presence", max: 10 },
                { key: "dynamics", label: "Dynamics", max: 10 },
            ];
        }
    }

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

function getEventMaxScore(categoryName?: string | null, eventName?: string | null): number {
    const rubric = getEventRubric(categoryName, eventName);
    if (!rubric) return 10;
    return rubric.reduce((sum, item) => sum + item.max, 0);
}

function buildStoredRemarks(
    remarks?: string | null,
    criteriaScores?: Record<string, number>
): string | null {
    const cleanedRemarks = remarks?.trim() || null;
    if (!criteriaScores || Object.keys(criteriaScores).length === 0) {
        return cleanedRemarks;
    }

    const payload = {
        criteriaScores,
        judgeRemarks: cleanedRemarks,
    };
    return `${CRITERIA_REMARKS_PREFIX}${JSON.stringify(payload)}`;
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "JUDGE") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { eventId, participantId, score, remarks, criteriaScores, round = 1 } = body;

        if (!eventId || !participantId || score === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: {
                name: true,
                Category: { select: { name: true } },
            },
        });
        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const maxScore = getEventMaxScore(event.Category?.name, event.name);

        // Ensure score is within valid range, can be decimal
        const scoreNum = typeof score === 'number' ? score : parseFloat(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
            return NextResponse.json({ error: `Score must be a number between 0 and ${maxScore} (decimals allowed)` }, { status: 400 });
        }
        
        // Round to 1 decimal place for storage
        const roundedScore = Math.round(scoreNum * 10) / 10;

        const evaluation = await prisma.evaluation.upsert({
            where: {
                judgeId_eventId_participantId_round: {
                    judgeId: session.user.id,
                    eventId,
                    participantId,
                    round
                }
            },
            update: {
                score: roundedScore,
                remarks: buildStoredRemarks(remarks, criteriaScores)
            },
            create: {
                judgeId: session.user.id,
                eventId,
                participantId,
                round,
                score: roundedScore,
                remarks: buildStoredRemarks(remarks, criteriaScores)
            }
        });

        return NextResponse.json(evaluation);

    } catch (error) {
        console.error("Error submitting evaluation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
