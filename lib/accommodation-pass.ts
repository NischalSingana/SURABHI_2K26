import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

/**
 * Generate a unique pass token for accommodation
 */
export function generateAccommodationPassToken(): string {
    return randomBytes(32).toString("hex");
}

/**
 * Get accommodation pass details by token (for verification page - no marking as used)
 */
export async function getAccommodationPassDetails(passToken: string) {
    const booking = await prisma.accommodationBooking.findUnique({
        where: { passToken, status: "CONFIRMED", paymentStatus: "APPROVED" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    year: true,
                    gender: true,
                    state: true,
                    city: true,
                    individualRegistrations: {
                        where: { paymentStatus: "APPROVED" },
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    date: true,
                                    venue: true,
                                    Category: { select: { name: true } },
                                },
                            },
                        },
                    },
                    groupRegistrations: {
                        where: { paymentStatus: "APPROVED" },
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    date: true,
                                    venue: true,
                                    Category: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!booking) return null;

    const individualEvents = (booking.user.individualRegistrations || []).map((r: any) => ({
        name: r.event?.name,
        category: r.event?.Category?.name,
        date: r.event?.date,
        venue: r.event?.venue,
    }));
    const groupEvents = (booking.user.groupRegistrations || []).map((r: any) => ({
        name: r.event?.name,
        category: r.event?.Category?.name,
        date: r.event?.date,
        venue: r.event?.venue,
    }));

    return {
        ...booking,
        competitions: [...individualEvents, ...groupEvents],
        members: getMembersFromBooking(booking),
    };
}

function getMembersFromBooking(booking: any): { name: string; email: string; phone: string }[] {
    const members: { name: string; email: string; phone: string }[] = [
        { name: booking.primaryName, email: booking.primaryEmail, phone: booking.primaryPhone || "" },
    ];
    if (booking.groupMembers && Array.isArray(booking.groupMembers)) {
        for (const m of booking.groupMembers as any[]) {
            members.push({
                name: m.name || "Unknown",
                email: m.email || "",
                phone: m.phone || "",
            });
        }
    }
    return members;
}

/**
 * Verify accommodation pass and mark as used (check-in)
 */
export async function verifyAccommodationPass(passToken: string, scannerId?: string) {
    const booking = await prisma.accommodationBooking.findUnique({
        where: { passToken, status: "CONFIRMED", paymentStatus: "APPROVED" },
    });

    if (!booking) {
        return { valid: false, error: "Accommodation pass not found or invalid" };
    }

    if (booking.isUsed) {
        return {
            valid: false,
            error: "Accommodation has already been checked in",
            usedAt: booking.usedAt,
        };
    }

    await prisma.accommodationBooking.update({
        where: { id: booking.id },
        data: {
            isUsed: true,
            usedAt: new Date(),
            usedBy: scannerId ?? null,
        },
    });

    return {
        valid: true,
        booking: { id: booking.id },
    };
}
