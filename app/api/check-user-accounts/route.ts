import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || userId !== session.user.id) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Fetch user with accounts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            providerId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const hasGoogleAccount = user.accounts.some(
      (account) => account.providerId === "google"
    );

    const hasMicrosoftAccount = user.accounts.some(
      (account) => account.providerId === "microsoft"
    );

    return NextResponse.json(
      {
        hasGoogleAccount,
        hasMicrosoftAccount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check user accounts error:", error);
    return NextResponse.json(
      { error: "Failed to check user accounts" },
      { status: 500 }
    );
  }
}
