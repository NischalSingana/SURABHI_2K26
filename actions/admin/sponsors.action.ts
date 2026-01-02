"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@/lib/generated/prisma";
import { put } from "@vercel/blob";

// Get all sponsors (public)
export async function getAllSponsors() {
    try {
        const sponsors = await prisma.sponsor.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });

        return { success: true, sponsors };
    } catch (error: any) {
        console.error("Error fetching sponsors:", error);
        return { success: false, error: error.message };
    }
}

// Get single sponsor
export async function getSponsor(id: string) {
    try {
        const sponsor = await prisma.sponsor.findUnique({
            where: { id },
        });

        if (!sponsor) {
            return { success: false, error: "Sponsor not found" };
        }

        return { success: true, sponsor };
    } catch (error: any) {
        console.error("Error fetching sponsor:", error);
        return { success: false, error: error.message };
    }
}

// Create sponsor (admin only)
export async function createSponsor(data: {
    name: string;
    description: string;
    amount: number;
    image?: string;
    website?: string;
    borderColor?: string;
    gradient?: string;
    order?: number;
}) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session || session.user.role !== Role.ADMIN) {
            return { success: false, error: "Unauthorized" };
        }

        const sponsor = await prisma.sponsor.create({
            data: {
                name: data.name,
                description: data.description,
                amount: data.amount,
                image: data.image,
                website: data.website,
                borderColor: data.borderColor || "#dc2626",
                gradient: data.gradient || "linear-gradient(145deg,#dc2626,#000)",
                order: data.order || 0,
            },
        });

        return { success: true, sponsor, message: "Sponsor created successfully" };
    } catch (error: any) {
        console.error("Error creating sponsor:", error);
        return { success: false, error: error.message };
    }
}

// Update sponsor (admin only)
export async function updateSponsor(
    id: string,
    data: {
        name?: string;
        description?: string;
        amount?: number;
        image?: string;
        website?: string;
        borderColor?: string;
        gradient?: string;
        order?: number;
        isActive?: boolean;
    }
) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session || session.user.role !== Role.ADMIN) {
            return { success: false, error: "Unauthorized" };
        }

        const sponsor = await prisma.sponsor.update({
            where: { id },
            data,
        });

        return { success: true, sponsor, message: "Sponsor updated successfully" };
    } catch (error: any) {
        console.error("Error updating sponsor:", error);
        return { success: false, error: error.message };
    }
}

// Delete sponsor (admin only)
export async function deleteSponsor(id: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session || session.user.role !== Role.ADMIN) {
            return { success: false, error: "Unauthorized" };
        }

        await prisma.sponsor.delete({
            where: { id },
        });

        return { success: true, message: "Sponsor deleted successfully" };
    } catch (error: any) {
        console.error("Error deleting sponsor:", error);
        return { success: false, error: error.message };
    }
}

// Upload sponsor image
export async function uploadSponsorImage(formData: FormData) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session || session.user.role !== Role.ADMIN) {
            return { success: false, error: "Unauthorized" };
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Upload to Vercel Blob
        const blob = await put(`sponsors/${Date.now()}-${file.name}`, file, {
            access: "public",
        });

        return { success: true, url: blob.url };
    } catch (error: any) {
        console.error("Error uploading image:", error);
        return { success: false, error: error.message };
    }
}
