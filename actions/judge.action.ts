"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hash } from "bcryptjs"; // Now available

export async function getCategoriesWithJudges() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER" && session.user.role !== "MANAGER")) {
            return { success: false, error: "Unauthorized" };
        }

        const categories = await prisma.category.findMany();

        // Fetch judges (users with JUDGE role and assigned category)
        const judges = await prisma.user.findMany({
            where: {
                role: "JUDGE",
                assignedCategoryId: { not: null }
            },
            select: {
                id: true,
                name: true,
                email: true,
                assignedCategoryId: true
            }
        });

        const data = categories.map(cat => ({
            ...cat,
            judge: judges.find(j => j.assignedCategoryId === cat.id) || null
        }));

        return { success: true, data };

    } catch (error) {
        console.error("Error fetching categories:", error);
        return { success: false, error: "Failed to load data" };
    }
}

export async function createJudgeAccount(categoryId: string, email: string, passwordPlain: string, name: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER" && session.user.role !== "MANAGER")) {
            return { success: false, error: "Unauthorized" };
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        const hashedPassword = await hash(passwordPlain, 10);

        if (existingUser) {
            // Update existing user to be a judge
            await prisma.user.update({
                where: { email },
                data: {
                    role: "JUDGE",
                    assignedCategoryId: categoryId,
                    password: hashedPassword, // Reset password
                    name
                }
            });
            // Ensure account linked? better-auth usually checks user.password for email login.
        } else {
            // Create new user
            await prisma.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email,
                    name,
                    role: "JUDGE",
                    assignedCategoryId: categoryId,
                    password: hashedPassword,
                    emailVerified: true,
                    accounts: {
                        create: {
                            id: crypto.randomUUID(),
                            accountId: email, // Use email as accountId for credentials often
                            providerId: "credential", // better-auth usually uses 'credential' or 'email'
                            password: hashedPassword,
                            accessToken: crypto.randomUUID(), // Placeholder
                        }
                    }
                }
            });
        }

        return { success: true };

    } catch (error) {
        console.error("Error creating judge:", error);
        return { success: false, error: "Failed to create judge account" };
    }
}
