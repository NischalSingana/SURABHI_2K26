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

    const formData = await request.formData();
    const college = formData.get("college") as string;
    const isInternational = formData.get("isInternational") === "true";

    // Check if user has already registered
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        collage: true,
        collageId: true,
        branch: true,
        year: true,
        phone: true,
        country: true,
        isInternational: true,
      },
    });

    if (isInternational) {
      if (existingUser?.phone && existingUser?.country && existingUser?.isInternational) {
        return NextResponse.json(
          { error: "Account already registered. You cannot register again." },
          { status: 409 }
        );
      }
    } else if (
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

    const collegeName = formData.get("collegeName") as string;
    const phone = formData.get("phone") as string;
    const collageId = (formData.get("collageId") as string) || "";
    const branch = (formData.get("branch") as string) || "";
    const yearRaw = formData.get("year") as string;
    const year = yearRaw ? parseInt(yearRaw) : 1;
    const gender = formData.get("gender") as string;
    const country = (formData.get("country") as string) || null;

    if (isInternational) {
      if (!phone || !country || !gender) {
        return NextResponse.json(
          { error: "Phone, country, and gender are required for international registration." },
          { status: 400 }
        );
      }
    } else {
      if (!collegeName || !phone || !collageId || !branch || !year || !gender) {
        return NextResponse.json(
          { error: "All required fields must be filled" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(isInternational
          ? {
              isInternational: true,
              country: country || undefined,
              collage: (collegeName && collegeName !== "International Student") ? collegeName : null,
              collageId: collageId || null,
              branch: branch || null,
              year: year || null,
              phone,
              gender,
            }
          : {
              collage: collegeName,
              collageId,
              branch,
              year,
              phone,
              gender,
            }),
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
