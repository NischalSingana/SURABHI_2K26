import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyAccommodationPass } from "@/lib/accommodation-pass";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MASTER" && session.user.role !== "MANAGER")) {
            return NextResponse.json(
                { success: false, error: "Admin or Manager access required." },
                { status: 401 }
            );
        }

        const { passToken } = await request.json();

        if (!passToken) {
            return NextResponse.json(
                { success: false, error: "Pass token is required" },
                { status: 400 }
            );
        }

        const result = await verifyAccommodationPass(passToken, session.user.id);

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
            message: "Accommodation checked in successfully",
            booking: result.booking,
        });
    } catch (error: any) {
        console.error("Accommodation verify error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to verify accommodation" },
            { status: 500 }
        );
    }
}
