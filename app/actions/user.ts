'use server';

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const allowedRoles = ["ADMIN", "MASTER", "MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
        return { success: false, error: "Insufficient permissions" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
                paymentStatus: "APPROVED",
            },
        });

        revalidatePath("/verify/[token]");
        return { success: true };
    } catch (error) {
        console.error("Error approving user:", error);
        return { success: false, error: "Failed to approve user" };
    }
}
