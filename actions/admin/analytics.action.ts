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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        // Get start of today (local time consideration might be needed, using server time for now)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                Category: {
                    select: {
                        name: true,
                    },
                },
                individualRegistrations: {
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: {
                        createdAt: true,
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
                groupRegistrations: {
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: {
                        createdAt: true,
                        members: true,
                        user: {
                            select: {
                                email: true,
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

            const isKL = (email: string) => email.endsWith("@kluniversity.in");
            const isToday = (date: Date) => new Date(date) >= today;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getParticipantCount = (groupRegs: any[]) => {
                return groupRegs.reduce((acc, reg) => {
                    const members = reg.members;
                    const memberCount = Array.isArray(members) ? members.length : (members ? Object.keys(members).length : 0);
                    return acc + 1 + memberCount;
                }, 0);
            };

            // KL Stats
            const klIndividualTotal = individualRegs.filter(r => isKL(r.user.email)).length;
            const klGroupRegs = groupRegs.filter(r => isKL(r.user.email));
            const klGroupParticipants = getParticipantCount(klGroupRegs);
            const klTotal = klIndividualTotal + klGroupParticipants;

            const klIndividualNew = individualRegs.filter(r => isKL(r.user.email) && isToday(r.createdAt)).length;
            const klGroupRegsNew = groupRegs.filter(r => isKL(r.user.email) && isToday(r.createdAt));
            const klGroupParticipantsNew = getParticipantCount(klGroupRegsNew);
            const klNewToday = klIndividualNew + klGroupParticipantsNew;

            // Non-KL Stats
            const nonKlIndividualTotal = individualRegs.filter(r => !isKL(r.user.email)).length;
            const nonKlGroupRegs = groupRegs.filter(r => !isKL(r.user.email));
            const nonKlGroupParticipants = getParticipantCount(nonKlGroupRegs);
            const nonKlTotal = nonKlIndividualTotal + nonKlGroupParticipants;

            const nonKlIndividualNew = individualRegs.filter(r => !isKL(r.user.email) && isToday(r.createdAt)).length;
            const nonKlGroupRegsNew = groupRegs.filter(r => !isKL(r.user.email) && isToday(r.createdAt));
            const nonKlGroupParticipantsNew = getParticipantCount(nonKlGroupRegsNew);
            const nonKlNewToday = nonKlIndividualNew + nonKlGroupParticipantsNew;

            return {
                eventId: event.id,
                eventName: event.name,
                categoryName: event.Category.name,
                klStats: {
                    total: klTotal,
                    newToday: klNewToday,
                    previousTotal: klTotal - klNewToday
                },
                nonKlStats: {
                    total: nonKlTotal,
                    newToday: nonKlNewToday,
                    previousTotal: nonKlTotal - nonKlNewToday
                }
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
