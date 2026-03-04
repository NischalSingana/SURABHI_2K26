
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
            console.warn("Judge Data Access Denied:", session?.user?.email, "Role:", session?.user?.role);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventId = (session.user as any).assignedEventId;
        console.log("Judge Data Fetch:", {
            email: session.user.email,
            role: session.user.role,
            assignedEventId: eventId,
            userId: session.user.id
        });

        if (!eventId) {
            console.error("No event assigned for judge:", session.user.email);
            return NextResponse.json({ error: "No event assigned to this judge. Please contact Master Admin." }, { status: 400 });
        }

        // Fetch the assigned event with all necessary data
        const event = await (prisma.event as any).findUnique({
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
                    }
                },
                // Include category info
                Category: true
            }
        });

        if (!event) {
            console.error("Event not found for ID:", eventId);
            return NextResponse.json({ error: `Event not found (${eventId})` }, { status: 404 });
        }

        // Return as array for compatibility with frontend
        const safeEvent = event as any;
        const events = [safeEvent];

        return NextResponse.json({
            events,
            categoryName: safeEvent.Category?.name
        });

    } catch (error: any) {
        console.error("Error fetching judge data:", error);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            details: error?.message || "Unknown error" 
        }, { status: 500 });
    }
}
