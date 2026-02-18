"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function generateVisitorPass(paymentDetails?: {
  paymentScreenshot: string;
  utrId: string;
  payeeName: string;
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to generate a pass" };
    }

    const userId = session.user.id;

    const existing = await prisma.visitorPassRegistration.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.paymentStatus !== "REJECTED") {
      return {
        success: true,
        passToken: existing.passToken ?? undefined,
        message: "Pass already exists",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        individualRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          select: { id: true },
        },
        groupRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isRegisteredForEvent =
      user.individualRegistrations.length > 0 || user.groupRegistrations.length > 0;

    if (!isRegisteredForEvent && !paymentDetails) {
      return { success: false, error: "Payment details are required for visitor pass (₹350). Competition participants get free pass." };
    }

    const paymentStatus = "PENDING";

    const reg = await prisma.visitorPassRegistration.create({
      data: {
        userId,
        ...(paymentStatus === "APPROVED" && { passToken: crypto.randomUUID() }),
        paymentScreenshot: paymentDetails?.paymentScreenshot ?? null,
        utrId: paymentDetails?.utrId ?? null,
        payeeName: paymentDetails?.payeeName ?? null,
        paymentStatus: paymentStatus as "APPROVED" | "PENDING",
      },
    });

    if (paymentStatus === "PENDING") {
      revalidatePath("/profile");
      return {
        success: true,
        message:
          "Visitor pass request submitted! Please wait for admin to review and approve your registration. You'll receive an email when confirmed.",
      };
    }

    revalidatePath("/profile");

    return {
      success: true,
      passToken: reg.passToken ?? undefined,
      message: isRegisteredForEvent
        ? "Visitor Pass generated (Free for Participant)"
        : "Visitor Pass generated successfully",
    };
  } catch (error) {
    console.error("Error generating visitor pass:", error);
    return { success: false, error: "Failed to generate visitor pass" };
  }
}

export async function checkVisitorPassStatus() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, isEligibleForFree: false, hasPass: false };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        individualRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          select: { id: true },
        },
        groupRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          select: { id: true },
        },
        visitorPassRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) return { success: false, isEligibleForFree: false, hasPass: false };

    const isRegistered =
      user.individualRegistrations.length > 0 || user.groupRegistrations.length > 0;
    const active = user.visitorPassRegistrations.find((r) => r.paymentStatus !== "REJECTED");

    return {
      success: true,
      isEligibleForFree: isRegistered,
      hasPass: !!active,
      passToken: active?.passToken ?? undefined,
      paymentStatus: active?.paymentStatus ?? undefined,
    };
  } catch (error) {
    console.error("Error checking pass status:", error);
    return { success: false, isEligibleForFree: false, hasPass: false };
  }
}
