"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hash } from "bcryptjs"; // Now available
import { revalidatePath } from "next/cache";

export async function getJudgeManagementData() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER")) {
            return { success: false, error: "Unauthorized" };
        }

        const categories = await prisma.category.findMany({
            include: {
                Event: {
                    include: {
                        judges: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                judgePassword: session.user.role === "MASTER" // Only select if MASTER
                            }
                        }
                    }
                }
            }
        });

        return { success: true, data: categories, role: session.user.role };

    } catch (error) {
        console.error("Error fetching judge management data:", error);
        return { success: false, error: "Failed to load data" };
    }
}

export async function createJudgeAccount(eventId: string, passwordPlain: string | null) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER")) {
            return { success: false, error: "Unauthorized" };
        }

        // Only MASTER can set specific password
        if (passwordPlain && session.user.role !== "MASTER") {
            return { success: false, error: "Only MASTER can set passwords. Admins can only create accounts." };
        }

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { slug: true, name: true }
        });

        if (!event) {
            return { success: false, error: "Event not found" };
        }

        // Generate auto-email
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        const email = `judge.${event.slug}.${randomSuffix}@klusurabhi.in`;
        const name = `Judge - ${event.name} (${randomSuffix})`;

        // Determine password
        // If MASTER provided one, use it.
        // If ADMIN creating (passwordPlain null), generate a random secure one that no one knows (they must be reset by MASTER later theoretically, or just used purely for existence)
        // But user said "MASTER WILL SET password". This implies initially it might not have a known password? 
        // Or I can generate a random one.
        const effectivePasswordPlain = passwordPlain || crypto.randomUUID();
        const hashedPassword = await hash(effectivePasswordPlain, 10);
        const storedJudgePassword = passwordPlain ? passwordPlain : null; // Only store if explicitly set by Master

        // Create new user
        await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email,
                name,
                role: "JUDGE",
                assignedEventId: eventId,
                password: hashedPassword,
                judgePassword: storedJudgePassword,
                emailVerified: true,
                accounts: {
                    create: {
                        id: crypto.randomUUID(),
                        accountId: email,
                        providerId: "email",
                        password: hashedPassword,
                        accessToken: crypto.randomUUID(),
                    }
                }
            }
        });

        revalidatePath("/admin/judges");
        return { success: true, email };

    } catch (error) {
        console.error("Error creating judge:", error);
        return { success: false, error: "Failed to create judge account" };
    }
}

export async function updateJudgePassword(judgeId: string, newPasswordPlain: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "MASTER") {
            return { success: false, error: "Unauthorized. Only MASTER can specific passwords." };
        }

        const hashedPassword = await hash(newPasswordPlain, 10);

        await prisma.user.update({
            where: { id: judgeId },
            data: {
                password: hashedPassword,
                judgePassword: newPasswordPlain
            }
        });

        // Update account too
        const judge = await prisma.user.findUnique({ where: { id: judgeId } });
        if (judge) {
            const account = await prisma.account.findFirst({
                where: { userId: judgeId, providerId: 'email' }
            });
            if (account) {
                await prisma.account.update({
                    where: { id: account.id },
                    data: { password: hashedPassword }
                });
            }
        }

        revalidatePath("/admin/judges");
        return { success: true };
    } catch (error) {
        console.error("Error updating judge password:", error);
        return { success: false, error: "Failed to update password" };
    }
}

export async function deleteJudgeAccount(judgeId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || session.user.role !== "MASTER") {
            return { success: false, error: "Unauthorized. Only MASTER can delete judges." };
        }

        await prisma.user.delete({
            where: { id: judgeId }
        });

        revalidatePath("/admin/judges");
        return { success: true };
    } catch (error) {
        console.error("Error deleting judge:", error);
        return { success: false, error: "Failed to delete judge account" };
    }
}
