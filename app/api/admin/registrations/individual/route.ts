import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER && session.user.role !== Role.RNC)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") || "1"));
        const pageSize = Math.min(200, Math.max(10, Number(searchParams.get("pageSize") || "50")));
        const skip = (page - 1) * pageSize;

        const where = {};

        const [registrations, total] = await Promise.all([
            prisma.individualRegistration.findMany({
                where,
                skip,
                take: pageSize,
                select: {
                    id: true,
                    createdAt: true,
                    isVirtual: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                            collage: true,
                            collageId: true,
                            branch: true,
                            year: true,
                            state: true,
                            city: true,
                            isInternational: true,
                            country: true,
                        }
                    },
                    event: {
                        select: {
                            name: true,
                            date: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" }
            }),
            prisma.individualRegistration.count({ where }),
        ]);

        return NextResponse.json({
            registrations,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error("Error fetching individual registrations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
