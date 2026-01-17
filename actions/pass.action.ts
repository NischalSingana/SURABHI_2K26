"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { sendEventConfirmationEmail } from "@/lib/zeptomail";

export async function generateVisitorPass() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return { success: false, error: "Please login to generate a pass" };
        }

        const userId = session.user.id;

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

        // Check if user is registered for any events (Free Pass)
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

        // Logic: 
        // If registered -> Free
        // If not registered -> Paid (We simulate payment here for now as per requirement)

        // Create Pass
        const pass = await prisma.pass.create({
            data: {
                userId: userId,
                passToken: crypto.randomUUID(),
                passType: "VISITOR",
                isActive: true,
            }
        });

        // Send Email Asynchronously (Fire and forget or await if critical)
        try {
            const pdfBuffer = await generateTicketPDF({
                userId: user.id,
                name: user.name || "Surabhi Visitor",
                email: user.email,
                phone: user.phone || "",
                collage: user.collage || "",
                collageId: user.collageId || "",
                paymentStatus: "PAID",
                isApproved: true,
                eventName: "Surabhi 2026",
                isGroupEvent: false,
                eventId: undefined, // Visitor pass has no specific event
                gender: user.gender || "N/A",
                state: user.state || "",
                city: user.city || ""
            });

            await sendEventConfirmationEmail(
                { name: user.name || "Visitor", email: user.email },
                { name: "Surabhi 2026", date: new Date(), venue: "KL University" }, // Dummy event details for template
                pdfBuffer,
                "VISITOR"
            );
        } catch (emailError) {
            console.error("Failed to send visitor pass email:", emailError);
            // Don't block the UI response
        }

        revalidatePath("/profile");

        return {
            success: true,
            passToken: pass.passToken,
            message: isRegisteredForEvent ? "Visitor Pass generated (Free for Participant)" : "Visitor Pass generated (Payment Successful)"
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
