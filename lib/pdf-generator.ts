import PDFDocument from 'pdfkit';
import { generateTicketQR } from './qr-generator';

interface UserTicketData {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    collage: string | null;
    collageId: string | null;
    transactionId: string | null;
    paymentStatus: string;
    isApproved: boolean;
}

/**
 * Generate a cinematic movie ticket-style PDF with QR code
 * Dark theme with fiery red accents matching the website
 */
export async function generateTicketPDF(userData: UserTicketData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            // Create PDF document (ticket size: 8.5" x 3.5")
            const doc = new PDFDocument({
                size: [612, 252], // 8.5" x 3.5" in points
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
                // Use built-in fonts to avoid file system issues
                font: 'Helvetica',
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            // Generate QR code
            const qrCodeDataURL = await generateTicketQR({
                userId: userData.userId,
                transactionId: userData.transactionId || '',
                name: userData.name,
                email: userData.email,
                paymentStatus: userData.paymentStatus,
                isApproved: userData.isApproved,
            });

            // Convert data URL to buffer
            const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

            // BACKGROUND - Dark gradient
            doc
                .rect(0, 0, 612, 252)
                .fillAndStroke('#0a0000', '#1a0000');

            // Red gradient accent on left side
            doc
                .rect(0, 0, 200, 252)
                .fill('#1a0000');

            // Perforated edge effect (left side)
            for (let i = 10; i < 252; i += 20) {
                doc
                    .circle(200, i, 5)
                    .fill('#0a0000');
            }

            // HEADER - Surabhi Branding
            doc
                .fontSize(32)
                .fillColor('#dc2626')
                .font('Helvetica-Bold')
                .text('SURABHI', 20, 30, { width: 160, align: 'center' });

            doc
                .fontSize(14)
                .fillColor('#ef4444')
                .font('Helvetica')
                .text('2026', 20, 70, { width: 160, align: 'center' });

            doc
                .fontSize(10)
                .fillColor('#9ca3af')
                .text('INTERNATIONAL', 20, 90, { width: 160, align: 'center' })
                .text('CULTURAL FEST', 20, 105, { width: 160, align: 'center' });

            // QR CODE
            doc.image(qrBuffer, 40, 140, { width: 100, height: 100 });

            // TICKET DETAILS - Right side
            const leftMargin = 220;
            let yPos = 30;

            // Title
            doc
                .fontSize(20)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text('ENTRY PASS', leftMargin, yPos);

            yPos += 35;

            // User Details
            doc
                .fontSize(10)
                .fillColor('#9ca3af')
                .font('Helvetica')
                .text('PARTICIPANT NAME', leftMargin, yPos);

            doc
                .fontSize(14)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(userData.name.toUpperCase(), leftMargin, yPos + 15, { width: 250 });

            yPos += 45;

            // Email
            doc
                .fontSize(10)
                .fillColor('#9ca3af')
                .font('Helvetica')
                .text('EMAIL', leftMargin, yPos);

            doc
                .fontSize(11)
                .fillColor('#ffffff')
                .font('Helvetica')
                .text(userData.email, leftMargin, yPos + 15, { width: 250 });

            yPos += 40;

            // College Info (if available)
            if (userData.collage) {
                doc
                    .fontSize(10)
                    .fillColor('#9ca3af')
                    .font('Helvetica')
                    .text('COLLEGE', leftMargin, yPos);

                doc
                    .fontSize(11)
                    .fillColor('#ffffff')
                    .font('Helvetica')
                    .text(userData.collage, leftMargin, yPos + 15, { width: 180 });
            }

            // College ID
            if (userData.collageId) {
                doc
                    .fontSize(10)
                    .fillColor('#9ca3af')
                    .font('Helvetica')
                    .text('ID', leftMargin + 200, yPos);

                doc
                    .fontSize(11)
                    .fillColor('#ffffff')
                    .font('Helvetica')
                    .text(userData.collageId, leftMargin + 200, yPos + 15);
            }

            yPos += 40;

            // Payment Status Badge
            const statusColor = userData.isApproved ? '#10b981' : '#f59e0b';
            const statusText = userData.isApproved ? 'APPROVED' : 'PENDING';

            doc
                .roundedRect(leftMargin, yPos, 100, 25, 5)
                .fillAndStroke(statusColor + '20', statusColor);

            doc
                .fontSize(12)
                .fillColor(statusColor)
                .font('Helvetica-Bold')
                .text(statusText, leftMargin, yPos + 7, { width: 100, align: 'center' });

            // Transaction ID (if available)
            if (userData.transactionId) {
                doc
                    .fontSize(8)
                    .fillColor('#6b7280')
                    .font('Helvetica')
                    .text(`TXN: ${userData.transactionId}`, leftMargin + 110, yPos + 10);
            }

            // FOOTER - Decorative elements
            doc
                .moveTo(220, 240)
                .lineTo(600, 240)
                .strokeColor('#dc2626')
                .lineWidth(2)
                .stroke();

            doc
                .fontSize(8)
                .fillColor('#6b7280')
                .font('Helvetica')
                .text('KL UNIVERSITY • VIJAYAWADA', 220, 245, { width: 380, align: 'center' });

            // ========== PAGE 2: ENTRY RULES & REQUIREMENTS ==========
            doc.addPage({
                size: [612, 792], // Standard letter size for rules page
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
            });

            // Page 2 Background
            doc
                .rect(0, 0, 612, 792)
                .fill('#0a0000');

            // Header
            doc
                .fontSize(24)
                .fillColor('#dc2626')
                .font('Helvetica-Bold')
                .text('ENTRY REQUIREMENTS & RULES', 40, 50, { width: 532, align: 'center' });

            doc
                .fontSize(10)
                .fillColor('#9ca3af')
                .font('Helvetica')
                .text('Please read carefully before attending the event', 40, 85, { width: 532, align: 'center' });

            let rulesY = 120;

            // IMPORTANT NOTICE
            doc
                .roundedRect(40, rulesY, 532, 60, 5)
                .fillAndStroke('#dc2626' + '20', '#dc2626');

            doc
                .fontSize(12)
                .fillColor('#dc2626')
                .font('Helvetica-Bold')
                .text('⚠️ MANDATORY REQUIREMENTS', 50, rulesY + 10, { width: 512 });

            doc
                .fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica')
                .text('• Bring your COLLEGE ID CARD along with this PDF (soft copy or printed)', 50, rulesY + 30, { width: 512 })
                .text('• Both documents must be presented at the entry gate for verification', 50, rulesY + 45, { width: 512 });

            rulesY += 80;

            // ENTRY GUIDELINES
            doc
                .fontSize(14)
                .fillColor('#ef4444')
                .font('Helvetica-Bold')
                .text('Entry Guidelines', 40, rulesY);

            rulesY += 25;

            const entryRules = [
                'Entry is strictly by valid ticket and college ID only',
                'Arrive at least 30 minutes before your event time',
                'Follow the designated entry and exit points',
                'Cooperate with security personnel during verification',
                'Keep your ticket and ID accessible at all times',
            ];

            doc
                .fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica');

            entryRules.forEach((rule) => {
                doc.text(`• ${rule}`, 50, rulesY, { width: 512 });
                rulesY += 20;
            });

            rulesY += 10;

            // PROHIBITED ITEMS
            doc
                .fontSize(14)
                .fillColor('#ef4444')
                .font('Helvetica-Bold')
                .text('Prohibited Items', 40, rulesY);

            rulesY += 25;

            const prohibitedItems = [
                'Weapons, sharp objects, or any dangerous items',
                'Alcohol, drugs, or illegal substances',
                'Outside food and beverages (except water)',
                'Professional cameras or recording equipment without permission',
                'Banners, posters, or promotional materials',
            ];

            doc
                .fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica');

            prohibitedItems.forEach((item) => {
                doc.text(`• ${item}`, 50, rulesY, { width: 512 });
                rulesY += 20;
            });

            rulesY += 10;

            // GENERAL RULES
            doc
                .fontSize(14)
                .fillColor('#ef4444')
                .font('Helvetica-Bold')
                .text('General Rules', 40, rulesY);

            rulesY += 25;

            const generalRules = [
                'Maintain decorum and respect fellow participants',
                'Follow event timings strictly - late entry may not be permitted',
                'Smoking is strictly prohibited inside the campus',
                'Littering is prohibited - use designated dustbins',
                'Photography is allowed for personal use only',
                'Management reserves the right to deny entry without prior notice',
            ];

            doc
                .fontSize(10)
                .fillColor('#ffffff')
                .font('Helvetica');

            generalRules.forEach((rule) => {
                doc.text(`• ${rule}`, 50, rulesY, { width: 512 });
                rulesY += 20;
            });

            rulesY += 20;

            // CONTACT INFORMATION
            doc
                .fontSize(14)
                .fillColor('#ef4444')
                .font('Helvetica-Bold')
                .text('Contact Information', 40, rulesY);

            rulesY += 25;

            doc
                .fontSize(10)
                .fillColor('#9ca3af')
                .font('Helvetica')
                .text('For queries or assistance:', 50, rulesY);

            rulesY += 20;

            doc
                .fillColor('#ffffff')
                .text('📧 Email: surabhi@kluniversity.in', 50, rulesY)
                .text('📞 Phone: +91 XXX XXX XXXX', 50, rulesY + 15)
                .text('🌐 Website: klsurabhi.nischalsingana.com', 50, rulesY + 30);

            rulesY += 60;

            // FOOTER
            doc
                .moveTo(40, rulesY)
                .lineTo(572, rulesY)
                .strokeColor('#dc2626')
                .lineWidth(2)
                .stroke();

            doc
                .fontSize(10)
                .fillColor('#9ca3af')
                .font('Helvetica-Bold')
                .text('We look forward to seeing you at Surabhi 2026!', 40, rulesY + 15, { width: 532, align: 'center' });

            doc
                .fontSize(8)
                .fillColor('#6b7280')
                .font('Helvetica')
                .text('KL University • Student Activity Center • Vijayawada', 40, rulesY + 35, { width: 532, align: 'center' });

            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
