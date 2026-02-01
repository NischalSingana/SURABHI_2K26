import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ token: string }> } // Params are now a Promise in Next.js 15
) {
    try {
        const { token } = await params;

        if (!token) {
            return NextResponse.json(
                { error: "Pass Token is required" },
                { status: 400 }
            );
        }

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

        const userId = session.user.id;

        let pass: { userId: string; user: { name: string | null; email: string; phone: string | null; collage: string | null; collageId: string | null; gender: string | null; state: string | null; city: string | null; isInternational?: boolean } } | null = null;

        const visitorPass = await prisma.visitorPassRegistration.findUnique({
            where: { passToken: token },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        collage: true,
                        collageId: true,
                        gender: true,
                        state: true,
                        city: true,
                        isInternational: true,
                    },
                },
            },
        });

        if (visitorPass && visitorPass.paymentStatus === "APPROVED") {
            pass = { userId: visitorPass.userId, user: visitorPass.user };
        }

        if (!pass) {
            const legacyPass = await prisma.pass.findUnique({
                where: { passToken: token },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            collage: true,
                            collageId: true,
                            gender: true,
                            state: true,
                            city: true,
                            isInternational: true,
                        },
                    },
                },
            });
            if (legacyPass && legacyPass.passType === "VISITOR" && legacyPass.paymentStatus === "APPROVED") {
                pass = { userId: legacyPass.userId, user: legacyPass.user };
            }
        }

        if (!pass) {
            return NextResponse.json({ error: "Pass not found" }, { status: 404 });
        }

        if (pass.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized to access this pass" }, { status: 403 });
        }

        const ticketData = {
            userId,
            name: pass.user.name || "Unknown",
            email: pass.user.email,
            phone: pass.user.phone,
            collage: pass.user.collage,
            collageId: pass.user.collageId,
            gender: pass.user.gender || "-",
            state: pass.user.state,
            city: pass.user.city,
            eventName: "Surabhi 2026 - Visitor Pass",
            eventId: "VISITOR_PASS",
            isGroupEvent: false,
            paymentStatus: 'PAID',
            isApproved: true,
            isInternational: !!(pass.user as { isInternational?: boolean }).isInternational,
        };

        // Generate PDF
        const pdfBuffer = await generateTicketPDF(ticketData);

        // Return PDF as download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="surabhi-2026-visitor-pass.pdf"`,
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error generating visitor pass PDF:", error);
        return NextResponse.json(
            { error: `Failed to generate pass: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
