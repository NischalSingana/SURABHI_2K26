import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyPass, getPassDetails } from "@/lib/pass";
import { Role } from "@/lib/generated/prisma"; // Adjust import path if needed

// GET: Get pass details without verifying (for preview)
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || session.user.role !== "ADMIN") { // using string 'ADMIN' if enum import fails
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const passToken = searchParams.get("token");

        if (!passToken) {
            return NextResponse.json(
                { error: "Pass token is required" },
                { status: 400 }
            );
        }

        const pass = await getPassDetails(passToken);

        if (!pass) {
            return NextResponse.json(
                { error: "Pass not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            pass,
        });
    } catch (error: any) {
        console.error("Get pass error:", error);
        return NextResponse.json(
            { error: "Failed to get pass details" },
            { status: 500 }
        );
    }
}

// POST: Verify and mark pass as used
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 401 }
            );
        }

        const { passToken } = await request.json();

        if (!passToken) {
            return NextResponse.json(
                { error: "Pass token is required" },
                { status: 400 }
            );
        }

        const result = await verifyPass(passToken, session.user.id);

        if (!result.valid) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    usedAt: result.usedAt,
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Pass verified successfully",
            pass: result.pass,
        });
    } catch (error: any) {
        console.error("Verify pass error:", error);
        return NextResponse.json(
            { error: "Failed to verify pass" },
            { status: 500 }
        );
    }
}
