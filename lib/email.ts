import * as nodemailer from "nodemailer";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail({ to, subject, html, text, attachments }: EmailOptions) {
  try {
    // Create transporter dynamically to ensure env vars are loaded
    // Create transporter using SES
    const transporter = nodemailer.createTransport({
      SES: { ses, aws: { SendRawEmailCommand } },
    } as any);

    const info = await transporter.sendMail({
      from: `"Surabhi 2026" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      attachments: attachments || [],
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Email error:", error);
    return { success: false, error: error.message };
  }
}

// Simple email templates
export const emailTemplates = {
  userApproved: (userName: string, userEmail: string) => ({
    subject: "🎉 Welcome to Surabhi 2026 - Your Journey Begins!",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Surabhi 2026</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #0a0a0a 0%, #1a0a0a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);">
                
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%); padding: 0; position: relative;">
                    <div style="background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=') center/cover; padding: 50px 30px; text-align: center;">
                      <div style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(10px); border-radius: 12px; padding: 30px; display: inline-block;">
                        <!-- Surabhi Logo -->
                        <img src="${process.env.NEXT_PUBLIC_APP_URL || "https://klusurabhi.in"}/favicon.ico" 
                             alt="Surabhi 2026" 
                             style="height: 140px; width: 140px; margin: 0 auto 12px auto; display: block; filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5)); image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
                        
                        <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); letter-spacing: -0.5px;">
                          Welcome to Surabhi 2026!
                        </h1>
                        <p style="margin: 12px 0 0 0; color: #fecaca; font-size: 18px; font-weight: 500; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);">
                          International Cultural Fest • KL University
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 30px; background: #0a0a0a;">
                    
                    <!-- Greeting -->
                    <h2 style="color: #ef4444; font-size: 28px; margin: 0 0 24px 0; font-weight: 700;">
                      Hello ${userName || "Participant"}! 👋
                    </h2>
                    
                    <p style="color: #e5e5e5; font-size: 17px; line-height: 1.7; margin: 0 0 24px 0;">
                      Congratulations! 🎉 Your registration for <strong style="color: #ef4444;">Surabhi 2026</strong> has been successfully completed. We're thrilled to have you join us for this spectacular cultural celebration at KL University.
                    </p>
                    
                    <!-- Account Info Card -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #1f1f1f 0%, #2a1a1a 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <p style="margin: 0; color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                  ✅ Account Created
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <p style="margin: 0; color: #fecaca; font-size: 15px; line-height: 1.6;">
                                  <strong style="color: #ffffff;">Email:</strong> ${userEmail}
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top: 12px;">
                                <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                                  Your account is now active and ready to use!
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- What's Next Section -->
                    <h3 style="color: #ef4444; font-size: 22px; margin: 40px 0 20px 0; font-weight: 700;">
                      🚀 What's Next?
                    </h3>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #2a2a2a;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="width: 40px; vertical-align: top;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                  💳
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                                  Complete Payment
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                                  Process your registration fee to unlock all festival features and event access
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #2a2a2a;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="width: 40px; vertical-align: top;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                  🎭
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                                  Register for Events
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                                  Browse our exciting lineup of cultural events, competitions, and performances
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="width: 40px; vertical-align: top;">
                                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                  🏠
                                </div>
                              </td>
                              <td style="vertical-align: top;">
                                <p style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                                  Book Accommodation
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                                  Reserve your stay at our campus facilities for a comfortable festival experience
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://klusurabhi.in"}/login" 
                             style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 17px; box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4); transition: all 0.3s ease;">
                            🔐 Access Your Portal
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Important Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                      <tr>
                        <td style="background: #1a1a1a; border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px;">
                          <p style="margin: 0; color: #d1d5db; font-size: 15px; line-height: 1.6;">
                            <strong style="color: #ef4444; font-size: 16px;">💡 Important:</strong><br>
                            Complete your payment process to unlock event registrations, accommodation booking, and all festival features. Your journey to an unforgettable cultural experience starts now!
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Closing -->
                    <p style="color: #ef4444; font-weight: 700; text-align: center; margin: 40px 0 20px 0; font-size: 18px;">
                      See you at Surabhi 2026! 🎭🎨🎵
                    </p>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #050505; padding: 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px; font-weight: 600;">
                      Team Surabhi 2026
                    </p>
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px;">
                      KL University • International Cultural Fest
                    </p>
                    <p style="margin: 12px 0 0 0; color: #4b5563; font-size: 12px;">
                      This is an automated email. Please do not reply to this message.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  paymentApproved: (userName: string, userEmail: string) => ({
    subject: "✅ Payment Approved - Surabhi 2026",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <div style="font-size: 64px; margin-bottom: 10px;">✅</div>
          <h1 style="margin: 0; color: #ffffff; font-size: 32px;">Payment Approved!</h1>
        </div>
        
        <div style="padding: 30px; background: #0a0a0a; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10b981; font-size: 24px; margin-bottom: 20px;">Hello ${userName || "Participant"}! 👋</h2>
          
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Great news! Your payment for <strong style="color: #f97316;">Surabhi 2026</strong> has been successfully verified and approved.
          </p>
          
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: rgba(16, 185, 129, 0.1); border: 2px solid #10b981; padding: 15px 25px; border-radius: 50px;">
              <span style="color: #10b981; font-weight: 700; font-size: 18px;">💳 Payment Verified</span>
            </div>
          </div>
          
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.8; margin: 30px 0 20px 0;">
            You now have full access to:
          </p>
          
          <ul style="color: #d1d5db; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li style="margin: 10px 0;">🎭 Register for cultural events and competitions</li>
            <li style="margin: 10px 0;">🏠 Book accommodation if needed</li>
            <li style="margin: 10px 0;">📱 Access your personalized dashboard</li>
            <li style="margin: 10px 0;">🎫 View event schedules and updates</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://klusurabhi.in"}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              🚀 Access Portal Now
            </a>
          </div>
          
          <p style="color: #10b981; font-weight: 600; text-align: center; margin-top: 30px;">
            We're excited to see you at Surabhi 2026! 🎉
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 13px; text-align: center;">
            Team Surabhi 2026<br>
            KL University • International Cultural Fest
          </p>
        </div>
      </div>
    `,
  }),

  userRejected: (userName: string, userEmail: string) => ({
    subject: "Surabhi 2026 - Registration Status Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Surabhi 2026 - Registration Update</h1>
        </div>
        
        <div style="padding: 30px; background: #0a0a0a; border-radius: 0 0 10px 10px;">
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Hello ${userName || "Participant"},
          </p>
          
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Thank you for your interest in Surabhi 2026. Unfortunately, we are unable to approve your registration at this time.
          </p>
          
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.8;">
            For assistance, please contact our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 13px; text-align: center;">
            Team Surabhi 2026 • KL University
          </p>
        </div>
      </div>
    `,
  }),
};
