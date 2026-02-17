import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { createPass } from '@/lib/pass';

interface TicketData {
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
    collage?: string | null;
    paymentStatus: string;
    isApproved: boolean;
    eventId?: string;
    gender?: string | null; // Added gender
}

/**
 * Generate a secure QR code for ticket verification
 * Creates a URL that opens the verification page when scanned
 * NOW USES DB-BACKED PASS SYSTEM
 */
export async function generateTicketQR(data: TicketData): Promise<string> {
    // 1. Find existing pass for user or create new one
    // Prioritize finding a pass for THIS specific event if eventId is provided
    let pass = await prisma.pass.findFirst({
        where: {
            userId: data.userId,
            eventId: data.eventId || null
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!pass) {
        // Create new pass if none exists for this event
        pass = await createPass(data.userId, {
            passType: data.eventId ? 'EVENT' : 'GENERAL',
            eventId: data.eventId
        });
    }

    // 2. Construct correct verification URL
    const baseUrl = (process.env.BETTER_AUTH_URL || 'https://klusurabhi.in').replace(/\/$/, '');

    // Append details for generic scanners (URL Preview)
    const params = new URLSearchParams();
    if (data.name) params.append('name', String(data.name));
    if (data.collage) params.append('college', String(data.collage));
    if (data.phone) params.append('phone', String(data.phone));
    if (data.gender) params.append('gender', String(data.gender)); // Added to params

    const verificationUrl = `${baseUrl}/verify/${pass.passToken}?${params.toString()}`;

    // 3. Generate QR code (higher resolution for better quality in PDF)
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 600, // Increased from 400 for better quality at larger size
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    });

    return qrCodeDataURL;
}

/**
 * Generate QR code for accommodation pass verification
 * URL points to /verify/accommodation/[token]
 */
export async function generateAccommodationQR(passToken: string): Promise<string> {
    const baseUrl = (process.env.BETTER_AUTH_URL || "https://klusurabhi.in").replace(/\/$/, "");
    const verificationUrl = `${baseUrl}/verify/accommodation/${passToken}`;

    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: "M",
        type: "image/png",
        width: 600,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
    });

    return qrCodeDataURL;
}
