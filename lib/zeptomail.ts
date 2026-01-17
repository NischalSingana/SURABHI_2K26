import { generateTicketPDF } from "./pdf-generator";
import path from "path";
import fs from "fs";

interface EmailRecipient {
    email: string;
    name: string;
}

interface ZeptoMailOptions {
    to: EmailRecipient[];
    subject: string;
    htmlBody: string;
    attachments?: {
        content: string; // Base64 string
        mime_type: string;
        name: string;
    }[];
    inlineImages?: {
        cid: string;
        content: string; // Base64 string
        mime_type: string;
    }[];
}

const ZEPTO_API_URL = process.env.ZEPTO_API_URL || "https://api.zeptomail.in/v1.1/email"; // Default to India DC
const SENDER_EMAIL = "noreply@klusurabhi.in"; // Updated to match user domain
const SENDER_NAME = "Surabhi 2026 Team";

export async function sendZeptoMail(options: ZeptoMailOptions) {
    const apiKey = process.env.ZEPTO_MAIL_TOKEN;

    if (!apiKey) {
        console.warn("ZEPTO_MAIL_TOKEN is not set. Skipping email send.");
        return { success: false, error: "Missing API Key" };
    }

    const payload = {
        from: {
            address: process.env.SENDER_EMAIL || SENDER_EMAIL,
            name: process.env.SENDER_NAME || SENDER_NAME,
        },
        to: options.to.map(r => ({
            email_address: {
                address: r.email,
                name: r.name,
            }
        })),
        subject: options.subject,
        htmlbody: options.htmlBody,
        attachments: options.attachments,
        inline_images: options.inlineImages,
    };

    try {
        const response = await fetch(ZEPTO_API_URL, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": apiKey.startsWith("Zoho-enczapikey") ? apiKey : `Zoho-enczapikey ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("ZeptoMail Error:", JSON.stringify(data, null, 2));
            return { success: false, error: data.message || "Failed to send email" };
        }

        console.log("ZeptoMail Success:", data);
        return { success: true, data };
    } catch (error) {
        console.error("ZeptoMail Network Error:", error);
        return { success: false, error: "Network error sending email" };
    }
}

// Helper to get base64 of public assets
function getPublicAssetBase64(filename: string): string | null {
    try {
        const filePath = path.join(process.cwd(), 'public', filename);
        // Special check for images in subfolders if filename doesn't start with /
        // Just rely on full path logic if we know where things are.
        // The user paths were: public/images/kl_logo_white_text.png, public/images/surabhi.png

        // Let's assume filename passed is relative to public
        const fullPath = path.join(process.cwd(), 'public', filename);

        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath).toString('base64');
        }
        return null;
    } catch (e) {
        console.error(`Error reading asset ${filename}:`, e);
        return null;
    }
}


