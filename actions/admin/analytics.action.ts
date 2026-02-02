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

export async function getDetailedEventRegistrations() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                isGroupEvent: true,
                Category: {
                    select: {
                        name: true,
                    },
                },
                individualRegistrations: {
                    select: {
                        id: true,
                        createdAt: true,
                        paymentStatus: true,
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
                                state: true,
                                city: true,
                                country: true,
                                isInternational: true,
                                gender: true,
                            },
                        },
                    },
                },
                groupRegistrations: {
                    select: {
                        id: true,
                        groupName: true,
                        mentorName: true,
                        mentorPhone: true,
                        members: true,
                        createdAt: true,
                        paymentStatus: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                collage: true,
                                collageId: true,
                                state: true,
                                city: true,
                                country: true,
                                isInternational: true,
                                gender: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return {
            success: true,
            events: events.map((event) => ({
                id: event.id,
                name: event.name,
                category: event.Category.name,
                isGroupEvent: event.isGroupEvent,
                totalRegistrations:
                    event.individualRegistrations.length + event.groupRegistrations.length,
                individualCount: event.individualRegistrations.length,
                groupCount: event.groupRegistrations.length,
                individualRegistrations: event.individualRegistrations,
                groupRegistrations: event.groupRegistrations,
            })),
        };
    } catch (error: any) {
        console.error("Error fetching detailed event registrations:", error);
        return { success: false, error: error.message };
    }
}
