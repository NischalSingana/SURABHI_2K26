import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Fetch FAQs (Admin gets all, Public gets active only)
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        const isAdmin = session?.user?.role === "ADMIN";

        const whereClause = isAdmin ? {} : { active: true };

        const faqs = await prisma.chatbotFAQ.findMany({
            where: whereClause,
            orderBy: { order: 'asc' },
            select: {
                id: true,
                question: true,
                answer: true,
                category: true,
                order: true,
                active: true, // Include active status
            }
        });

        return NextResponse.json(faqs);
    } catch (error: any) {
        console.error("Error fetching FAQs:", error);
        // Return empty array when DB is unreachable or connection closed so chatbot UI doesn't break
        if (error?.code === "P1001" || error?.code === "P1017") {
            return NextResponse.json([]);
        }
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

        // Check for duplicate order in the same category
        const finalOrder = order !== undefined ? parseInt(order) : 0;
        if (category) {
            const existingOrder = await prisma.chatbotFAQ.findFirst({
                where: {
                    category: category,
                    order: finalOrder
                }
            });

            if (existingOrder) {
                return NextResponse.json({
                    error: `Order number ${finalOrder} is already taken in category "${category}"`
                }, { status: 400 });
            }
        }

        const faq = await prisma.chatbotFAQ.create({
            data: {
                question,
                answer,
                category: category || null,
                order: finalOrder,
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

        // Get current FAQ to know category if not provided in update
        const currentFAQ = await prisma.chatbotFAQ.findUnique({
            where: { id },
            select: { category: true }
        });

        const targetCategory = category !== undefined ? category : currentFAQ?.category;

        // Check uniqueness if order or category is changing (or just validate current state)
        if (order !== undefined || category !== undefined) {
            const newOrder = order !== undefined ? parseInt(order) : undefined;

            // If we have a target category and a new order (or we need to check existing order in new category)
            // We need to be careful. The simplest is: if order is provided, check it in target category.
            // If category changed but order didn't, we need to check existing order in new category.
            // But we don't have existing order easily without another fetch if not provided.
            // Let's assume order is provided if we want to change it.
            // If category changes, ideally order should probably be re-assigned or checked.
            // For simplify, if order is provided, check it.

            if (newOrder !== undefined && targetCategory) {
                const existingOrder = await prisma.chatbotFAQ.findFirst({
                    where: {
                        category: targetCategory,
                        order: newOrder,
                        NOT: { id: id }
                    }
                });

                if (existingOrder) {
                    return NextResponse.json({
                        error: `Order number ${newOrder} is already taken in category "${targetCategory}"`
                    }, { status: 400 });
                }
            }
        }

        const faq = await prisma.chatbotFAQ.update({
            where: { id },
            data: {
                ...(question !== undefined && { question }),
                ...(answer !== undefined && { answer }),
                ...(category !== undefined && { category }),
                ...(order !== undefined && { order: parseInt(order) }),
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
