
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "JUDGE") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventId = session.user.assignedEventId;

        if (!eventId) {
            return NextResponse.json({ error: "No event assigned to this judge" }, { status: 400 });
        }

        // Fetch the assigned event with all necessary data
        const event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                // Include registered users (individual)
                individualRegistrations: {
                    where: {
                        paymentStatus: "APPROVED"
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                collageId: true,
                                image: true
                            }
                        }
                    }
                },
                // Include group registrations
                groupRegistrations: {
                    where: {
                        paymentStatus: "APPROVED"
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                collageId: true
                            }
                        }
                    }
                },
                // Include evaluations made by this judge
                evaluations: {
                    where: {
                        judgeId: session.user.id
                    },
                    select: {
                        id: true,
                        score: true,
                        remarks: true,
                        participantId: true
                    }
                },
                // Include category info
                Category: true
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Return as array for compatibility with frontend
        const events = [event];

        return NextResponse.json({
            events,
            categoryName: event.Category?.name
        });

    } catch (error) {
        console.error("Error fetching judge data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
