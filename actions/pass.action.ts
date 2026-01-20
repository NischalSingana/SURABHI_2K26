"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { sendEventConfirmationEmail } from "@/lib/zeptomail";

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

        // Determine if user is KL student
        const isKLStudent = session.user.email.endsWith("@kluniversity.in");

        // Non-KL students must provide payment details
        if (!isKLStudent && !paymentDetails) {
            return { success: false, error: "Payment details are required for non-KL students." };
        }

        // Determine payment status
        const paymentStatus = isKLStudent ? "APPROVED" : "PENDING";

        // Check if user already has a visitor pass
        const existingPass = await prisma.pass.findFirst({
            where: {
                userId: userId,
                passType: "VISITOR"
            }
        });

        if (existingPass) {
            return { success: true, passToken: existingPass.passToken, message: "Pass already exists" };
        }

        // Check if user is registered for any events (Free Pass for participants)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                registeredEvents: true,
            }
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const isRegisteredForEvent = user.registeredEvents.length > 0;

        // Create Pass
        const pass = await prisma.pass.create({
            data: {
                userId: userId,
                passToken: crypto.randomUUID(),
                passType: "VISITOR",
                isActive: true,
                paymentScreenshot: paymentDetails?.paymentScreenshot || null,
                utrId: paymentDetails?.utrId || null,
                payeeName: paymentDetails?.payeeName || null,
                paymentStatus: paymentStatus as any
            }
        });

        // Special message for pending users
        if (paymentStatus === "PENDING") {
            revalidatePath("/profile");
            return { success: true, message: "Visitor pass request submitted! Verification pending. You will receive your pass after admin approval." };
        }

        // Only send email for APPROVED passes (KL students)
        // But KL students shouldn't receive emails per user requirement
        // So we skip email sending entirely

        revalidatePath("/profile");

        return {
            success: true,
            passToken: pass.passToken,
            message: isRegisteredForEvent ? "Visitor Pass generated (Free for Participant)" : "Visitor Pass generated successfully"
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
                registeredEvents: true,
                passes: {
                    where: { passType: "VISITOR" }
                }
            }
        });

        if (!user) return { success: false, isEligibleForFree: false, hasPass: false };

        return {
            success: true,
            isEligibleForFree: user.registeredEvents.length > 0,
            hasPass: user.passes.length > 0,
            passToken: user.passes[0]?.passToken
        };

    } catch (error) {
        console.error("Error checking pass status:", error);
        return { success: false, isEligibleForFree: false, hasPass: false };
    }
}
