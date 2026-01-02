import * as dotenv from "dotenv";
import { sendEmail, emailTemplates } from "../lib/email";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testEmail() {
    console.log("🚀 Testing email configuration...");
    console.log("📧 Sending welcome email to: singananischal@gmail.com");

    try {
        // Test with the new professional welcome email template
        const template = emailTemplates.userApproved("Nischal Singana", "singananischal@gmail.com");

        const result = await sendEmail({
            to: "singananischal@gmail.com",
            subject: template.subject,
            html: template.html,
        });

        if (result.success) {
            console.log("✅ Email sent successfully!");
            console.log("📬 Message ID:", result.messageId);
            console.log("\n🎉 Professional welcome email sent with Surabhi logo!");
            console.log("📧 Check singananischal@gmail.com for the email.");
            console.log("\n✨ Email features:");
            console.log("  • Surabhi logo (120px height) in header");
            console.log("  • Dark background (#0a0a0a) with fiery red accents");
            console.log("  • Professional gradient header (#dc2626 to #991b1b)");
            console.log("  • Modern card-based layout");
            console.log("  • Clear call-to-action buttons");
            console.log("  • Mobile-responsive design");
        } else {
            console.error("❌ Email failed to send");
            console.error("Error:", result.error);
        }
    } catch (error: any) {
        console.error("❌ Test failed with error:");
        console.error(error.message);
        console.error("\n💡 Troubleshooting tips:");
        console.error("1. Check your .env.local file has correct SMTP credentials");
        console.error("2. Verify SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD are set");
        console.error("3. Ensure your email provider allows SMTP access");
        console.error("4. Check if you need an app-specific password");
    }
}

testEmail();
