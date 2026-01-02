"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                collage: true,
                collageId: true,
                transactionId: true,
                paymentStatus: true,
                isApproved: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if payment is approved
        if (!user.isApproved) {
            return NextResponse.json(
                { error: "Payment not approved yet. Please wait for admin approval." },
                { status: 403 }
            );
        }

        // Generate PDF
        const pdfBuffer = await generateTicketPDF({
            userId: user.id,
            name: user.name || "Unknown",
            email: user.email,
            phone: user.phone,
            collage: user.collage,
            collageId: user.collageId,
            transactionId: user.transactionId,
            paymentStatus: user.paymentStatus,
            isApproved: user.isApproved,
        });

        // Return PDF as download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="surabhi-2026-ticket-${user.name?.replace(/\s+/g, '-')}.pdf"`,
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error generating ticket:", error);
        return NextResponse.json(
            { error: "Failed to generate ticket" },
            { status: 500 }
        );
    }
}
