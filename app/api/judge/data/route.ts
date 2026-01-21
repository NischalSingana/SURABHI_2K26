
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

        const categoryId = session.user.assignedCategoryId;

        if (!categoryId) {
            return NextResponse.json({ error: "No category assigned to this judge" }, { status: 400 });
        }

        // Fetch events in the assigned category
        const events = await prisma.event.findMany({
            where: {
                categoryId: categoryId
            },
            include: {
                // Include registered users (individual)
                // Include registered users (individual)
                individualRegistrations: {
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
                }
            }
        });

        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });

        return NextResponse.json({
            events,
            categoryName: category?.name
        });

    } catch (error) {
        console.error("Error fetching judge data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
