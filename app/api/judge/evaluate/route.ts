
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

function normalizeText(value?: string | null): string {
    return (value || "").trim().toLowerCase();
}

function getMaxScoreForEvent(categoryName?: string | null, eventName?: string | null): number {
    const category = normalizeText(categoryName);
    const event = normalizeText(eventName);
    if (!category.includes("natyaka")) return 10;
    if (event.includes("mono") && event.includes("action")) return 50;
    if (event.includes("skit")) return 60;
    return 10;
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
        const { eventId, participantId, score, remarks } = body;

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
                judgeId_eventId_participantId: {
                    judgeId: session.user.id,
                    eventId,
                    participantId
                }
            },
            update: {
                score: roundedScore,
                remarks
            },
            create: {
                judgeId: session.user.id,
                eventId,
                participantId,
                score: roundedScore,
                remarks
            }
        });

        return NextResponse.json(evaluation);

    } catch (error) {
        console.error("Error submitting evaluation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
