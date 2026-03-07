import { PrismaClient } from '@prisma/client';
import { sendZeptoMail } from '../lib/zeptomail';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables for ZeptoMail token
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function sendCancellations() {
  console.log("Starting script to send cancellation emails...");

  try {
    // Fetch individual registrations
    const individualRegs = await prisma.individualRegistration.findMany({
      include: {
        user: true,
      },
    });

    // Fetch group registrations
    const groupRegs = await prisma.groupRegistration.findMany({
      include: {
        user: true,
      },
    });

    // Fetch visitor pass registrations
    const visitorRegs = await prisma.visitorPassRegistration.findMany({
      include: {
        user: true,
      },
    });

    // Combine all unique users
    const userMap = new Map<string, { name: string, email: string }>();

    individualRegs.forEach(reg => {
      if (reg.user && reg.user.email) {
        userMap.set(reg.user.email, { name: reg.user.name || 'Participant', email: reg.user.email });
      }
    });

    groupRegs.forEach(reg => {
      if (reg.user && reg.user.email) {
        userMap.set(reg.user.email, { name: reg.user.name || 'Participant', email: reg.user.email });
      }
      // Also extract team members from group registrations if they have emails
      if (reg.members) {
        try {
          const membersArray = reg.members as Array<{ email?: string; name?: string }>;
          if (Array.isArray(membersArray)) {
            membersArray.forEach(member => {
              if (member.email) {
                userMap.set(member.email, { name: member.name || 'Participant', email: member.email });
              }
            });
          }
        } catch {
          console.warn("Could not parse members for group reg", reg.id);
        }
      }
    });

    visitorRegs.forEach(reg => {
      if (reg.user && reg.user.email) {
        userMap.set(reg.user.email, { name: reg.user.name || 'Participant', email: reg.user.email });
      }
    });

    const usersToEmail = Array.from(userMap.values());
    console.log(`Found ${usersToEmail.length} unique users registered overall.`);

    if (usersToEmail.length === 0) {
      console.log("No users found. Exiting.");
      return;
    }

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Important Update: Surabhi 2026 Entry</title>
        <style>
            body { margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333; }
            .header { background-color: #000000; padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #dc2626; }
            .content { padding: 40px 30px; color: #ffffff; }
            .welcome-header { font-size: 20px; color: #dc2626; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .main-heading { font-size: 28px; color: #ffffff; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
            .text-body { color: #d4d4d8; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .footer { background-color: #18181b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #333; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://klusurabhi.in/images/kl_logo_white_text.png" alt="KL University" width="130">
                <img src="https://klusurabhi.in/images/surabhi1.png" alt="Surabhi 2026" width="110">
            </div>

            <div class="content">
                <div class="main-heading">Important Notice Regarding Surabhi 2026</div>
                
                <p class="text-body">
                    Dear Participant,
                </p>
                
                <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #dc2626;">
                    <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0;">
                        We regret to inform you that due to some unavoidable circumstances, <strong>no external participants or visitors (outsiders) are allowed to come and attend the college fest on the 6th and 7th of March</strong> this time. 
                    </p>
                </div>

                <p class="text-body">
                    We are so sorry for the disappointment. We appreciate your interest in Surabhi 2026 and hope to see you all next year.
                </p>

                <p class="text-body" style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>Surabhi 2026 Team</strong>
                </p>
            </div>

            <div class="footer">
                <p>&copy; 2026 KL University. All rights reserved.</p>
                <p>Koneru Lakshmaiah Education Foundation, Vijayawada, Andhra Pradesh.</p>
                <p style="margin-top: 12px;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    
    // Safety check - ask before sending
    console.log("\\n--- EMAIL PREVIEW ---");
    console.log("Subject: Important Notice: Surabhi 2026 Entry Restriction");
    console.log("To: ", usersToEmail.length, "users");
    console.log("----------------------\\n");

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < usersToEmail.length; i += batchSize) {
      const batch = usersToEmail.slice(i, i + batchSize);
      console.log(`Sending batch ${i / batchSize + 1} (${batch.length} emails)...`);
      
      const emailPromises = batch.map(user => 
        sendZeptoMail({
          to: [{ email: user.email, name: user.name }],
          subject: "Important Notice: Surabhi 2026 Entry Restriction",
          htmlBody: htmlBody
        }).then(result => {
          if (result.success) {
            successCount++;
            console.log(`✅ Sent to ${user.email}`);
          } else {
            failCount++;
            console.error(`❌ Failed to send to ${user.email}: ${result.error}`);
          }
        }).catch(err => {
          failCount++;
          console.error(`❌ Exception sending to ${user.email}:`, err.message);
        })
      );

      await Promise.all(emailPromises);
      
      // small delay between batches
      if (i + batchSize < usersToEmail.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\\nFinished! Sent: ${successCount}, Failed: ${failCount}`);

  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

sendCancellations();
