import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Fetch all active FAQs (public)
export async function GET() {
    try {
        const faqs = await prisma.chatbotFAQ.findMany({
            where: { active: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                question: true,
                answer: true,
                category: true,
                order: true,
            }
        });

        return NextResponse.json(faqs);
    } catch (error: any) {
        console.error("Error fetching FAQs:", error);
        return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
    }
}

// POST - Create new FAQ (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { question, answer, category, order } = body;

        if (!question || !answer) {
            return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
        }

        const faq = await prisma.chatbotFAQ.create({
            data: {
                question,
                answer,
                category: category || null,
                order: order || 0,
                active: true,
            }
        });

        return NextResponse.json(faq);
    } catch (error: any) {
        console.error("Error creating FAQ:", error);
        return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
    }
}

// PUT - Update FAQ (admin only)
export async function PUT(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, question, answer, category, order, active } = body;

        if (!id) {
            return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
        }

        const faq = await prisma.chatbotFAQ.update({
            where: { id },
            data: {
                ...(question !== undefined && { question }),
                ...(answer !== undefined && { answer }),
                ...(category !== undefined && { category }),
                ...(order !== undefined && { order }),
                ...(active !== undefined && { active }),
            }
        });

        return NextResponse.json(faq);
    } catch (error: any) {
        console.error("Error updating FAQ:", error);
        return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
    }
}

// DELETE - Delete FAQ (admin only)
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "FAQ ID is required" }, { status: 400 });
        }

        await prisma.chatbotFAQ.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting FAQ:", error);
        return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
    }
}
