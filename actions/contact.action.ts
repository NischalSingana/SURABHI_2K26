"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getContactCategories() {
    try {
        const categories = await prisma.contactCategory.findMany({
            include: {
                coordinators: {
                    orderBy: {
                        order: "asc",
                    },
                },
            },
            orderBy: {
                order: "asc",
            },
        });
        return { success: true, data: categories };
    } catch (error) {
        console.error("Error fetching contact categories:", error);
        return { success: false, error: "Failed to fetch contact information" };
    }
}

export async function createContactCategory(name: string, order: number) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });
        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        const category = await prisma.contactCategory.create({
            data: {
                name,
                order,
            },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true, data: category };
    } catch (error) {
        console.error("Error creating contact category:", error);
        return { success: false, error: "Failed to create category" };
    }
}

export async function updateContactCategory(id: string, name: string, order: number) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });
        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        const category = await prisma.contactCategory.update({
            where: { id },
            data: {
                name,
                order,
            },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true, data: category };
    } catch (error) {
        console.error("Error updating contact category:", error);
        return { success: false, error: "Failed to update category" };
    }
}

export async function deleteContactCategory(id: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });
        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.contactCategory.delete({
            where: { id },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true };
    } catch (error) {
        console.error("Error deleting contact category:", error);
        return { success: false, error: "Failed to delete category" };
    }
}

interface CoordinatorData {
    name: string;
    phone: string;
    email: string;
    image?: string;
    order: number;
}

export async function createCoordinator(categoryId: string, data: CoordinatorData) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });
        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        const coordinator = await prisma.contactCoordinator.create({
            data: {
                categoryId,
                ...data,
            },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true, data: coordinator };
    } catch (error) {
        console.error("Error creating coordinator:", error);
        return { success: false, error: "Failed to create coordinator" };
    }
}

export async function updateCoordinator(id: string, data: CoordinatorData) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });
        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        const coordinator = await prisma.contactCoordinator.update({
            where: { id },
            data: {
                ...data,
            },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true, data: coordinator };
    } catch (error) {
        console.error("Error updating coordinator:", error);
        return { success: false, error: "Failed to update coordinator" };
    }
}

export async function deleteCoordinator(id: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });
        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.contactCoordinator.delete({
            where: { id },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true };
    } catch (error) {
        console.error("Error deleting coordinator:", error);
        return { success: false, error: "Failed to delete coordinator" };
    }
}
