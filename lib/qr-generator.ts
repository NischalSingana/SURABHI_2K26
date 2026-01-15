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
}

/**
 * Generate a secure QR code for ticket verification
 * Creates a URL that opens the verification page when scanned
 * NOW USES DB-BACKED PASS SYSTEM
 */
export async function generateTicketQR(data: TicketData): Promise<string> {
    // 1. Find existing pass for user or create new one
    let pass = await prisma.pass.findFirst({
        where: { userId: data.userId },
        orderBy: { createdAt: 'desc' }
    });

    if (!pass) {
        // Create new pass if none exists
        pass = await createPass(data.userId, {
            passType: 'GENERAL'
        });
    }

    // 2. Construct correct verification URL
    const baseUrl = (process.env.BETTER_AUTH_URL || 'https://klusurabhi.in').replace(/\/$/, '');

    // Append details for generic scanners (URL Preview)
    const params = new URLSearchParams();
    if (data.name) params.append('name', String(data.name));
    if (data.collage) params.append('college', String(data.collage));
    if (data.phone) params.append('phone', String(data.phone));

    const verificationUrl = `${baseUrl}/verify/${pass.passToken}?${params.toString()}`;

    // 3. Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    });

    return qrCodeDataURL;
}