export async function sendEventConfirmationEmail(
    user: { name: string; email: string },
    event: { name: string; date: Date; venue: string },
    pdfBuffer: Buffer,
    registrationType: "INDIVIDUAL" | "GROUP" | "VISITOR",
    teamDetails?: { groupName: string; members: any[] }
) {
    // 1. Prepare Logos - Using Public URLs
    // Assuming site is at https://klusurabhi.in
    const baseUrl = "https://klusurabhi.in";
    const klLogoUrl = `${baseUrl}/images/kl_logo_white_text.png`;
    const surabhiLogoUrl = `${baseUrl}/images/surabhi.png`;

    // No inline images to prevent attachments
    const inlineImages: any[] = [];

    // 2. HTML Template
    const dateStr = new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Theme colors: #dc2626 (Red), #000000 (Black), #18181b (Zinc-900)

    let headingTitle = "You are IN!";
    let welcomeMessage = `Congratulations! your registration for <strong class="highlight">${event.name}</strong> has been confirmed.`;

    if (registrationType === "VISITOR") {
        headingTitle = "Visitor Pass Confirmed";
        welcomeMessage = `Your Visitor Pass for <strong class="highlight">Surabhi 2026</strong> is confirmed. Get ready to witness the grand celebration!`;
    }

    let additionalInfo = "";
    if (registrationType === "GROUP" && teamDetails) {
        additionalInfo = `
            <div style="background-color: #18181b; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
                <h3 style="color: #ffffff; margin-top: 0;">Team Details</h3>
                <p style="color: #d4d4d8; margin: 5px 0;"><strong>Team Name:</strong> ${teamDetails.groupName}</p>
                <p style="color: #d4d4d8; margin: 5px 0;"><strong>Members:</strong> ${teamDetails.members.length + 1} (Lead included)</p>
            </div>
        `;
    }

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Surabhi 2026 Ticket</title>
        <style>
            body { margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333; }
            .header { background-color: #000000; padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #dc2626; }
            .content { padding: 40px 30px; color: #ffffff; }
            .welcome-header { font-size: 20px; color: #dc2626; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .main-heading { font-size: 28px; color: #ffffff; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
            .text-body { color: #d4d4d8; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .event-card { background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5); }
            .event-name { font-size: 22px; color: #ffffff; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
            .event-meta { color: #a1a1aa; font-size: 14px; margin-bottom: 5px; display: flex; align-items: center; justify-content: center; gap: 5px; }
            .footer { background-color: #18181b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #333; }
            .highlight { color: #dc2626; }
            .divider { height: 1px; background-color: #333; margin: 30px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header Logos -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; border-bottom: 3px solid #dc2626;">
                <tr>
                    <td align="left" style="padding: 20px;">
                        <img src="${klLogoUrl}" alt="KL University" width="130" style="display: block;">
                    </td>
                    <td align="right" style="padding: 20px;">
                        <img src="${surabhiLogoUrl}" alt="Surabhi 2026" width="110" style="display: block;">
                    </td>
                </tr>
            </table>

            <div class="content">
                <div class="welcome-header">Welcome to</div>
                <div class="main-heading">Surabhi International Cultural Fest 2026</div>
                
                <p class="text-body">
                    Hello <strong style="color: #ffffff;">${user.name}</strong>,
                </p>
                <p class="text-body">
                    ${welcomeMessage}
                </p>

                <div class="event-card">
                    <div class="event-name">${event.name}</div>
                    <div class="event-meta">📅 ${dateStr}</div>
                    <div class="event-meta">📍 ${event.venue}</div>
                </div>

                ${additionalInfo}

                <div class="divider"></div>

                <p style="color: #ffffff; font-size: 18px; text-align: center; margin-bottom: 15px;">
                    <strong>🎟️ Your Entry Pass is Attached</strong>
                </p>
                <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 0;">
                    Please find your official entry pass (PDF) attached below.<br>
                    Keep it handy for security checks at the venue.
                </p>

                <div style="margin-top: 40px; text-align: center;">
                    <p class="text-body" style="font-size: 14px; font-style: italic;">
                        "Thanks for being part of this event!"
                    </p>
                    <p style="color: #52525b; font-size: 12px; margin-top: 10px;">Ignite Your Passion • Surabhi 2026</p>
                </div>
            </div>

            <div class="footer">
                <p>&copy; 2026 KL University. All rights reserved.</p>
                <p>Koneru Lakshmaiah Education Foundation, Vijayawada, Andhra Pradesh.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // 3. Send Email
    return sendZeptoMail({
        to: [{ email: user.email, name: user.name }],
        subject: `Start the Fire! 🔥 Your Ticket for ${event.name} - Surabhi 2026`,
        htmlBody: htmlBody,
        attachments: [{
            content: pdfBuffer.toString('base64'),
            mime_type: "application/pdf",
            name: `Surabhi_2026_Ticket_${event.name.replace(/\s+/g, '_')}.pdf`
        }],
        inlineImages: inlineImages
    });
}
