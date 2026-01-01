
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

        // Ensure score is within valid range (0-10)
        if (score < 0 || score > 10) {
            return NextResponse.json({ error: "Score must be between 0 and 10" }, { status: 400 });
        }

        const evaluation = await prisma.evaluation.upsert({
            where: {
                judgeId_eventId_participantId: {
                    judgeId: session.user.id,
                    eventId,
                    participantId
                }
            },
            update: {
                score,
                remarks
            },
            create: {
                judgeId: session.user.id,
                eventId,
                participantId,
                score,
                remarks
            }
        });

        return NextResponse.json(evaluation);

    } catch (error) {
        console.error("Error submitting evaluation:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
