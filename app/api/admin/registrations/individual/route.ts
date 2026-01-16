import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const registrations = await prisma.individualRegistration.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        collage: true,
                        collageId: true,
                        branch: true,
                        year: true,
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
        });

        return NextResponse.json({ registrations });
    } catch (error) {
        console.error("Error fetching individual registrations:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
