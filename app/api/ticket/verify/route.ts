"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { verifyQRSignature } from "@/lib/qr-generator";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/lib/generated/prisma";

export async function POST(request: NextRequest) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        // Check if user is admin
        if (!session || session.user.role !== Role.ADMIN) {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 401 }
            );
        }

        const { qrData } = await request.json();

        if (!qrData) {
            return NextResponse.json(
                { error: "QR code data is required" },
                { status: 400 }
            );
        }

        // Verify QR signature
        const verification = verifyQRSignature(qrData);

        if (!verification.valid) {
            return NextResponse.json(
                {
                    valid: false,
                    error: verification.error || "Invalid QR code"
                },
                { status: 400 }
            );
        }

        // Get user details from database
        const user = await prisma.user.findUnique({
            where: { id: verification.payload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                collage: true,
                collageId: true,
                branch: true,
                year: true,
                transactionId: true,
                paymentStatus: true,
                isApproved: true,
                ticketScanned: true,
                ticketScannedAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    valid: false,
                    error: "User not found"
                },
                { status: 404 }
            );
        }

        // Check if already scanned
        if (user.ticketScanned) {
            return NextResponse.json({
                valid: false,
                error: `Ticket already captured at ${new Date(user.ticketScannedAt!).toLocaleString()}`,
                user: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    // Return user data even if invalid (for info)
                    college: user.collage,
                    transactionId: user.transactionId,
                    paymentStatus: user.paymentStatus,
                    isApproved: user.isApproved,
                }
            }, { status: 400 });
        }

        // MARK AS SCANNED
        await prisma.user.update({
            where: { id: user.id },
            data: {
                ticketScanned: true,
                ticketScannedAt: new Date(),
            }
        });

        // Return verification result
        return NextResponse.json({
            valid: true,
            user: {
                id: user.id, // Added ID for approval action
                name: user.name,
                email: user.email,
                phone: user.phone,
                college: user.collage,
                collegeId: user.collageId,
                branch: user.branch,
                year: user.year,
                transactionId: user.transactionId,
                paymentStatus: user.paymentStatus,
                isApproved: user.isApproved,
                registeredAt: user.createdAt,
            },
            verifiedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error verifying ticket:", error);
        return NextResponse.json(
            { error: "Failed to verify ticket" },
            { status: 500 }
        );
    }
}
