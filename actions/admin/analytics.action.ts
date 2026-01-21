"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export async function getUserStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const [
            totalUsers,
            approvedUsers,
            pendingUsers,
            paymentApproved,
            paymentPending,
            paymentRejected
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isApproved: true } }),
            prisma.user.count({ where: { isApproved: false } }),
            prisma.user.count({ where: { paymentStatus: "APPROVED" } }),
            prisma.user.count({ where: { paymentStatus: "PENDING" } }),
            prisma.user.count({ where: { paymentStatus: "REJECTED" } }),
        ]);

        return {
            success: true,
            stats: {
                total: totalUsers,
                approved: approvedUsers,
                pending: pendingUsers,
                paymentApproved,
                paymentPending,
                paymentRejected,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getEventStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const totalEvents = await prisma.event.count();
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        Event: true,
                    },
                },
            },
        });

        const eventRegistrations = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        individualRegistrations: true,
                        groupRegistrations: true,
                    },
                },
            },
        });

        return {
            success: true,
            stats: {
                totalEvents,
                categories: categories.map((cat) => ({
                    name: cat.name,
                    eventCount: cat._count.Event,
                })),
                registrations: eventRegistrations.map((event) => ({
                    name: event.name,
                    count: event._count.individualRegistrations + event._count.groupRegistrations,
                })),
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getAccommodationStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const [
            totalBookings,
            individualBookings,
            groupBookings,
            maleBookings,
            femaleBookings,
            confirmedBookings,
            pendingBookings,
            cancelledBookings,
            totalMembersAgg
        ] = await Promise.all([
            prisma.accommodationBooking.count(),
            prisma.accommodationBooking.count({ where: { bookingType: "INDIVIDUAL" } }),
            prisma.accommodationBooking.count({ where: { bookingType: "GROUP" } }),
            prisma.accommodationBooking.count({ where: { gender: "MALE" } }),
            prisma.accommodationBooking.count({ where: { gender: "FEMALE" } }),
            prisma.accommodationBooking.count({ where: { status: "CONFIRMED" } }),
            prisma.accommodationBooking.count({ where: { status: "PENDING" } }),
            prisma.accommodationBooking.count({ where: { status: "CANCELLED" } }),
            prisma.accommodationBooking.aggregate({
                _sum: {
                    totalMembers: true
                }
            })
        ]);

        return {
            success: true,
            stats: {
                totalBookings,
                individualBookings,
                groupBookings,
                maleBookings,
                femaleBookings,
                confirmedBookings,
                pendingBookings,
                cancelledBookings,
                totalMembers: totalMembersAgg._sum.totalMembers || 0,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
