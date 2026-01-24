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
                individualRegistrations: { 
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: { id: true } 
                },
                groupRegistrations: { 
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: { id: true } 
                }
            }
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        const isRegisteredForEvent = user.individualRegistrations.length > 0 || user.groupRegistrations.length > 0;

        // Create Pass - only generate token if APPROVED
        const pass = await prisma.pass.create({
            data: {
                userId: userId,
                ...(paymentStatus === "APPROVED" && { passToken: crypto.randomUUID() }),
                passType: "VISITOR",
                isActive: paymentStatus === "APPROVED",
                paymentScreenshot: paymentDetails?.paymentScreenshot || null,
                utrId: paymentDetails?.utrId || null,
                payeeName: paymentDetails?.payeeName || null,
                paymentStatus: paymentStatus as any
            }
        });

        // Special message for pending users
        if (paymentStatus === "PENDING") {
            revalidatePath("/profile");
            return { success: true, message: "Visitor pass request submitted! Please wait for admin to review and approve your registration. You'll receive an email when confirmed." };
        }

        // Only send email for APPROVED passes (KL students)
        // But KL students shouldn't receive emails per user requirement
        // So we skip email sending entirely

        revalidatePath("/profile");

        return {
            success: true,
            passToken: pass.passToken || undefined,
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
                individualRegistrations: { 
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: { id: true } 
                },
                groupRegistrations: { 
                    where: { paymentStatus: { not: "REJECTED" } },
                    select: { id: true } 
                },
                passes: {
                    where: { 
                        passType: "VISITOR",
                        paymentStatus: { not: "REJECTED" }
                    }
                }
            }
        });

        if (!user) return { success: false, isEligibleForFree: false, hasPass: false };

        const isRegistered = user.individualRegistrations.length > 0 || user.groupRegistrations.length > 0;

        // Only return pass info if it's not REJECTED (allow re-registration)
        const activePass = user.passes.find(p => p.paymentStatus !== "REJECTED");

        return {
            success: true,
            isEligibleForFree: isRegistered,
            hasPass: !!activePass,
            passToken: activePass?.passToken,
            paymentStatus: activePass?.paymentStatus
        };

    } catch (error) {
        console.error("Error checking pass status:", error);
        return { success: false, isEligibleForFree: false, hasPass: false };
    }
}
