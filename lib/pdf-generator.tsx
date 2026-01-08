import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { generateTicketQR } from './qr-generator';
import fs from 'fs';
import path from 'path';

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

// BookMyShow Style Vertical Ticket Design
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#0a0a0a',
        fontFamily: 'Helvetica',
    },
    // Vertical Ticket (approx 4.1" x 8.3")
    ticketPage: {
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    // Header Section
    headerMetadata: {
        width: '100%',
        marginBottom: 20,
        alignItems: 'center',
        borderBottom: '1px solid #333',
        paddingBottom: 15,
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 15,
    },
    eventName: {
        color: '#ef4444', // Red-500
        fontSize: 32,
        fontWeight: 'black', // heavy
        letterSpacing: 2,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    eventSubtitle: {
        color: '#9ca3af', // Gray-400
        fontSize: 10,
        letterSpacing: 3,
        textTransform: 'uppercase',
    },

    // Pass Type Badge
    passTypeContainer: {
        marginTop: 15,
        marginBottom: 15,
        backgroundColor: '#ef4444',
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 4,
    },
    passTypeText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    // Details Section
    detailsContainer: {
        width: '100%',
        padding: 15,
        backgroundColor: '#111111',
        borderRadius: 12,
        marginBottom: 20,
        border: '1px solid #222',
    },
    row: {
        marginBottom: 12,
    },
    label: {
        color: '#6b7280', // Gray-500
        fontSize: 9,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    valueSmall: {
        color: '#d1d5db',
        fontSize: 10,
    },

    // QR Section
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 15,
        width: '100%',
        aspectRatio: 1,
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    scanText: {
        color: '#ef4444',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 20,
    },

    // Footer
    footer: {
        marginTop: 'auto',
        width: '100%',
        alignItems: 'center',
        borderTop: '1px dashed #333',
        paddingTop: 15,
    },
    footerText: {
        color: '#4b5563',
        fontSize: 9,
        marginBottom: 3,
    },
    ticketId: {
        color: '#333',
        fontSize: 8,
        fontFamily: 'Courier',
    },

    // Rules Page Styles (Keeping existing relevant ones)
    rulesPage: { padding: 30 },
    rulesTitle: { fontSize: 24, color: '#dc2626', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    rulesText: { fontSize: 10, color: '#d1d5db', marginBottom: 6, lineHeight: 1.5 },
    sectionHeader: { fontSize: 14, color: '#ffffff', marginTop: 15, marginBottom: 8, fontWeight: 'bold' },
});

export async function generateTicketPDF(userData: UserTicketData): Promise<Buffer> {
    const qrCodeDataURL = await generateTicketQR({
        userId: userData.userId,
        transactionId: userData.transactionId || '',
        name: userData.name,
        email: userData.email,
        paymentStatus: userData.paymentStatus,
        isApproved: userData.isApproved,
    });

    // Read logo as base64
    const logoPath = path.join(process.cwd(), 'public', 'images', 'surabhi_white_logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

    const TicketDocument = (
        <Document>
            {/* Page 1: Vertical Mobile Ticket */}
            <Page size={[320, 650]} style={styles.ticketPage}>

                {/* Branding */}
                <View style={styles.headerMetadata}>
                    <Image src={logoBase64} style={styles.logo} />
                    <Text style={styles.eventName}>SURABHI 2026</Text>
                    <Text style={styles.eventSubtitle}>OFFICIAL ENTRY PASS</Text>

                    <View style={styles.passTypeContainer}>
                        <Text style={styles.passTypeText}>GENERAL ACCESS</Text>
                    </View>
                </View>

                {/* User Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.row}>
                        <Text style={styles.label}>ATTENDEE</Text>
                        <Text style={styles.value}>{userData.name.toUpperCase()}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>CONTACT</Text>
                        <Text style={styles.valueSmall}>{userData.email}</Text>
                        {userData.phone && <Text style={styles.valueSmall}>{userData.phone}</Text>}
                    </View>

                    {(userData.collage || userData.collageId) && (
                        <View style={styles.row}>
                            <Text style={styles.label}>INSTITUTION</Text>
                            <Text style={styles.value}>{userData.collage || 'N/A'}</Text>
                            {userData.collageId && <Text style={styles.valueSmall}>ID: {userData.collageId}</Text>}
                        </View>
                    )}

                    <View style={styles.row}>
                        <Text style={styles.label}>STATUS</Text>
                        <Text style={{ ...styles.value, color: userData.isApproved ? '#10b981' : '#f59e0b' }}>
                            {userData.isApproved ? '● CONFIRMED' : '● PENDING APPROVAL'}
                        </Text>
                    </View>
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    <Image src={qrCodeDataURL} style={styles.qrImage} />
                </View>
                <Text style={styles.scanText}>SCAN AT ENTRY GATE</Text>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>KL University • Vijayawada</Text>
                    <Text style={styles.footerText}>Feb 2026</Text>
                    <Text style={styles.ticketId}>TXN: {userData.transactionId || 'N/A'}</Text>
                </View>

            </Page>

            {/* Page 2: Rules (A4) */}
            <Page size="A4" style={[styles.page, styles.rulesPage]}>
                <Text style={styles.rulesTitle}>EVENT GUIDELINES</Text>

                <Text style={styles.sectionHeader}>⚠️ Mandatory Requirements</Text>
                <Text style={styles.rulesText}>1. This Entry Pass (Digital or Printed) is mandatory.</Text>
                <Text style={styles.rulesText}>2. You must carry your Student ID Card physically or Aadhar Card.</Text>
                <Text style={styles.rulesText}>3. Entry will be denied without these documents.</Text>

                <Text style={styles.sectionHeader}>🛑 Security & Regulations</Text>
                <Text style={styles.rulesText}>• Alcohol, drugs, and illegal substances are strictly prohibited.</Text>
                <Text style={styles.rulesText}>• Any misconduct will result in immediate disqualification and removal.</Text>
                <Text style={styles.rulesText}>• Checking will be conducted at the entry.</Text>

                <Text style={styles.sectionHeader}>ℹ️ General Info</Text>
                <Text style={styles.rulesText}>• Gates open 1 hour before the event.</Text>
                <Text style={styles.rulesText}>• The organizers reserve the right to admission.</Text>
                <Text style={styles.rulesText}>• For support, contact: surabhi@kluniversity.in</Text>

                <View style={{ marginTop: 50, alignItems: 'center' }}>
                    <Image src={logoBase64} style={{ width: 60, height: 60, opacity: 0.5 }} />
                    <Text style={{ ...styles.footerText, marginTop: 10 }}>Surabhi 2026 • Official Document</Text>
                </View>
            </Page>
        </Document>
    );

    const pdfBuffer = await renderToBuffer(TicketDocument);
    return pdfBuffer;
}
