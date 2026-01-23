
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

        // Ensure score is within valid range (1-10), can be decimal
        const scoreNum = typeof score === 'number' ? score : parseFloat(score);
        if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 10) {
            return NextResponse.json({ error: "Score must be a number between 1 and 10 (decimals allowed)" }, { status: 400 });
        }
        
        // Round to 2 decimal places for storage
        const roundedScore = Math.round(scoreNum * 100) / 100;

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
