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

        // Fetch Pass Details
        const pass = await prisma.pass.findUnique({
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
                    }
                }
            }
        });

        if (!pass) {
            return NextResponse.json({ error: "Pass not found" }, { status: 404 });
        }

        // Verify ownership (optional, but good practice)
        if (pass.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized to access this pass" }, { status: 403 });
        }

        // Prepare Data for PDF Generator
        // mimicking the structure used in generateTicketPDF
        const ticketData = {
            userId: userId,
            name: pass.user.name || "Unknown",
            email: pass.user.email,
            phone: pass.user.phone,
            collage: pass.user.collage,
            collageId: pass.user.collageId,
            gender: pass.user.gender || "-",
            state: pass.user.state,
            city: pass.user.city,
            eventName: "Surabhi 2026 - Visitor Pass", // Special event name for visitor pass
            eventId: "VISITOR_PASS", // Placeholder
            isGroupEvent: false,
            paymentStatus: 'PAID', // Visitor passes are effectively paid (or free waiver)
            isApproved: true,
            // Additional fields specific for visitor pass can be handled here or in the PDF generator if needed
            isVisitorPass: true,
            validDates: "March 6th & 7th"
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
