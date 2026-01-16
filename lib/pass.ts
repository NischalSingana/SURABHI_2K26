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
 * Verify a pass by token
 */
export async function verifyPass(passToken: string, scannerId?: string) {
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
        return {
            valid: false,
            error: "Pass not found",
        };
    }

    // Check if pass is active
    if (!pass.isActive) {
        return {
            valid: false,
            error: "Pass is inactive",
        };
    }

    // Check if pass is expired
    if (pass.expiresAt && pass.expiresAt < new Date()) {
        return {
            valid: false,
            error: "Pass has expired",
        };
    }

    // Check if pass is already used
    if (pass.isUsed) {
        return {
            valid: false,
            error: "Pass has already been used",
            usedAt: pass.usedAt,
        };
    }

    // Check if user is approved
    if (!pass.user.isApproved || pass.user.paymentStatus !== "APPROVED") {
        return {
            valid: false,
            error: "User is not approved details invalid",
        };
    }

    // Mark pass as used
    await prisma.pass.update({
        where: { id: pass.id },
        data: {
            isUsed: true,
            usedAt: new Date(),
            usedBy: scannerId || null,
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
 * Get pass details by token (without marking as used)
 */
export async function getPassDetails(passToken: string) {
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

    // Fetch Event Details if eventId exists
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
            }
        });

        if (event?.isGroupEvent) {
            groupRegistration = await prisma.groupRegistration.findFirst({
                where: {
                    eventId: pass.eventId,
                    userId: pass.userId // Assuming the pass holder is the one who registered (Team Lead)
                }
            });

            // If the pass holder is NOT the team lead, we might need to find which group they belong to.
            // However, the current logic in `app/api/ticket/download` suggests only the Team Lead gets the ticket/registration.
            // Depending on how `groupRegistration` is stored (if members are just JSON), finding a member's group by their ID 
            // inside the JSON is hard. For now, we assume the pass owner is the PRIMARY registrant.
            // If we needed to support members having their own passes, we'd need to change this logic 
            // to search where `members` array contains the user, or `userId` matches.
        }
    }

    return {
        ...pass,
        event,
        groupRegistration
    };
}
