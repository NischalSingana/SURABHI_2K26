import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ isRegistered: false }, { status: 200 });
    }

    // Check if user has already registered
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        collage: true,
        collageId: true,
        branch: true,
        year: true,
        phone: true,
      },
    });

    // If user has already filled these fields, they've already registered
    const isRegistered = !!(
      user?.collage &&
      user?.collageId &&
      user?.branch &&
      user?.year &&
      user?.phone
    );

    return NextResponse.json({ isRegistered }, { status: 200 });
  } catch (error) {
    console.error("Check registration error:", error);
    return NextResponse.json({ isRegistered: false }, { status: 200 });
  }
}
