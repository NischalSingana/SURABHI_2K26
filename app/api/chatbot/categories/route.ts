import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Fetch all active categories (public)
export async function GET() {
    try {
        const categories = await prisma.chatbotCategory.findMany({
            where: { active: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                name: true,
                order: true,
            }
        });

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

// POST - Create new category (admin only)
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, order } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        // Check if category name already exists
        const existingName = await prisma.chatbotCategory.findUnique({
            where: { name: name.trim() }
        });

        if (existingName) {
            return NextResponse.json({ error: "Category already exists" }, { status: 400 });
        }

        // Check if order number is already taken
        const finalOrder = order !== undefined ? parseInt(order) : 0;
        const existingOrder = await prisma.chatbotCategory.findFirst({
            where: { order: finalOrder }
        });

        if (existingOrder) {
            return NextResponse.json({
                error: `Order number ${finalOrder} is already taken by category "${existingOrder.name}"`
            }, { status: 400 });
        }

        const category = await prisma.chatbotCategory.create({
            data: {
                name: name.trim(),
                order: finalOrder,
                active: true,
            }
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

// PUT - Update category (admin only)
export async function PUT(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, name, order, active } = body;

        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Check if order is being updated and is unique
        if (order !== undefined) {
            const newOrder = parseInt(order);
            const existingOrder = await prisma.chatbotCategory.findFirst({
                where: {
                    order: newOrder,
                    NOT: { id: id }
                }
            });

            if (existingOrder) {
                return NextResponse.json({
                    error: `Order number ${newOrder} is already taken by category "${existingOrder.name}"`
                }, { status: 400 });
            }
        }

        const category = await prisma.chatbotCategory.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: name.trim() }),
                ...(order !== undefined && { order: parseInt(order) }),
                ...(active !== undefined && { active }),
            }
        });

        return NextResponse.json(category);
    } catch (error: any) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

// DELETE - Delete category (admin only)
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Check if category has FAQs
        const faqCount = await prisma.chatbotFAQ.count({
            where: { category: (await prisma.chatbotCategory.findUnique({ where: { id } }))?.name }
        });

        if (faqCount > 0) {
            return NextResponse.json({
                error: `Cannot delete category with ${faqCount} FAQ(s). Please reassign or delete the FAQs first.`
            }, { status: 400 });
        }

        await prisma.chatbotCategory.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
