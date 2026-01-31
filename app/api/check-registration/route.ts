import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ isRegistered: false, userData: null }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        collage: true,
        collageId: true,
        branch: true,
        year: true,
        phone: true,
        isInternational: true,
        country: true,
        gender: true,
      },
    });

    if (!user) {
      return NextResponse.json({ isRegistered: false, userData: null }, { status: 200 });
    }

    const isInternational = !!user.isInternational;
    const isRegistered = isInternational
      ? !!(user.phone && user.country)
      : !!(user.collage && user.collageId && user.branch && user.year && user.phone);

    return NextResponse.json({
      isRegistered,
      userData: {
        collage: user.collage || "",
        collageId: user.collageId || "",
        branch: user.branch || "",
        year: user.year || 1,
        phone: user.phone || "",
        isInternational: user.isInternational ?? false,
        country: user.country || "",
        gender: user.gender || "",
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Check registration error:", error);
    // On error, allow user to continue (return false)
    return NextResponse.json({ isRegistered: false, userData: null }, { status: 200 });
  }
}
