"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role, PaymentStatus } from "@/lib/generated/prisma";
import { sendEmail, emailTemplates } from "../../lib/email";

export async function getAllUsers(filters?: {
    paymentStatus?: PaymentStatus;
    isApproved?: boolean;
    role?: Role;
}) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.ADMIN) {
            throw new Error("Unauthorized");
        }

        const where: any = {};

        if (filters?.paymentStatus) {
            where.paymentStatus = filters.paymentStatus;
        }

        if (filters?.isApproved !== undefined) {
            where.isApproved = filters.isApproved;
        }

        if (filters?.role) {
            where.role = filters.role;
        }

        const users = await prisma.user.findMany({
            where,
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
                transactionId: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        registeredEvents: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Serialize dates for Next.js
        const serializedUsers = users.map((user) => ({
            ...user,
            createdAt: user.createdAt.toISOString(),
        }));

        return { success: true, users: serializedUsers };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approveUser(userId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.ADMIN) {
            throw new Error("Unauthorized");
        }

        // Get user details before updating
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isApproved: true },
        });

        // Send approval email
        const emailTemplate = emailTemplates.userApproved(user.name || "", user.email);
        await sendEmail({
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        });

        return { success: true, message: "User approved successfully and email sent" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectUser(userId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.ADMIN) {
            throw new Error("Unauthorized");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isApproved: false },
        });

        return { success: true, message: "User rejected" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updatePaymentStatus(userId: string, status: PaymentStatus) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || session.user.role !== Role.ADMIN) {
            throw new Error("Unauthorized");
        }

        // Get user details before updating
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { paymentStatus: status },
        });

        // Send email if payment is approved
        if (status === PaymentStatus.APPROVED) {
            // Send payment approved email
            const emailTemplate = emailTemplates.paymentApproved(user.name || "", user.email);
            await sendEmail({
                to: user.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
            });
        }

        return { success: true, message: "Payment status updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
