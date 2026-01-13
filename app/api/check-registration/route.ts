import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ isRegistered: false }, { status: 200 });
    }

    // Check if user exists in database
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

    // If user doesn't exist in database (was deleted), return false
    if (!user) {
      return NextResponse.json({ isRegistered: false }, { status: 200 });
    }

    // If user exists but hasn't filled registration fields, return false
    const isRegistered = !!(
      user.collage &&
      user.collageId &&
      user.branch &&
      user.year &&
      user.phone
    );

    return NextResponse.json({ isRegistered }, { status: 200 });
  } catch (error) {
    console.error("Check registration error:", error);
    // On error, allow user to continue (return false)
    return NextResponse.json({ isRegistered: false }, { status: 200 });
  }
}
