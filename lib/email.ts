import * as nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    // Create transporter dynamically to ensure env vars are loaded
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Surabhi 2026" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
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
    subject: "🎉 Welcome to Surabhi 2026!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎊 Welcome to Surabhi 2026!</h1>
          <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">International Cultural Fest • KL University</p>
        </div>
        
        <div style="padding: 30px; background: #0a0a0a; border-radius: 0 0 10px 10px;">
          <h2 style="color: #f97316; font-size: 24px; margin-bottom: 20px;">Hello ${userName || "Participant"}! 👋</h2>
          
          <p style="color: #d1d5db; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            Thank you for registering for <strong style="color: #f97316;">Surabhi 2026 - International Cultural Fest</strong>! We're excited to have you join us for this incredible cultural celebration.
          </p>
          
          <div style="background: #1f1f1f; border: 2px solid #f97316; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="color: #f97316; font-weight: 600; margin: 10px 0;">📧 Registered Email: ${userEmail}</p>
            <p style="color: #d1d5db; margin: 10px 0;">Your account has been created successfully!</p>
          </div>
          
          <h3 style="color: #f97316; font-size: 20px; margin: 30px 0 15px 0;">🚀 Get Started</h3>
          
          <ol style="color: #d1d5db; font-size: 16px; line-height: 1.8; padding-left: 20px;">
            <li style="margin: 10px 0;"><strong>Complete Payment:</strong> Proceed with payment to unlock all features</li>
            <li style="margin: 10px 0;"><strong>Register for Events:</strong> Browse and register for cultural events</li>
            <li style="margin: 10px 0;"><strong>Book Accommodation:</strong> If needed, reserve your stay through the portal</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              🔐 Login to Portal
            </a>
          </div>
          
          <div style="background: #1f1f1f; border-left: 4px solid #f97316; padding: 15px; margin: 30px 0; border-radius: 5px;">
            <p style="color: #d1d5db; font-size: 14px; margin: 0;">
              <strong style="color: #f97316;">💡 Next Step:</strong> Login to your account and complete the payment process to access all event registrations and accommodation booking features.
            </p>
          </div>
          
          <p style="color: #f97316; font-weight: 600; text-align: center; margin-top: 30px;">
            See you at Surabhi 2026! 🎭🎨🎵
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 13px; text-align: center;">
            Team Surabhi 2026<br>
            KL University • International Cultural Fest<br>
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login" 
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
