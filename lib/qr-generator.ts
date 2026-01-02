import QRCode from 'qrcode';
import crypto from 'crypto';

interface TicketData {
    userId: string;
    transactionId: string;
    name: string;
    email: string;
    paymentStatus: string;
    isApproved: boolean;
}

/**
 * Generate a secure QR code for ticket verification
 * Creates a URL that opens the verification page when scanned
 */
export async function generateTicketQR(data: TicketData): Promise<string> {
    const timestamp = new Date().toISOString();

    // Create payload
    const payload = {
        userId: data.userId,
        transactionId: data.transactionId,
        timestamp,
    };

    // Sign the payload with HMAC
    const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret';
    const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

    // Combine payload and signature
    const qrData = {
        ...payload,
        signature,
    };

    // Create admin verification URL
    const baseUrl = process.env.BETTER_AUTH_URL || 'https://klsurabhi.nischalsingana.com';
    const verificationUrl = `${baseUrl}/admin/verify-tickets?qr=${encodeURIComponent(JSON.stringify(qrData))}`;

    // Generate QR code as data URL with the verification URL
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
            dark: '#dc2626', // Red color for QR code
            light: '#ffffff', // White background
        },
    });

    return qrCodeDataURL;
}

/**
 * Verify QR code signature
 */
export function verifyQRSignature(qrData: string): {
    valid: boolean;
    payload?: any;
    error?: string;
} {
    try {
        const data = JSON.parse(qrData);
        const { signature, ...payload } = data;

        if (!signature) {
            return { valid: false, error: 'Missing signature' };
        }

        // Recreate signature
        const secret = process.env.BETTER_AUTH_SECRET || 'fallback-secret';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' };
        }

        // Check timestamp (valid for 3 months / 90 days)
        const timestamp = new Date(payload.timestamp);
        const now = new Date();
        const daysDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff > 90) {
            return { valid: false, error: 'QR code expired' };
        }

        return { valid: true, payload };
    } catch (error) {
        return { valid: false, error: 'Invalid QR code format' };
    }
}
