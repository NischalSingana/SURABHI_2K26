import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { question, answer, category, order } = body;
        const { id } = await params;

        const faq = await prisma.fAQ.update({
            where: { id },
            data: {
                question,
                answer,
                category,
                order,
            },
        });

        return NextResponse.json(faq);
    } catch (error) {
        console.error("Error updating FAQ:", error);
        return NextResponse.json(
            { error: "Failed to update FAQ" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        await prisma.fAQ.delete({
            where: { id: id },
        });

        return NextResponse.json({ message: "FAQ deleted successfully" });
    } catch (error) {
        console.error("Error deleting FAQ:", error);
        return NextResponse.json(
            { error: "Failed to delete FAQ" },
            { status: 500 }
        );
    }
}
