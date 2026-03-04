
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

function getMaxScoreForEvent(categoryName?: string | null, eventName?: string | null): number {
    const category = normalizeText(categoryName);
    const event = normalizeText(eventName);
    if (category.includes("raaga")) {
        if (event.includes("voice") && event.includes("raaga")) return 40;
        if (event.includes("instrumental")) return 40;
        if (event.includes("battle") && event.includes("band")) return 50;
        return 10;
    }
    if (category.includes("natyaka")) {
        if (event.includes("mono") && event.includes("action")) return 50;
        if (event.includes("skit")) return 60;
        return 10;
    }
    if (isCinecarnicalCategory(categoryName)) {
        if (event.includes("short") && event.includes("film")) return 100;
        if (event.includes("cover") && event.includes("song")) return 100;
    }
    return 10;
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

        const maxScore = getMaxScoreForEvent(event.Category?.name, event.name);

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
