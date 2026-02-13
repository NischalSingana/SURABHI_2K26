import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user || session.user.role !== "GOD") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        // Get all user counts by role
        const [
            totalUsers,
            totalAdmins,
            totalJudges,
            totalManagers,
            totalMasters,
            totalEvents,
            individualRegistrations,
            groupRegistrations,
            pendingApprovals
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: "ADMIN" } }),
            prisma.user.count({ where: { role: "JUDGE" } }),
            prisma.user.count({ where: { role: "MANAGER" } }),
            prisma.user.count({ where: { role: "MASTER" } }),
            prisma.event.count(),
            prisma.individualRegistration.count(),
            prisma.groupRegistration.count(),
            prisma.individualRegistration.count({
                where: { paymentStatus: "PENDING" }
            }) + prisma.groupRegistration.count({
                where: { paymentStatus: "PENDING" }
            })
        ]);

        const stats = {
            totalUsers,
            totalAdmins,
            totalJudges,
            totalManagers,
            totalMasters,
            totalEvents,
            totalRegistrations: individualRegistrations + groupRegistrations,
            pendingApprovals,
            totalRevenue: 0 // Can be calculated based on payment data if needed
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error("Error fetching god dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats", details: error.message },
            { status: 500 }
        );
    }
}
