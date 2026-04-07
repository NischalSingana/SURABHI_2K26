"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role, BookingStatus, PaymentStatus, BookingType, Gender } from "@prisma/client";
import { generateAccommodationPassToken } from "@/lib/accommodation-pass";
import { generateAccommodationPassPDF } from "@/lib/pdf-generator";
import { sendAccommodationConfirmationEmail } from "@/lib/zeptomail";

export async function getAllBookings(filters?: {
    bookingType?: BookingType;
    gender?: Gender;
    paymentStatus?: PaymentStatus;
    status?: BookingStatus;
}) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const where: any = {};

        if (filters?.bookingType) {
            where.bookingType = filters.bookingType;
        }

        if (filters?.gender) {
            where.gender = filters.gender;
        }

        if (filters?.paymentStatus) {
            where.paymentStatus = filters.paymentStatus;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        const bookings = await prisma.accommodationBooking.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        collage: true,
                        individualRegistrations: {
                            where: {
                                paymentStatus: "APPROVED",
                            },
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date: true,
                                        venue: true,
                                        startTime: true,
                                        endTime: true,
                                        Category: {
                                            select: {
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        groupRegistrations: {
                            where: {
                                paymentStatus: "APPROVED",
                            },
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date: true,
                                        venue: true,
                                        startTime: true,
                                        endTime: true,
                                        Category: {
                                            select: {
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Convert Decimal to string for serialization and handle nested dates
        const serializedBookings = bookings.map((booking) => ({
            ...booking,
            amount: booking.amount ? booking.amount.toString() : null,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
            user: {
                ...booking.user,
                individualRegistrations: booking.user.individualRegistrations.map((reg: any) => ({
                    ...reg,
                    createdAt: reg.createdAt.toISOString(),
                    updatedAt: reg.updatedAt.toISOString(),
                    event: reg.event ? {
                        ...reg.event,
                        date: reg.event.date.toISOString(),
                    } : null,
                })),
                groupRegistrations: booking.user.groupRegistrations.map((reg: any) => ({
                    ...reg,
                    createdAt: reg.createdAt.toISOString(),
                    updatedAt: reg.updatedAt.toISOString(),
                    event: reg.event ? {
                        ...reg.event,
                        date: reg.event.date.toISOString(),
                    } : null,
                })),
            },
        }));

        return { success: true, bookings: serializedBookings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveBooking(bookingId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const passToken = generateAccommodationPassToken();

        const booking = await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.APPROVED,
                passToken,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        collage: true,
                        collageId: true,
                        individualRegistrations: {
                            where: { paymentStatus: "APPROVED" },
                            include: {
                                event: {
                                    select: {
                                        name: true,
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
                                        name: true,
                                        Category: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const members = [
            { name: booking.primaryName, email: booking.primaryEmail, phone: booking.primaryPhone || "" },
            ...((booking.groupMembers as any[]) || []).map((m: any) => ({
                name: m.name || "Unknown",
                email: m.email || "",
                phone: m.phone || "",
            })),
        ];

        const individualEvents = (booking.user.individualRegistrations || []).map((r: any) => ({
            name: r.event?.name,
            category: r.event?.Category?.name,
        }));
        const groupEvents = (booking.user.groupRegistrations || []).map((r: any) => ({
            name: r.event?.name,
            category: r.event?.Category?.name,
        }));
        const competitions = [...individualEvents, ...groupEvents];

        const pdfData = {
            passToken,
            primaryName: booking.primaryName,
            primaryEmail: booking.primaryEmail,
            primaryPhone: booking.primaryPhone || "",
            collage: booking.user.collage,
            collageId: booking.user.collageId,
            gender: booking.gender,
            bookingType: booking.bookingType,
            members,
            competitions,
        };

        const pdfBuffer = await generateAccommodationPassPDF(pdfData);

        await sendAccommodationConfirmationEmail(
            { name: booking.user.name || booking.primaryName, email: booking.primaryEmail },
            {
                primaryName: booking.primaryName,
                primaryEmail: booking.primaryEmail,
                primaryPhone: booking.primaryPhone || "",
                bookingType: booking.bookingType,
                gender: booking.gender,
                totalMembers: booking.totalMembers,
                members,
                competitions,
            },
            pdfBuffer
        );

        return { success: true, message: "Booking approved successfully. Email sent with accommodation pass." };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectBooking(bookingId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.REJECTED,
            },
        });

        return { success: true, message: "Booking rejected" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: { status },
        });

        return { success: true, message: "Booking status updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
