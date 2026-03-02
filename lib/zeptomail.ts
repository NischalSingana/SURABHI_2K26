import { generateTicketPDF } from "./pdf-generator";
import path from "path";
import fs from "fs";
import { COMPETITIONS_SCHEDULE_IMAGE_URL } from "./schedule";

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

async function getRemoteAssetBase64(url: string): Promise<{ content: string; mimeType: string } | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const mimeType = response.headers.get("content-type") || "image/jpeg";
        const bytes = await response.arrayBuffer();
        const content = Buffer.from(bytes).toString("base64");
        return { content, mimeType };
    } catch (e) {
        console.error(`Error fetching remote asset ${url}:`, e);
        return null;
    }
}


export async function sendEventConfirmationEmail(
    user: { name: string; email: string },
    event: { name: string; date: Date; venue: string; startTime?: string; endTime?: string },
    pdfBuffer: Buffer | null,
    registrationType: "INDIVIDUAL" | "GROUP" | "VISITOR",
    teamDetails?: { groupName: string; members: any[] },
    eventDetails?: { description?: string; termsAndConditions?: string; virtualTermsAndConditions?: string | null; whatsappLink?: string | null },
    isInternational?: boolean,
    /** For virtual/international competition participants: no PDF, virtual-only content, Zoom sent 2 days before */
    isVirtualParticipant?: boolean,
    includeScheduleAttachment?: boolean
) {
    // 1. Prepare Logos - Using Public URLs
    // Assuming site is at https://klusurabhi.in
    const baseUrl = "https://klusurabhi.in";
    const klLogoUrl = `${baseUrl}/images/kl_logo_white_text.png`;
    const surabhiLogoUrl = `${baseUrl}/images/surabhi1.png`;

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

    // Virtual participants (competitions): no PDF, virtual-only content, Zoom sent 2 days before
    const useVirtualTemplate = !!isVirtualParticipant;

    let headingTitle = "You are IN!";
    let welcomeMessage = `Congratulations! your registration for <strong class="highlight">${event.name}</strong> has been confirmed.`;

    // Subject Line Logic
    let subjectLine = `Registration Confirmed: ${event.name} - Surabhi 2026`;

    if (registrationType === "VISITOR") {
        headingTitle = "Visitor Pass Confirmed";
        welcomeMessage = `Your Visitor Pass for <strong class="highlight">Surabhi 2026</strong> is confirmed. Get ready to witness the grand celebration!`;
        subjectLine = `Your Ticket for Visitor Pass - Surabhi 2026`;
    } else if (useVirtualTemplate) {
        headingTitle = "Virtual Participation – You're Registered!";
        welcomeMessage = `We are delighted to confirm your <strong class="highlight">virtual participation</strong> for <strong class="highlight">${event.name}</strong>. The Zoom meeting link will be sent to your email before 2 days of the event date. Thank you for being part of Surabhi International Cultural Fest 2026.`;
        subjectLine = `Registration Confirmed (Virtual): ${event.name} - Surabhi 2026`;
    } else if (isInternational) {
        headingTitle = "Virtual Participation – You're Registered!";
        welcomeMessage = `We are delighted to confirm your <strong class="highlight">virtual participation</strong> for <strong class="highlight">${event.name}</strong>. Thank you for being part of Surabhi International Cultural Fest 2026.`;
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

    // Event Details Section - for virtual: only virtual rules; for physical: description & T&C
    let eventDetailsSection = "";
    if (eventDetails) {
        if (useVirtualTemplate) {
            const virtualRules = eventDetails.virtualTermsAndConditions?.trim() || eventDetails.termsAndConditions?.trim() || "Please refer to the Virtual Participation Guidelines, Rules and Regulations for this competition on the event page.";
            eventDetailsSection += `
                <div style="margin-top: 25px;">
                    <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">Virtual Participation Rules & Regulations</h3>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${virtualRules}</p>
                </div>
            `;
        } else {
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

    const scheduleAttachment = includeScheduleAttachment
        ? await getRemoteAssetBase64(COMPETITIONS_SCHEDULE_IMAGE_URL)
        : null;

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
                    ${useVirtualTemplate
                        ? `<div class="event-meta">📍 Virtual</div><div class="event-meta">🔗 Zoom meeting link will be sent to your email before 2 days of the event date.</div>`
                        : isInternational
                            ? `<div class="event-meta">📍 Virtual</div><div class="event-meta">⏰ Time will be announced later to your convenient timezone.</div>`
                            : `<div class="event-meta">⏰ ${event.startTime || ''} ${event.endTime ? `- ${event.endTime}` : ''}</div><div class="event-meta">📍 ${event.venue}</div>`}
                </div>

                ${additionalInfo}

                ${(!useVirtualTemplate && !isInternational && registrationType !== "VISITOR") ? `
                <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                    <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">🏨 Free Accommodation & Lunch</p>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
                        As a competition participant, you are eligible for <strong style="color: #ffffff;">1 day free accommodation and lunch</strong>. 
                        Kindly book your accommodation in advance to secure your spot.
                    </p>
                    <a href="https://klusurabhi.in/accommodation" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                        Book Accommodation
                    </a>
                    <p style="color: #a1a1aa; font-size: 12px; margin-top: 10px; margin-bottom: 0;">Visit: <a href="https://klusurabhi.in/accommodation" style="color: #dc2626; text-decoration: none;">klusurabhi.in/accommodation</a></p>
                </div>
                ` : ''}

                ${(useVirtualTemplate || isInternational) ? `
                <div style="background-color: #18181b; padding: 20px; border-left: 4px solid #dc2626; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 12px;">🌐 Virtual Participation</p>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0;">
                        This competition will be conducted <strong style="color: #ffffff;">virtually</strong>. ${useVirtualTemplate ? 'The Zoom meeting link will be sent to your email before 2 days of the event date. ' : ''}Please refer to the <strong style="color: #ffffff;">Virtual Participation Rules and Regulations</strong> for this competition (see below). ${!useVirtualTemplate ? 'Your ticket (PDF) is attached. ' : ''}We look forward to your participation!
                    </p>
                </div>
                <div style="background-color: #18181b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #333;">
                    <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 6px 0;">📧 For any queries, contact us at:</p>
                    <p style="color: #dc2626; font-size: 15px; font-weight: 600; margin: 0;"><a href="mailto:surabhi@kluniversity.in" style="color: #dc2626; text-decoration: none;">surabhi@kluniversity.in</a></p>
                </div>
                ` : ''}

                ${eventDetailsSection}

                ${(!useVirtualTemplate && !isInternational && registrationType !== "VISITOR") ? `
                <div style="background-color: rgba(34,197,94,0.12); border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">🏆 Prize Distribution & Certificates</p>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0;">
                        Please note that cash prizes will be distributed on the same day of the competition from <strong style="color: #ffffff;">5:30 PM to 6:30 PM</strong>. All participants will also receive a <strong style="color: #ffffff;">Certificate of Appreciation</strong> during the prize distribution ceremony.
                    </p>
                </div>
                ` : ''}

                ${whatsappButton}

                <div class="divider"></div>

                ${useVirtualTemplate ? `
                <p style="color: #ffffff; font-size: 18px; text-align: center; margin-bottom: 15px;">
                    <strong>🔗 Zoom Link Coming Soon</strong>
                </p>
                <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 0;">
                    No physical ticket is required. The Zoom meeting link will be sent to your email before 2 days of the event date. Please follow the Virtual Participation Rules and Regulations for this competition.
                </p>
                <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 10px; margin-bottom: 0;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>
                ` : `
                <p style="color: #ffffff; font-size: 18px; text-align: center; margin-bottom: 15px;">
                    <strong>🎟️ Your Entry Pass is Attached</strong>
                </p>
                <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-bottom: 0;">
                    ${isInternational ? 'Please find your virtual participation ticket (PDF) attached. Follow the Virtual Participation Guidelines in the ticket.' : 'Please find your official entry pass (PDF) attached below. Keep it handy for security checks at the venue.'}
                </p>
                ${(!useVirtualTemplate && !isInternational) ? '<p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 10px; margin-bottom: 0;"><strong style="color: #ffffff;">Physical College ID Card is mandatory</strong> for entry and verification at the venue.</p>' : ''}
                ${scheduleAttachment ? '<p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 10px; margin-bottom: 0;">Please find the schedule attached.</p>' : ''}
                ${(!useVirtualTemplate && !isInternational && registrationType !== "VISITOR") ? '<p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 12px; margin-bottom: 0;">We look forward to your enthusiastic participation.</p>' : ''}
                ${isInternational ? '<p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 10px; margin-bottom: 0;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>' : ''}
                `}

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

    // 3. Send Email - virtual participants: no PDF; others: attach PDF
    const attachments: { content: string; mime_type: string; name: string }[] = [];
    if (pdfBuffer && !useVirtualTemplate) {
        attachments.push({
            content: pdfBuffer.toString("base64"),
            mime_type: "application/pdf",
            name: `Surabhi_2026_${isInternational ? "Virtual_" : ""}Ticket_${event.name.replace(/\s+/g, "_")}.pdf`,
        });
    }
    if (scheduleAttachment) {
        attachments.push({
            content: scheduleAttachment.content,
            mime_type: scheduleAttachment.mimeType,
            name: "Surabhi_2026_Competitions_Schedule.jpeg",
        });
    }

    return sendZeptoMail({
        to: [{ email: user.email, name: user.name }],
        subject: subjectLine,
        htmlBody: htmlBody,
        ...(attachments.length > 0 ? { attachments } : {}),
        inlineImages: inlineImages
    });
}

/** Password reset email – theme matches Surabhi 2026 (dark, red accent) */
export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
    const baseUrl = "https://klusurabhi.in";
    const klLogoUrl = `${baseUrl}/images/kl_logo_white_text.png`;
    const surabhiLogoUrl = `${baseUrl}/images/surabhi1.png`;

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your Password - Surabhi 2026</title>
        <style>
            body { margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333; }
            .content { padding: 40px 30px; color: #ffffff; }
            .welcome-header { font-size: 20px; color: #dc2626; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .main-heading { font-size: 28px; color: #ffffff; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
            .text-body { color: #d4d4d8; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
            .footer { background-color: #18181b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #333; }
        </style>
    </head>
    <body>
        <div class="container">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; border-bottom: 3px solid #dc2626;">
                <tr>
                    <td align="left" style="padding: 20px;"><img src="${klLogoUrl}" alt="KL University" width="130"></td>
                    <td align="right" style="padding: 20px;"><img src="${surabhiLogoUrl}" alt="Surabhi 2026" width="110"></td>
                </tr>
            </table>
            <div class="content">
                <div class="welcome-header">Surabhi 2026</div>
                <div class="main-heading">Reset Your Password</div>
                <p class="text-body">Hello <strong style="color: #ffffff;">${name}</strong>,</p>
                <p class="text-body">We received a request to reset your password for your Surabhi 2026 account. Click the button below to set a new password:</p>
                <p style="text-align: center;"><a href="${resetUrl}" class="btn">Reset Password</a></p>
                <p class="text-body" style="font-size: 14px; color: #a1a1aa;">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
                <p class="text-body" style="font-size: 12px; color: #71717a; word-break: break-all;">Or copy this link: ${resetUrl}</p>
            </div>
            <div class="footer">
                <p>&copy; 2026 KL University. All rights reserved.</p>
                <p>Koneru Lakshmaiah Education Foundation, Vijayawada, Andhra Pradesh.</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendZeptoMail({
        to: [{ email, name }],
        subject: "Reset Your Password - Surabhi 2026",
        htmlBody,
    });
}

export async function sendAccommodationConfirmationEmail(
    user: { name: string; email: string },
    accommodationDetails: {
        primaryName: string;
        primaryEmail: string;
        primaryPhone: string;
        bookingType: string;
        gender: string;
        totalMembers: number;
        members: { name: string; email: string; phone: string }[];
        competitions: { name: string; category?: string }[];
    },
    pdfBuffer: Buffer
) {
    const baseUrl = "https://klusurabhi.in";
    const klLogoUrl = `${baseUrl}/images/kl_logo_white_text.png`;
    const surabhiLogoUrl = `${baseUrl}/images/surabhi1.png`;

    const membersList = accommodationDetails.members
        .map((m) => `<li>${m.name}${m.phone ? ` – ${m.phone}` : ""}</li>`)
        .join("");
    const competitionsList =
        accommodationDetails.competitions.length > 0
            ? accommodationDetails.competitions
                  .map((c) => `<li>${c.name}${c.category ? ` (${c.category})` : ""}</li>`)
                  .join("")
            : "<li>N/A</li>";

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Accommodation Confirmed - Surabhi 2026</title>
        <style>
            body { margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333; }
            .content { padding: 40px 30px; color: #ffffff; }
            .welcome-header { font-size: 20px; color: #dc2626; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .main-heading { font-size: 28px; color: #ffffff; font-weight: 800; margin-bottom: 20px; line-height: 1.2; }
            .text-body { color: #d4d4d8; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .details-card { background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 25px 0; }
            .details-card h3 { color: #dc2626; font-size: 16px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 8px; }
            .footer { background-color: #18181b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #333; }
            .highlight { color: #dc2626; }
        </style>
    </head>
    <body>
        <div class="container">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; border-bottom: 3px solid #dc2626;">
                <tr>
                    <td align="left" style="padding: 20px;"><img src="${klLogoUrl}" alt="KL University" width="130"></td>
                    <td align="right" style="padding: 20px;"><img src="${surabhiLogoUrl}" alt="Surabhi 2026" width="110"></td>
                </tr>
            </table>

            <div class="content">
                <div class="welcome-header">Welcome to Surabhi 2026!</div>
                <div class="main-heading">Your Accommodation is Confirmed</div>

                <p class="text-body">Dear <strong style="color: #ffffff;">${user.name}</strong>,</p>
                <p class="text-body">
                    We are delighted to confirm your accommodation booking for <strong class="highlight">Surabhi International Cultural Fest 2026</strong>. 
                    Thank you for choosing to be part of this grand celebration at KL University!
                </p>

                <div class="details-card">
                    <h3>Accommodation Details</h3>
                    <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Primary Guest:</strong> ${accommodationDetails.primaryName}</p>
                    <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Email:</strong> ${accommodationDetails.primaryEmail}</p>
                    <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Phone:</strong> ${accommodationDetails.primaryPhone || "N/A"}</p>
                    <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Booking Type:</strong> ${accommodationDetails.bookingType}</p>
                    <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Gender:</strong> ${accommodationDetails.gender}</p>
                    <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Total Members:</strong> ${accommodationDetails.totalMembers}</p>
                </div>

                <div class="details-card">
                    <h3>Accommodation Members</h3>
                    <ul style="color: #d4d4d8; padding-left: 20px; margin: 0;">${membersList}</ul>
                </div>

                <div class="details-card">
                    <h3>Registered Competitions</h3>
                    <ul style="color: #d4d4d8; padding-left: 20px; margin: 0;">${competitionsList}</ul>
                </div>

                <div style="background-color: #f59e0b; border: 2px solid #d97706; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
                    <p style="color: #000000; font-size: 16px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ Important – Read Carefully</p>
                    <p style="color: #1c1917; font-size: 15px; font-weight: 600; margin: 0; line-height: 1.6;">
                        The accommodation allotment will be directly done on campus. Please carry the accommodation pass PDF and your college physical ID card.
                    </p>
                </div>

                <div style="background-color: #dc2626/20; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 10px;">🎟️ Your Accommodation Pass is Attached</p>
                    <p style="color: #d4d4d8; font-size: 14px; margin: 0;">
                        Please find your official accommodation pass (PDF) attached to this email. 
                        Keep it handy for check-in and verification. The pass includes a QR code for quick verification at the venue.
                    </p>
                </div>

                <p class="text-body">
                    We look forward to welcoming you at KL University. Safe travels, and see you at Surabhi 2026!
                </p>

                <p class="text-body" style="font-style: italic;">
                    "Ignite Your Passion – Let's make this fest memorable together!"
                </p>
                <p style="color: #52525b; font-size: 12px; margin-top: 20px;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>
            </div>

            <div class="footer">
                <p>&copy; 2026 KL University. All rights reserved.</p>
                <p>Koneru Lakshmaiah Education Foundation, Vijayawada, Andhra Pradesh.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendZeptoMail({
        to: [{ email: user.email, name: user.name }],
        subject: "Accommodation Confirmed - Surabhi 2026",
        htmlBody,
        attachments: [{
            content: pdfBuffer.toString("base64"),
            mime_type: "application/pdf",
            name: "Surabhi_2026_Accommodation_Pass.pdf",
        }],
    });
}

function isNationalMockParliamentParticipant(competitions: { name: string; category?: string }[]): boolean {
    return competitions.some(
        (c) =>
            (c.name || "").toLowerCase().includes("national mock parliament") ||
            (c.name || "").toLowerCase().includes("national parliamentary simulation") ||
            (c.category || "").toLowerCase().includes("national mock parliament") ||
            (c.category || "").toLowerCase().includes("national parliamentary simulation")
    );
}

/** Day-wise welcome email for competition participants - fest info, entry pass, competition details, venue */
export async function sendWelcomeEmail(
    user: { name: string; email: string },
    dayLabel: string,
    competitions: { name: string; category?: string; date: string; venue: string; startTime: string; endTime?: string }[],
    entryPassPdfBuffer: Buffer | null
) {
    const baseUrl = "https://klusurabhi.in";
    const klLogoUrl = `${baseUrl}/images/kl_logo_white_text.png`;
    const surabhiLogoUrl = `${baseUrl}/images/surabhi1.png`;
    const showPrizeSection = !isNationalMockParliamentParticipant(competitions);

    const competitionsHtml = competitions.length > 0
        ? competitions.map((c) => `
            <div style="background: #0f0f0f; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0;">
              <p style="color: #ffffff; font-weight: 700; margin: 0 0 6px 0;">${c.name}</p>
              <p style="color: #a1a1aa; margin: 0; font-size: 14px;">📅 ${c.date} · ⏰ ${c.startTime}${c.endTime ? ` – ${c.endTime}` : ""}</p>
              <p style="color: #a1a1aa; margin: 4px 0 0 0; font-size: 14px;">📍 ${c.venue}</p>
            </div>`).join("")
        : "<p style=\"color: #a1a1aa;\">No competition details</p>";

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #333;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000; border-bottom: 3px solid #dc2626;">
      <tr><td align="left" style="padding: 20px;"><img src="${klLogoUrl}" alt="KL University" width="130"></td>
      <td align="right" style="padding: 20px;"><img src="${surabhiLogoUrl}" alt="Surabhi 2026" width="110"></td></tr>
    </table>
    <div style="padding: 40px 30px; color: #ffffff;">
      <div style="font-size: 20px; color: #dc2626; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Welcome to</div>
      <div style="font-size: 28px; color: #ffffff; font-weight: 800; margin-bottom: 20px;">Surabhi International Cultural Fest 2026</div>
      <p style="color: #d4d4d8; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">Hello <strong style="color: #ffffff;">${user.name}</strong>,</p>
      <p style="color: #d4d4d8; font-size: 16px; line-height: 1.7; margin-bottom: 20px;">We are thrilled to welcome you to <strong style="color: #dc2626;">Surabhi 2026</strong> — KL University's International Cultural Fest! This March 2nd–7th, the campus comes alive with music, dance, drama, art, literature, and more.</p>
      <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #dc2626; font-size: 16px; margin-top: 0;">About Surabhi</h3>
        <p style="color: #d4d4d8; margin: 0; line-height: 1.7;">Surabhi is the flagship cultural festival of KL University, bringing together thousands of students for artistic expression and cultural exchange. Across Chitrakala, Sahitya, Cine Carnival, Natyaka, Raaga, Nrithya, Vastranaut, National Parliamentary Simulation, and Kurukshetra — expect performances, competitions, and memories you'll cherish.</p>
      </div>
      <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #dc2626; font-size: 16px; margin-top: 0;">Your Competition(s) – ${dayLabel}</h3>
        ${competitionsHtml}
      </div>
      <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #dc2626; font-size: 16px; margin-top: 0;">Venue & Location</h3>
        <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Venue:</strong> KL University (KLEF Deemed to be University)</p>
        <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Address:</strong> Green Fields, Vaddeswaram, Guntur District, Andhra Pradesh – 522 302</p>
        <p style="color: #d4d4d8; margin: 8px 0;"><strong style="color: #ffffff;">Spot Registration:</strong> 8:00 AM – 10:00 AM daily at the venue</p>
      </div>
      <div style="background-color: #f59e0b; border: 2px solid #d97706; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
        <p style="color: #000000; font-size: 16px; font-weight: 700; margin: 0 0 8px 0;">⚠️ Important – Carry With You</p>
        <p style="color: #1c1917; font-size: 15px; font-weight: 600; margin: 0;">Please carry your <strong>physical college ID card</strong> and your <strong>Entry Pass PDF</strong> (attached) for verification at the venue.</p>
      </div>
      <div style="background-color: rgba(220,38,38,0.15); border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 10px;">🎟️ Your Entry Pass is Attached</p>
        <p style="color: #d4d4d8; font-size: 14px; margin: 0;">Your official entry pass (PDF) is attached. Download it and present it at the venue entrance.</p>
      </div>
      <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🗓️ Competitions Schedule Attached</p>
        <p style="color: #d4d4d8; font-size: 14px; margin: 0; line-height: 1.6;">
          Please find the competitions schedule attached.
        </p>
      </div>
      <div style="background: linear-gradient(135deg, #1e3a1e 0%, #0d2d0d 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin: 30px 0;">
        <p style="color: #22c55e; font-size: 18px; font-weight: 800; margin: 0 0 12px 0;">👋 Bringing Friends? No Problem!</p>
        <p style="color: #dcfce7; font-size: 16px; line-height: 1.7; margin: 0;">Even if your friends haven't registered online — get them to campus and complete <strong style="color: #ffffff;">spot registrations</strong> at the venue (8:00 AM – 10:00 AM daily). Accommodation will be provided to spot registration participants too!</p>
      </div>
      <div style="background-color: #18181b; border: 1px solid #333; border-radius: 8px; padding: 25px; margin: 25px 0;">
        <h3 style="color: #dc2626; font-size: 16px; margin-top: 0;">Accommodation</h3>
        <p style="color: #d4d4d8; margin: 0 0 12px 0; line-height: 1.7;"><strong style="color: #ffffff;">Spot registration participants</strong> travelling from other cities are eligible for accommodation.</p>
        <p style="color: #a1a1aa; font-size: 14px; margin: 0;"><strong style="color: #f59e0b;">Note:</strong> Accommodation is <strong>not provided</strong> for participants from nearby areas (within 75 km radius).</p>
      </div>
      ${showPrizeSection ? `
      <div style="background-color: rgba(34,197,94,0.12); border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">🏆 Prize Distribution & Certificates</p>
        <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0;">Please note that cash prizes will be distributed on the same day of the competition from <strong style="color: #ffffff;">5:30 PM to 6:30 PM</strong>. All participants will also receive a <strong style="color: #ffffff;">Certificate of Appreciation</strong> during the prize distribution ceremony.</p>
      </div>
      ` : ''}
      <p style="color: #d4d4d8; font-size: 16px; text-align: center; margin: 25px 0 0 0;">We look forward to your enthusiastic participation.</p>
      <p style="color: #52525b; font-size: 12px; margin-top: 20px;">For queries: <a href="mailto:surabhi@kluniversity.in" style="color: #dc2626;">surabhi@kluniversity.in</a></p>
    </div>
    <div style="background-color: #18181b; padding: 30px; text-align: center; color: #52525b; font-size: 12px; border-top: 1px solid #333;">
      <p>&copy; 2026 KL University. All rights reserved.</p>
    </div>
    </div>
    </body>
    </html>
    `;

    const attachments: { content: string; mime_type: string; name: string }[] = [];

    if (entryPassPdfBuffer) {
        attachments.push({
            content: entryPassPdfBuffer.toString("base64"),
            mime_type: "application/pdf",
            name: "Surabhi_2026_Entry_Pass.pdf",
        });
    }

    const scheduleAsset = await getRemoteAssetBase64(COMPETITIONS_SCHEDULE_IMAGE_URL);
    if (scheduleAsset) {
        attachments.push({
            content: scheduleAsset.content,
            mime_type: scheduleAsset.mimeType,
            name: "Surabhi_2026_Competitions_Schedule.jpeg",
        });
    }

    return sendZeptoMail({
        to: [{ email: user.email, name: user.name }],
        subject: `Welcome to Surabhi 2026 – Your Entry for ${dayLabel}`,
        htmlBody,
        attachments,
    });
}
