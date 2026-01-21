"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
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
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        individualRegistrations: true,
                        groupRegistrations: true,
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        // Get user details before updating
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                collage: true,
                collageId: true,
                paymentStatus: true,
                accounts: {
                    select: {
                        providerId: true
                    }
                }
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isApproved: true },
        });

        const hasGoogleAccount = user.accounts.some(acc => acc.providerId === 'google');

        let emailSent = false;
        let emailError = "";

        if (hasGoogleAccount) {
            try {
                // Send approval email
                const emailTemplate = emailTemplates.userApproved(user.name || "", user.email);

                const emailOptions: any = {
                    to: user.email,
                    subject: emailTemplate.subject,
                    html: emailTemplate.html,
                };

                const emailResult = await sendEmail(emailOptions);

                if (!emailResult.success) throw new Error(emailResult.error);
                emailSent = true;

            } catch (err: any) {
                console.error("Failed to send approval email:", err);
                emailError = err.message || "Unknown email error";
            }
        }

        if (emailSent) {
            return { success: true, message: "User approved successfully and ticket sent via email" };
        } else if (!hasGoogleAccount) {
            return { success: true, message: "User approved automatically (No email/ticket for non-Google users)" };
        } else {
            return { success: true, message: `User approved, but failed to send email: ${emailError}` }; // Return success so UI updates
        }

    } catch (error: any) {
        console.error("Error approving user:", error);
        return { success: false, error: error.message };
    }
}

export async function rejectUser(userId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
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

export async function updateUserRole(userId: string, role: Role) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        // Prevent modifying own role to avoid locking oneself out (optional but good practice)
        if (session.user.id === userId) {
            // throw new Error("Cannot change your own role"); 
            // allowed for now as master might want to test
        }

        await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath("/admin/users");
        return { success: true, message: "User role updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
