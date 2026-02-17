import { NextResponse } from "next/server";
import { generateAccommodationPassToken } from "@/lib/accommodation-pass";
import { generateAccommodationPassPDF } from "@/lib/pdf-generator";
import { sendAccommodationConfirmationEmail } from "@/lib/zeptomail";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email") || "singananischal@gmail.com";

        const isDev = process.env.NODE_ENV === "development";
        const secret = process.env.TEST_EMAIL_SECRET;
        const authHeader = req.headers.get("authorization");
        const validSecret = secret && authHeader === `Bearer ${secret}`;

        if (!isDev && !validSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const passToken = generateAccommodationPassToken();
        const testUser = { name: "Test User", email };
        const testDetails = {
            primaryName: "Test User",
            primaryEmail: email,
            primaryPhone: "9876543210",
            bookingType: "GROUP",
            gender: "MALE",
            totalMembers: 3,
            members: [
                { name: "Test User", email, phone: "9876543210" },
                { name: "Member Two", email: "member2@example.com", phone: "9876543211" },
                { name: "Member Three", email: "member3@example.com", phone: "9876543212" },
            ],
            competitions: [
                { name: "Dance Competition", category: "Cultural" },
                { name: "Quiz", category: "Technical" },
            ],
        };

        const pdfData = {
            passToken,
            primaryName: testDetails.primaryName,
            primaryEmail: testDetails.primaryEmail,
            primaryPhone: testDetails.primaryPhone,
            collage: "Test College",
            collageId: "TST001",
            gender: testDetails.gender,
            bookingType: testDetails.bookingType,
            members: testDetails.members,
            competitions: testDetails.competitions,
        };

        const pdfBuffer = await generateAccommodationPassPDF(pdfData);
        const result = await sendAccommodationConfirmationEmail(testUser, testDetails, pdfBuffer);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Test accommodation email sent to ${email}`,
        });
    } catch (error: any) {
        console.error("Test accommodation email error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
