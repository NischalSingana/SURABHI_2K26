"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { isRegistrationComplete } from "@/lib/registration-check";

export async function getUserStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.GOD)) {
            throw new Error("Unauthorized");
        }

        const [
            totalUsers,
            approvedUsers,
            paymentApproved,
            paymentRejected,
            usersForRegistrationCheck,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isApproved: true } }),
            prisma.user.count({ where: { paymentStatus: "APPROVED" } }),
            prisma.user.count({ where: { paymentStatus: "REJECTED" } }),
            prisma.user.findMany({
                select: {
                    isApproved: true,
                    isInternational: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    year: true,
                    phone: true,
                    state: true,
                    city: true,
                    country: true,
                },
            }),
        ]);

        let pendingUsers = 0;
        let incompleteUsers = 0;

        for (const user of usersForRegistrationCheck) {
            const complete = isRegistrationComplete(user);
            if (!complete) {
                incompleteUsers += 1;
                continue;
            }
            if (!user.isApproved) {
                pendingUsers += 1;
            }
        }

        return {
            success: true,
            stats: {
                total: totalUsers,
                approved: approvedUsers,
                pending: pendingUsers,
                paymentApproved,
                paymentPending: incompleteUsers,
                paymentRejected,
            },
        };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getEventStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.GOD)) {
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
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getAccommodationStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.GOD)) {
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
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getDetailedEventRegistrations() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.GOD)) {
            throw new Error("Unauthorized");
        }

        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                date: true,
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
    } catch (error: unknown) {
        console.error("Error fetching detailed event registrations:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getDailyReportStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.GOD)) {
            throw new Error("Unauthorized");
        }

        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                date: true,
                isGroupEvent: true,
                Category: {
                    select: {
                        name: true,
                    },
                },
                individualRegistrations: {
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: {
                        isVirtual: true,
                        user: {
                            select: {
                                email: true,
                                collage: true,
                            },
                        },
                    },
                },
                groupRegistrations: {
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: {
                        isVirtual: true,
                        members: true,
                        user: {
                            select: {
                                email: true,
                                collage: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                Category: {
                    name: "asc", 
                }
            }
        });

        // Process data for the report
        const reportData = events.map(event => {
            const individualRegs = event.individualRegistrations;
            const groupRegs = event.groupRegistrations;

            const isKL = (user: { email?: string | null; collage?: string | null }) => {
                const email = (user.email || "").toLowerCase();
                const collage = (user.collage || "").toLowerCase();
                return (
                    email.endsWith("@kluniversity.in") ||
                    collage.includes("kl university") ||
                    collage.includes("koneru") ||
                    collage.includes("klef")
                );
            };

            const getTeamParticipants = (members: unknown) => {
                const memberCount = Array.isArray(members)
                    ? members.length
                    : members && typeof members === "object"
                        ? Object.keys(members as Record<string, unknown>).length
                        : 0;
                return 1 + memberCount; // team lead + members
            };

            const klIndividualParticipants = individualRegs.filter(r => isKL(r.user)).length;
            const otherIndividualParticipants = individualRegs.filter(r => !isKL(r.user)).length;

            const klTeamRegs = groupRegs.filter(r => isKL(r.user));
            const otherTeamRegs = groupRegs.filter(r => !isKL(r.user));
            const klTeamParticipants = klTeamRegs.reduce((acc, reg) => acc + getTeamParticipants(reg.members), 0);
            const otherTeamParticipants = otherTeamRegs.reduce((acc, reg) => acc + getTeamParticipants(reg.members), 0);

            const klTeams = klTeamRegs.length;
            const otherTeams = otherTeamRegs.length;

            const eventVirtualParticipants =
                individualRegs.reduce((acc, reg) => acc + (reg.isVirtual ? 1 : 0), 0) +
                groupRegs.reduce((acc, reg) => acc + (reg.isVirtual ? getTeamParticipants(reg.members) : 0), 0);
            const eventPhysicalParticipants =
                individualRegs.reduce((acc, reg) => acc + (!reg.isVirtual ? 1 : 0), 0) +
                groupRegs.reduce((acc, reg) => acc + (!reg.isVirtual ? getTeamParticipants(reg.members) : 0), 0);
            const eventTotalParticipants = eventVirtualParticipants + eventPhysicalParticipants;

            const totalParticipantsByCollege = klIndividualParticipants + otherIndividualParticipants + klTeamParticipants + otherTeamParticipants;
            const totalTeams = klTeams + otherTeams;

            return {
                eventId: event.id,
                eventName: event.name,
                eventDate: event.date.toISOString(),
                categoryName: event.Category.name,
                isGroupEvent: event.isGroupEvent,
                participants: {
                    kl: klIndividualParticipants + klTeamParticipants,
                    other: otherIndividualParticipants + otherTeamParticipants,
                    total: totalParticipantsByCollege,
                },
                teams: {
                    kl: klTeams,
                    other: otherTeams,
                    total: totalTeams,
                },
                virtualParticipants: eventVirtualParticipants,
                physicalParticipants: eventPhysicalParticipants,
                totalParticipants: eventTotalParticipants,
            };
        });

        return {
            success: true,
            data: reportData,
            timestamp: new Date().toISOString()
        };

    } catch (error: unknown) {
        console.error("Error fetching daily report stats:", error);
        return { success: false, error: (error as Error).message };
    }
}
