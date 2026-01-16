import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Get the session from better-auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    // Check if user has already registered
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        collage: true,
        collageId: true,
        branch: true,
        year: true,
        phone: true,
      },
    });

    // If user has already filled these fields, they've already registered
    if (
      existingUser?.collage &&
      existingUser?.collageId &&
      existingUser?.branch &&
      existingUser?.year &&
      existingUser?.phone
    ) {
      return NextResponse.json(
        { error: "Account already registered. You cannot register again." },
        { status: 409 }
      );
    }

    const formData = await request.formData();

    // Extract form fields
    const college = formData.get("college") as string;
    const collegeName = formData.get("collegeName") as string;
    const phone = formData.get("phone") as string;
    const collageId = formData.get("collageId") as string;
    const branch = formData.get("branch") as string;
    const year = parseInt(formData.get("year") as string);
    const gender = formData.get("gender") as string;

    // Validate required fields
    if (!collegeName || !phone || !collageId || !branch || !year || !gender) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Payment fields are no longer required - free registration for all
    const isKLStudent = college === "KL_UNIVERSITY";

    // Update user with registration details
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        collage: collegeName,
        collageId,
        branch,
        year,
        phone,
        gender,
        // Auto-approve all users
        isApproved: true,
        paymentStatus: "APPROVED",
      },
    });

    // Revalidate profile page to show new data immediately
    revalidatePath("/profile");

    const message = "Registration successful! Welcome to Surabhi 2026. You can now access the full website.";

    return NextResponse.json(
      {
        message,
        user: updatedUser
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
