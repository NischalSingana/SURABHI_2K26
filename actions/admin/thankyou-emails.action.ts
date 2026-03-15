"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendThankYouAndFeedbackEmail } from "@/lib/zeptomail";

export async function getThankYouEmailStats() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user || (session.user.role !== "MASTER" && session.user.role !== "ADMIN")) {
            return { success: false, error: "Unauthorized access" };
        }

        const approvedUsersCount = await prisma.user.count({
            where: {
                paymentStatus: PaymentStatus.APPROVED,
                isApproved: true,
                hasReceivedThankYouEmail: false,
            }
        });

        return {
            success: true,
            data: {
                totalEligible: approvedUsersCount,
            }
        };
    } catch (error: any) {
        console.error("Error fetching thank you email stats:", error);
        return { success: false, error: error.message || "Failed to fetch stats" };
    }
}

export async function sendThankYouEmailsBatch(batchSize: number = 50) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user || (session.user.role !== "MASTER" && session.user.role !== "ADMIN")) {
            return { success: false, error: "Unauthorized access" };
        }

        // Get users who are approved, paid, and haven't received the thank you email yet
        const eligibleUsers = await prisma.user.findMany({
            where: {
                paymentStatus: PaymentStatus.APPROVED,
                isApproved: true,
                hasReceivedThankYouEmail: false,
            },
            select: {
                id: true,
                name: true,
                email: true,
                hasReceivedThankYouEmail: true,
            },
            take: batchSize,
        });

        // Filter out those who already received it if the field exists
        const usersToEmail = eligibleUsers.filter(u => !(u as any).hasReceivedThankYouEmail);

        if (usersToEmail.length === 0) {
            return { success: true, message: "No eligible users found for this batch.", count: 0 };
        }

        let successCount = 0;
        let failureCount = 0;

        for (const user of usersToEmail) {
            try {
                if (!user.email || !user.name) continue;

                const result = await sendThankYouAndFeedbackEmail({
                    name: user.name,
                    email: user.email,
                });

                if (result.success) {
                    successCount++;
                    
                    // Mark user as having received the email
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            hasReceivedThankYouEmail: true
                        }
                    }).catch(e => console.error("Could not update user flag:", e));
                    
                } else {
                    failureCount++;
                    console.error(`Failed to send email to ${user.email}: ${result.error}`);
                }

                // Small delay to prevent rate limits
                await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (err) {
                console.error(`Error processing user ${user.email}:`, err);
                failureCount++;
            }
        }

        revalidatePath("/admin/thankyou-emails");

        return {
            success: true,
            message: `Sent ${successCount} emails successfully. Failed: ${failureCount}.`,
            successCount,
            failureCount
        };

    } catch (error: any) {
        console.error("Error sending thank you emails:", error);
        return { success: false, error: error.message || "Failed to process emails" };
    }
}
