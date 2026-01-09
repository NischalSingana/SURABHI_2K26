"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getEvaluations() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER" && session.user.role !== "MANAGER")) {
            return { success: false, error: "Unauthorized" };
        }

        const eventsWithEvaluations = await prisma.event.findMany({
            where: {
                evaluations: {
                    some: {} // Only fetch events that have at least one evaluation
                }
            },
            include: {
                evaluations: {
                    include: {
                        participant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                collageId: true
                            }
                        },
                        judge: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        score: 'desc'
                    }
                },
                groupRegistrations: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                Category: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return { success: true, data: eventsWithEvaluations };

    } catch (error) {
        console.error("Error fetching evaluations:", error);
        return { success: false, error: "Failed to fetch evaluations" };
    }
}
