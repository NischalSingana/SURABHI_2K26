import { prisma } from "./lib/prisma";
import { sendThankYouAndFeedbackEmail } from "./lib/zeptomail";
import { PaymentStatus } from "@prisma/client";
import { config } from "dotenv";

config();

async function sendToAll() {
    console.log("Fetching all eligible students...");
    
    const users = await prisma.user.findMany({
        where: {
            paymentStatus: PaymentStatus.APPROVED,
            isApproved: true,
            hasReceivedThankYouEmail: false
        },
        select: {
            id: true,
            email: true,
            name: true
        }
    });

    console.log(`Found ${users.length} eligible users who haven't received the email.`);
    
    if (users.length === 0) {
        console.log("No emails to send. Exiting.");
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        try {
            console.log(`[${i+1}/${users.length}] Sending to ${user.email}...`);
            const result = await sendThankYouAndFeedbackEmail({ name: user.name, email: user.email });
            
            if (result.success) {
                successCount++;
                await prisma.user.update({
                    where: { id: user.id },
                    data: { hasReceivedThankYouEmail: true }
                });
            } else {
                failCount++;
                console.error(`  -> Failed:`, result.error);
            }
            
            // Rate limiting pause (5 requests per second)
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
            failCount++;
            console.error(`  -> Exception for ${user.email}:`, e);
        }
    }
    
    console.log(`\nDONE! Successfully sent: ${successCount}, Failed: ${failCount}`);
}

sendToAll().catch(console.error).finally(() => process.exit(0));
