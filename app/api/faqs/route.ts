import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");

        const where = category ? { category } : {};

        const faqs = await prisma.fAQ.findMany({
            where,
            orderBy: {
                order: "asc",
            },
        });

        return NextResponse.json(faqs);
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        return NextResponse.json(
            { error: "Failed to fetch FAQs" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { question, answer, category, order } = body;

        if (!question || !answer) {
            return NextResponse.json(
                { error: "Question and answer are required" },
                { status: 400 }
            );
        }

        const faq = await prisma.fAQ.create({
            data: {
                question,
                answer,
                category,
                order: order || 0,
            },
        });

        return NextResponse.json(faq, { status: 201 });
    } catch (error) {
        console.error("Error creating FAQ:", error);
        return NextResponse.json(
            { error: "Failed to create FAQ" },
            { status: 500 }
        );
    }
}
