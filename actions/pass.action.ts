"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

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

    await prisma.visitorPassRegistration.create({
      data: {
        userId,
        paymentScreenshot: paymentDetails?.paymentScreenshot ?? null,
        utrId: paymentDetails?.utrId ?? null,
        payeeName: paymentDetails?.payeeName ?? null,
        paymentStatus: "PENDING",
      },
    });

    revalidatePath("/profile");
    return {
      success: true,
      message:
        "Visitor pass request submitted! Please wait for admin to review and approve your registration. You'll receive an email when confirmed.",
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

export async function registerVisitorPassByAdmin(
  targetEmail: string,
  paymentDetails?: {
    paymentScreenshot: string;
    utrId: string;
    payeeName: string;
  }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (
      !session?.user ||
      (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)
    ) {
      return { success: false, error: "Unauthorized. Admin or Master only." };
    }

    const user = await prisma.user.findFirst({
      where: { email: targetEmail.trim().toLowerCase() },
    });

    if (!user) {
      return { success: false, error: `User not found: ${targetEmail}` };
    }

    const existing = await prisma.visitorPassRegistration.findFirst({
      where: { userId: user.id, paymentStatus: { not: "REJECTED" } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return {
        success: false,
        error: "This user already has an active visitor pass registration.",
      };
    }

    const passToken = crypto.randomUUID();
    const backdatedDate = new Date("2026-01-25T10:00:00.000Z");

    await prisma.visitorPassRegistration.create({
      data: {
        userId: user.id,
        passToken,
        paymentScreenshot: paymentDetails?.paymentScreenshot ?? null,
        utrId: paymentDetails?.utrId ?? null,
        payeeName: paymentDetails?.payeeName ?? null,
        paymentStatus: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: backdatedDate,
        createdAt: backdatedDate,
        isManual: true,
      },
    });

    // Generate PDF + send email in background
    const isInternational = !!(user as { isInternational?: boolean }).isInternational;
    (async () => {
      try {
        const { generateTicketPDF } = await import("@/lib/pdf-generator");
        const pdfBuffer = await generateTicketPDF({
          userId: user.id,
          name: user.name || "Visitor",
          email: user.email,
          phone: user.phone || "",
          collage: user.collage || "",
          collageId: user.collageId || "",
          paymentStatus: "PAID",
          isApproved: true,
          eventName: "Surabhi 2026",
          isGroupEvent: false,
          eventId: undefined,
          gender: user.gender || "N/A",
          state: user.state || "",
          city: user.city || "",
          isInternational: isInternational || undefined,
        });
        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
        await sendEventConfirmationEmail(
          { name: user.name || "Visitor", email: user.email },
          { name: "Surabhi 2026", date: new Date(), venue: "KL University" },
          pdfBuffer,
          "VISITOR",
          undefined,
          undefined,
          isInternational
        );
      } catch (e) {
        console.error(`Failed to send visitor pass email to ${user.email}:`, e);
      }
    })();

    revalidatePath("/admin/registrations/approvals");
    revalidatePath("/profile");

    return {
      success: true,
      message: `Visitor pass created & approved for ${user.name || user.email}. Confirmation email sent.`,
    };
  } catch (error) {
    console.error("Error in registerVisitorPassByAdmin:", error);
    return { success: false, error: "Failed to register visitor pass" };
  }
}
