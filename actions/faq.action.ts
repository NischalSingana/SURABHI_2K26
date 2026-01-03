"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type FAQ = {
    id: string;
    question: string;
    answer: string;
    category: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
};

export async function getFaqs() {
    try {
        const faqs = await prisma.chatbotFAQ.findMany({
            orderBy: {
                order: "asc",
            },
        });
        return { success: true, data: faqs };
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        return { success: false, error: "Failed to fetch FAQs" };
    }
}

export async function createFaq(data: {
    question: string;
    answer: string;
    category?: string;
    order?: number;
}) {
    try {
        const faq = await prisma.chatbotFAQ.create({
            data: {
                question: data.question,
                answer: data.answer,
                category: data.category,
                order: data.order ?? 0,
            },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true, data: faq };
    } catch (error) {
        console.error("Error creating FAQ:", error);
        return { success: false, error: "Failed to create FAQ" };
    }
}

export async function updateFaq(
    id: string,
    data: {
        question?: string;
        answer?: string;
        category?: string;
        order?: number;
    }
) {
    try {
        const faq = await prisma.chatbotFAQ.update({
            where: { id },
            data,
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true, data: faq };
    } catch (error) {
        console.error("Error updating FAQ:", error);
        return { success: false, error: "Failed to update FAQ" };
    }
}

export async function deleteFaq(id: string) {
    try {
        await prisma.chatbotFAQ.delete({
            where: { id },
        });
        revalidatePath("/contact");
        revalidatePath("/admin/contact");
        return { success: true };
    } catch (error) {
        console.error("Error deleting FAQ:", error);
        return { success: false, error: "Failed to delete FAQ" };
    }
}
