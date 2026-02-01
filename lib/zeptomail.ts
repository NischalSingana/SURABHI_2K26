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
    event: { name: string; date: Date; venue: string; startTime?: string; endTime?: string },
    pdfBuffer: Buffer | null,
    registrationType: "INDIVIDUAL" | "GROUP" | "VISITOR",
    teamDetails?: { groupName: string; members: any[] },
    eventDetails?: { description?: string; termsAndConditions?: string; whatsappLink?: string | null },
    isInternational?: boolean
) {
    // 1. Prepare Logos - Using Public URLs
    // Assuming site is at https://klusurabhi.in
    const baseUrl = "https://klusurabhi.in";
    const klLogoUrl = `${baseUrl}/images/kl_logo_white_text.png`;
    const surabhiLogoUrl = `${baseUrl}/images/surabhi.png`;

    // No inline images to prevent attachments
    const inlineImages: any[] = [];

    // 2. HTML Template

    // Default date string
    let dateStr = new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Custom overrides for Visitor Pass
    if (registrationType === "VISITOR") {
        dateStr = "March 6th & 7th, 2026";
    }

    // Theme colors: #dc2626 (Red), #000000 (Black), #18181b (Zinc-900)

    let headingTitle = "You are IN!";
    let welcomeMessage = `Congratulations! your registration for <strong class="highlight">${event.name}</strong> has been confirmed.`;

    // Subject Line Logic
    let subjectLine = `Registration Confirmed: ${event.name} - Surabhi 2026`;

    if (registrationType === "VISITOR") {
        headingTitle = "Visitor Pass Confirmed";
        welcomeMessage = `Your Visitor Pass for <strong class="highlight">Surabhi 2026</strong> is confirmed. Get ready to witness the grand celebration!`;
        subjectLine = `Your Ticket for Visitor Pass - Surabhi 2026`;
    }

    // International participants: virtual participation, PDF attached with venue Virtual and time announced later
    if (isInternational) {
        headingTitle = "Virtual Participation – You're Registered!";
        welcomeMessage = `We are delighted to confirm your <strong class="highlight">virtual participation</strong> for <strong class="highlight">${event.name}</strong>. Your ticket (PDF) is attached. Thank you for being part of Surabhi International Cultural Fest 2026.`;
        subjectLine = `Registration Confirmed (Virtual): ${event.name} - Surabhi 2026`;
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

    // Event Details Section (Description & T&C)
    let eventDetailsSection = "";
    if (eventDetails) {
        if (eventDetails.description) {
            eventDetailsSection += `
                <div style="margin-top: 30px;">
                    <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">About the Event</h3>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${eventDetails.description}</p>
                </div>
            `;
        }

        if (eventDetails.termsAndConditions) {
            eventDetailsSection += `
                <div style="margin-top: 25px;">
                    <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">Terms & Conditions</h3>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${eventDetails.termsAndConditions}</p>
                </div>
            `;
        }
    }

    // WhatsApp Group Button
    let whatsappButton = "";
    if (eventDetails?.whatsappLink && eventDetails.whatsappLink.trim() !== "") {
        whatsappButton = `
            <div style="text-align: center; margin: 30px 0;">
                <a href="${eventDetails.whatsappLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Join WhatsApp Group
                </a>
                <p style="color: #a1a1aa; font-size: 12px; margin-top: 8px;">Join for live updates and announcements.</p>
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
                    ${!isInternational && event.startTime && event.endTime ? `<div class="event-meta">⏰ ${event.startTime} - ${event.endTime}</div>` : ''}
                    ${isInternational ? `<div class="event-meta">📍 Virtual</div><div class="event-meta">⏰ Time will be announced later to your convenient timezone.</div>` : `<div class="event-meta">📍 ${event.venue}</div>`}
                </div>

                ${additionalInfo}

                ${isInternational ? `
                <div style="background-color: #18181b; padding: 20px; border-left: 4px solid #dc2626; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 12px;">🌐 Virtual Participation</p>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0;">
                        This competition will be conducted <strong style="color: #ffffff;">virtually</strong>. Your ticket (PDF) is attached. Please follow the <strong style="color: #ffffff;">Virtual Participation Guidelines, Rules and Regulations</strong> in the attached ticket. Time will be announced later to your convenient timezone. You will receive further instructions and meeting links before the event. We look forward to your participation from across the globe!
                    </p>
                </div>
                <div style="background-color: #18181b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #333;">
                    <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 6px 0;">📧 For any queries, contact us at:</p>
                    <p style="color: #dc2626; font-size: 15px; font-weight: 600; margin: 0;"><a href="mailto:surabhi@kluniversity.in" style="color: #dc2626; text-decoration: none;">surabhi@kluniversity.in</a></p>
                </div>
                ` : ''}

                ${eventDetailsSection}

                ${whatsappButton}

                <div class="divider"></div>

                <p style="color: #ffffff; font-size: 18px; text-align: center; margin-bottom: 15px;">
                    <strong>🎟️ Your Entry Pass is Attached</strong>
                </p>
                <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 0;">
                    ${isInternational ? 'Please find your virtual participation ticket (PDF) attached. Follow the Virtual Participation Guidelines in the ticket.' : 'Please find your official entry pass (PDF) attached below. Keep it handy for security checks at the venue.'}
                </p>
                ${isInternational ? '<p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 10px; margin-bottom: 0;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>' : ''}

                <div style="margin-top: 40px; text-align: center;">
                    <p class="text-body" style="font-size: 14px; font-style: italic;">
                        ${isInternational ? '"Thank you for joining Surabhi from around the world. We can\'t wait to celebrate culture and creativity with you!"' : '"Thanks for being part of this event!"'}
                    </p>
                    <p style="color: #52525b; font-size: 12px; margin-top: 10px;">Ignite Your Passion • Surabhi 2026</p>
                </div>
            </div>

            <div class="footer">
                <p>&copy; 2026 KL University. All rights reserved.</p>
                <p>Koneru Lakshmaiah Education Foundation, Vijayawada, Andhra Pradesh.</p>
                ${isInternational ? '<p style="margin-top: 12px;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>' : ''}
            </div>
        </div>
    </body>
    </html>
    `;

    // 3. Send Email (attach PDF for all; international gets virtual ticket)
    return sendZeptoMail({
        to: [{ email: user.email, name: user.name }],
        subject: subjectLine,
        htmlBody: htmlBody,
        ...(pdfBuffer && {
            attachments: [{
                content: pdfBuffer.toString('base64'),
                mime_type: "application/pdf",
                name: `Surabhi_2026_${isInternational ? 'Virtual_' : ''}Ticket_${event.name.replace(/\s+/g, '_')}.pdf`
            }],
        }),
        inlineImages: inlineImages
    });
}
