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

        // Generate auto-email — retry up to 5 times if collision
        let email = "";
        let randomSuffix = 0;
        let emailTaken = true;
        for (let i = 0; i < 5 && emailTaken; i++) {
            randomSuffix = Math.floor(1000 + Math.random() * 9000);
            email = `judge.${event.slug}.${randomSuffix}@klusurabhi.in`;
            const existing = await prisma.user.findUnique({ where: { email } });
            emailTaken = !!existing;
        }
        if (emailTaken) return { success: false, error: "Could not generate unique email. Try again." };

        const name = `Judge - ${event.name} (${randomSuffix})`;

        const effectivePasswordPlain = passwordPlain || crypto.randomUUID();
        const hashedPassword = await hash(effectivePasswordPlain, 10);
        const storedJudgePassword = passwordPlain ? passwordPlain : null;

        const userId = crypto.randomUUID();

        // Use a transaction to create user + account atomically
        await prisma.$transaction([
            prisma.user.create({
                data: {
                    id: userId,
                    email,
                    name,
                    role: "JUDGE",
                    assignedEventId: eventId,
                    password: hashedPassword,
                    judgePassword: storedJudgePassword,
                    emailVerified: true,
                }
            }),
            prisma.account.create({
                data: {
                    id: crypto.randomUUID(),
                    userId,
                    accountId: email,
                    providerId: "credential",
                    password: hashedPassword,
                    accessToken: crypto.randomUUID(),
                }
            }),
        ]);

        revalidatePath("/admin/judges");
        return { success: true, email };

    } catch (error) {
        console.error("Error creating judge:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return { success: false, error: `Failed to create judge: ${msg}` };
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

        // Update the user's password field
        const judge = await prisma.user.update({
            where: { id: judgeId },
            data: {
                password: hashedPassword,
                judgePassword: newPasswordPlain
            }
        });

        // Upsert the account password — better-auth uses providerId 'credential' for email+password sign-in
        const existingAccount = await prisma.account.findFirst({
            where: { userId: judgeId, providerId: "credential" }
        });

        if (existingAccount) {
            await prisma.account.update({
                where: { id: existingAccount.id },
                data: { password: hashedPassword }
            });
        } else {
            // Create the account record if missing (edge case)
            await prisma.account.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: judgeId,
                    accountId: judge.email,
                    providerId: "credential",
                    password: hashedPassword,
                    accessToken: crypto.randomUUID(),
                }
            });
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
