"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSchedule(image: string) {
    try {
        const schedule = await prisma.schedule.create({
            data: {
                image,
            },
        });
        revalidatePath("/schedule");
        revalidatePath("/admin/events");
        return { success: true, data: schedule };
    } catch (error) {
        console.error("Error creating schedule:", error);
        return { success: false, error: "Failed to create schedule" };
    }
}

export async function getSchedules() {
    try {
        const schedules = await prisma.schedule.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return { success: true, data: schedules };
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return { success: false, error: "Failed to fetch schedules" };
    }
}

export async function deleteSchedule(id: string) {
    try {
        await prisma.schedule.delete({
            where: {
                id,
            },
        });
        revalidatePath("/schedule");
        revalidatePath("/admin/events");
        return { success: true };
    } catch (error) {
        console.error("Error deleting schedule:", error);
        return { success: false, error: "Failed to delete schedule" };
    }
}

export async function getScheduleDownloadUrl(imageUrl: string) {
    try {
        // Extract key from URL
        // URL format: https://pub-[id].r2.dev/[key]
        // or process.env.R2_PUBLIC_URL/[key]

        // Simple way: if we assume the image serves from R2_PUBLIC_URL
        // we can just take the last part or strip the domain.

        const publicUrl = process.env.R2_PUBLIC_URL;
        if (!publicUrl) throw new Error("R2_PUBLIC_URL not set");

        // Remove trailing slash if present
        const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;

        // Extract key
        let key = imageUrl;
        if (imageUrl.startsWith(baseUrl)) {
            key = imageUrl.replace(`${baseUrl}/`, '');
        } else {
            // Fallback: splitting by / and taking last part might not be safe if nested keys
            // But if we trust our generateUniqueFilename which is "timestamp-name", it has no slashes usually?
            // Wait, generateUniqueFilename removes slashes from name.
            // But what if R2_PUBLIC_URL is different?
            // Let's assume standard behavior:
            const urlObj = new URL(imageUrl);
            key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
        }

        const { getDownloadUrl } = await import("@/lib/r2");
        const signedUrl = await getDownloadUrl(key);

        return { success: true, url: signedUrl };
    } catch (error) {
        console.error("Error generating download URL:", error);
        return { success: false, error: "Failed to generate download URL" };
    }
}
