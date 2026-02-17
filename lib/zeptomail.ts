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
    eventDetails?: { description?: string; termsAndConditions?: string; virtualTermsAndConditions?: string | null; whatsappLink?: string | null },
    isInternational?: boolean,
    /** For virtual/international competition participants: no PDF, virtual-only content, Zoom sent 2 days before */
    isVirtualParticipant?: boolean
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
    return sendZeptoMail({
        to: [{ email: user.email, name: user.name }],
        subject: subjectLine,
        htmlBody: htmlBody,
        ...(pdfBuffer && !useVirtualTemplate && {
            attachments: [{
                content: pdfBuffer.toString('base64'),
                mime_type: "application/pdf",
                name: `Surabhi_2026_${isInternational ? 'Virtual_' : ''}Ticket_${event.name.replace(/\s+/g, '_')}.pdf`
            }],
        }),
        inlineImages: inlineImages
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
