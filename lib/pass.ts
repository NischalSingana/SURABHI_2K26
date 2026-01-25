import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * Generate a unique pass token
 */
export function generatePassToken(): string {
    // Generate a secure random token
    return randomBytes(32).toString('hex');
}

/**
 * Create a pass for a user
 */
export async function createPass(
    userId: string,
    options?: {
        eventId?: string;
        passType?: string;
        expiresAt?: Date;
    }
) {
    const passToken = generatePassToken();

    const pass = await prisma.pass.create({
        data: {
            userId,
            passToken,
            eventId: options?.eventId || null,
            passType: options?.passType || "GENERAL",
            expiresAt: options?.expiresAt || null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    collage: true,
                    collageId: true,
                },
            },
        },
    });

    return pass;
}

/**
 * Verify a pass by token (visitor pass from VisitorPassRegistration or legacy Pass)
 */
export async function verifyPass(passToken: string, scannerId?: string) {
    const visitor = await prisma.visitorPassRegistration.findUnique({
        where: { passToken },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    year: true,
                    phone: true,
                },
            },
        },
    });

    if (visitor && visitor.paymentStatus === "APPROVED") {
        if (visitor.isUsed) {
            return {
                valid: false,
                error: "Pass has already been used",
                usedAt: visitor.usedAt,
            };
        }
        await prisma.visitorPassRegistration.update({
            where: { id: visitor.id },
            data: {
                isUsed: true,
                usedAt: new Date(),
                usedBy: scannerId ?? null,
            },
        });
        return {
            valid: true,
            pass: {
                id: visitor.id,
                passType: "VISITOR",
                user: visitor.user,
                createdAt: visitor.createdAt,
            },
        };
    }

    const pass = await prisma.pass.findUnique({
        where: { passToken },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    collage: true,
                    collageId: true,
                    isApproved: true,
                    paymentStatus: true,
                    branch: true,
                    year: true,
                    phone: true,
                },
            },
        },
    });

    if (!pass) {
        return { valid: false, error: "Pass not found" };
    }

    if (!pass.isActive) {
        return { valid: false, error: "Pass is inactive" };
    }
    if (pass.expiresAt && pass.expiresAt < new Date()) {
        return { valid: false, error: "Pass has expired" };
    }
    if (pass.isUsed) {
        return {
            valid: false,
            error: "Pass has already been used",
            usedAt: pass.usedAt,
        };
    }
    if (!pass.user.isApproved || pass.user.paymentStatus !== "APPROVED") {
        return { valid: false, error: "User is not approved details invalid" };
    }

    await prisma.pass.update({
        where: { id: pass.id },
        data: {
            isUsed: true,
            usedAt: new Date(),
            usedBy: scannerId ?? null,
        },
    });

    return {
        valid: true,
        pass: {
            id: pass.id,
            passType: pass.passType,
            user: pass.user,
            createdAt: pass.createdAt,
        },
    };
}

/**
 * Get all passes for a user
 */
export async function getUserPasses(userId: string) {
    return await prisma.pass.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Get pass details by token (without marking as used).
 * Checks VisitorPassRegistration first, then legacy Pass.
 */
export async function getPassDetails(passToken: string) {
    const visitor = await prisma.visitorPassRegistration.findUnique({
        where: { passToken },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    year: true,
                    phone: true,
                    isApproved: true,
                    paymentStatus: true,
                },
            },
        },
    });

    if (visitor && visitor.paymentStatus === "APPROVED") {
        return {
            id: visitor.id,
            passToken: visitor.passToken,
            userId: visitor.userId,
            user: visitor.user,
            paymentStatus: visitor.paymentStatus,
            createdAt: visitor.createdAt,
            updatedAt: visitor.updatedAt,
            event: null,
            groupRegistration: null,
            expiresAt: null as Date | null,
            isActive: true,
            isUsed: visitor.isUsed,
            usedAt: visitor.usedAt,
            passType: "VISITOR",
        };
    }

    const pass = await prisma.pass.findUnique({
        where: { passToken },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    year: true,
                    phone: true,
                    isApproved: true,
                    paymentStatus: true,
                },
            },
        },
    });

    if (!pass) return null;

    let event = null;
    let groupRegistration = null;

    if (pass.eventId) {
        event = await prisma.event.findUnique({
            where: { id: pass.eventId },
            select: {
                name: true,
                isGroupEvent: true,
                venue: true,
                date: true,
                minTeamSize: true, // Useful for showing team size in requirements
                maxTeamSize: true,
            }
        });

        if (event?.isGroupEvent) {
            // First try to find if they are the leader (userId matches)
            groupRegistration = await prisma.groupRegistration.findFirst({
                where: {
                    eventId: pass.eventId,
                    userId: pass.userId
                },
                include: {
                    user: { // Leader details
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            collage: true,
                            collageId: true,
                        }
                    }
                }
            });

            // If not found as leader, try to find if they are a member
            if (!groupRegistration) {
                // We have to search using raw query or constraints because members is JSON
                // Using array_contains is tricky with Prisma JSON, but we can try to find registrations
                // where the members array contains an object with this user's details or just simple find
                // Since members is just a JSON, we might have to fetch all group registrations for this event
                // and filter in code if database allows, OR better: 
                // Since this is a critical fetch, let's try raw query if needed, OR 
                // just rely on the fact that ONLY LEADER usually gets the pass in current logic.
                // BUT, user wants members to scanning to show details.

                // Let's try to find if the pass owner's email matches a member email in the JSON
                const allEventGroups = await prisma.groupRegistration.findMany({
                    where: { eventId: pass.eventId },
                    include: {
                        user: { // Leader details
                            select: {
                                name: true,
                                email: true,
                                phone: true,
                                collage: true,
                                collageId: true,
                            }
                        }
                    }
                });

                // Filter in memory (not efficient for huge datasets, but fine for college fest)
                const userEmail = pass.user.email;
                groupRegistration = allEventGroups.find(g => {
                    const members = g.members as any[];
                    if (!Array.isArray(members)) return false;
                    // Check if any member has the same email or phone or some identifier
                    // Usually members JSON has { name, email, ... }
                    return members.some((m: any) => m.email === userEmail || m.mail === userEmail); // handling potential key variations
                }) || null;
            }
        }
    }

    return {
        ...pass,
        event,
        // Ensure groupRegistration includes the leader user details as 'user'
        groupRegistration
    };
}
