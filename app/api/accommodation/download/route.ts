import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { generateAccommodationPassPDF } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("bookingId");

        if (!bookingId) {
            return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
        }

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const booking = await prisma.accommodationBooking.findFirst({
            where: {
                id: bookingId,
                userId: session.user.id,
                status: "CONFIRMED",
                paymentStatus: "APPROVED",
                passToken: { not: null },
            },
            include: {
                user: {
                    select: {
                        collage: true,
                        collageId: true,
                        individualRegistrations: {
                            where: { paymentStatus: "APPROVED" },
                            include: {
                                event: {
                                    select: { name: true, Category: { select: { name: true } } },
                                },
                            },
                        },
                        groupRegistrations: {
                            where: { paymentStatus: "APPROVED" },
                            include: {
                                event: {
                                    select: { name: true, Category: { select: { name: true } } },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!booking || !booking.passToken) {
            return NextResponse.json({ error: "Accommodation pass not found" }, { status: 404 });
        }

        const members = [
            { name: booking.primaryName, email: booking.primaryEmail, phone: booking.primaryPhone || "" },
            ...((booking.groupMembers as any[]) || []).map((m: any) => ({
                name: m.name || "Unknown",
                email: m.email || "",
                phone: m.phone || "",
            })),
        ];

        const individualEvents = (booking.user.individualRegistrations || []).map((r: any) => ({
            name: r.event?.name,
            category: r.event?.Category?.name,
        }));
        const groupEvents = (booking.user.groupRegistrations || []).map((r: any) => ({
            name: r.event?.name,
            category: r.event?.Category?.name,
        }));

        const pdfData = {
            passToken: booking.passToken,
            primaryName: booking.primaryName,
            primaryEmail: booking.primaryEmail,
            primaryPhone: booking.primaryPhone || "",
            collage: booking.user.collage,
            collageId: booking.user.collageId,
            gender: booking.gender,
            bookingType: booking.bookingType,
            members,
            competitions: [...individualEvents, ...groupEvents],
        };

        const pdfBuffer = await generateAccommodationPassPDF(pdfData);

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="surabhi-2026-accommodation-pass.pdf"',
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error downloading accommodation pass:", error);
        return NextResponse.json(
            { error: "Failed to download accommodation pass" },
            { status: 500 }
        );
    }
}
