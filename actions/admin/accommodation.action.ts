"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role, BookingStatus, PaymentStatus, BookingType, Gender } from "@prisma/client";

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
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Convert Decimal to string for serialization
        const serializedBookings = bookings.map((booking) => ({
            ...booking,
            amount: booking.amount ? booking.amount.toString() : null,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
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

        await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.APPROVED,
            },
        });

        return { success: true, message: "Booking approved successfully" };
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
