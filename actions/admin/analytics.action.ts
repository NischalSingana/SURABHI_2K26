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

        const totalUsers = await prisma.user.count();
        const approvedUsers = await prisma.user.count({
            where: { isApproved: true },
        });
        const pendingUsers = await prisma.user.count({
            where: { isApproved: false },
        });

        const paymentApproved = await prisma.user.count({
            where: { paymentStatus: "APPROVED" },
        });
        const paymentPending = await prisma.user.count({
            where: { paymentStatus: "PENDING" },
        });
        const paymentRejected = await prisma.user.count({
            where: { paymentStatus: "REJECTED" },
        });

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
                        registeredStudents: true,
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
                    count: event._count.registeredStudents,
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

        const totalBookings = await prisma.accommodationBooking.count();
        const individualBookings = await prisma.accommodationBooking.count({
            where: { bookingType: "INDIVIDUAL" },
        });
        const groupBookings = await prisma.accommodationBooking.count({
            where: { bookingType: "GROUP" },
        });

        const maleBookings = await prisma.accommodationBooking.count({
            where: { gender: "MALE" },
        });
        const femaleBookings = await prisma.accommodationBooking.count({
            where: { gender: "FEMALE" },
        });

        const confirmedBookings = await prisma.accommodationBooking.count({
            where: { status: "CONFIRMED" },
        });
        const pendingBookings = await prisma.accommodationBooking.count({
            where: { status: "PENDING" },
        });
        const cancelledBookings = await prisma.accommodationBooking.count({
            where: { status: "CANCELLED" },
        });

        // Calculate total members
        const bookings = await prisma.accommodationBooking.findMany({
            select: {
                totalMembers: true,
            },
        });
        const totalMembers = bookings.reduce((sum, b) => sum + b.totalMembers, 0);

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
                totalMembers,
            },
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
