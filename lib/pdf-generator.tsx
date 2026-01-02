import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
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

// Define styles - Movie Pass Design
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#0a0000',
        padding: 0,
    },
    // Page 1 - Ticket (Landscape)
    ticketPage: {
        flexDirection: 'row',
        height: '100%',
        position: 'relative',
    },
    leftPanel: {
        width: '30%',
        backgroundColor: '#1a0000',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRight: '2px dashed #dc2626',
    },
    rightPanel: {
        width: '70%',
        padding: 30,
        position: 'relative',
    },
    // Branding
    brandLogo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    brandText: {
        fontSize: 36,
        color: '#dc2626',
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    brandYear: {
        fontSize: 16,
        color: '#ef4444',
        marginTop: 5,
    },
    brandTagline: {
        fontSize: 8,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 5,
        letterSpacing: 1,
    },
    // QR Code
    qrContainer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    qrCode: {
        width: 120,
        height: 120,
        marginBottom: 10,
    },
    qrLabel: {
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
    },
    // Entry Pass Header
    passHeader: {
        marginBottom: 25,
    },
    passTitle: {
        fontSize: 28,
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: 3,
        marginBottom: 5,
    },
    passSubtitle: {
        fontSize: 10,
        color: '#9ca3af',
        letterSpacing: 1,
    },
    // User Info Grid
    infoGrid: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 9,
        color: '#6b7280',
        width: '30%',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
        width: '70%',
    },
    // Status Badge
    statusContainer: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#10b98130',
        borderWidth: 2,
        borderColor: '#10b981',
    },
    statusText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 10,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#dc2626',
        paddingTop: 8,
    },
    footerText: {
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
        letterSpacing: 1,
    },
    // Page 2 - Rules (Compact)
    rulesPage: {
        padding: 30,
    },
    rulesTitle: {
        fontSize: 22,
        color: '#dc2626',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 2,
    },
    rulesSubtitle: {
        fontSize: 9,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 20,
    },
    warningBox: {
        backgroundColor: '#dc262620',
        borderWidth: 2,
        borderColor: '#dc2626',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    warningTitle: {
        fontSize: 11,
        color: '#dc2626',
        fontWeight: 'bold',
        marginBottom: 6,
    },
    warningText: {
        fontSize: 9,
        color: '#ffffff',
        marginBottom: 3,
        lineHeight: 1.4,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 6,
    },
    bulletPoint: {
        fontSize: 9,
        color: '#ffffff',
        marginBottom: 4,
        paddingLeft: 10,
        lineHeight: 1.3,
    },
    contactSection: {
        marginTop: 15,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#dc2626',
    },
    contactText: {
        fontSize: 9,
        color: '#ffffff',
        marginBottom: 3,
        textAlign: 'center',
    },
    finalNote: {
        marginTop: 12,
        padding: 10,
        backgroundColor: '#1a0000',
        borderRadius: 5,
    },
    finalNoteText: {
        fontSize: 9,
        color: '#9ca3af',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

/**
 * Generate a cinematic movie pass-style PDF with QR code
 * Professional design with dark theme and fiery red accents
 */
export async function generateTicketPDF(userData: UserTicketData): Promise<Buffer> {
    // Generate QR code
    const qrCodeDataURL = await generateTicketQR({
        userId: userData.userId,
        transactionId: userData.transactionId || '',
        name: userData.name,
        email: userData.email,
        paymentStatus: userData.paymentStatus,
        isApproved: userData.isApproved,
    });

    const TicketDocument = (
        <Document>
            {/* Page 1: Movie Pass Ticket */}
            <Page size={[612, 252]} style={[styles.page, styles.ticketPage]}>
                {/* Left Panel - Branding & QR */}
                <View style={styles.leftPanel}>
                    <View style={styles.brandLogo}>
                        <Text style={styles.brandText}>SURABHI</Text>
                        <Text style={styles.brandYear}>2026</Text>
                        <Text style={styles.brandTagline}>INTERNATIONAL{'\n'}CULTURAL FEST</Text>
                    </View>

                    <View style={styles.qrContainer}>
                        <Image src={qrCodeDataURL} style={styles.qrCode} />
                        <Text style={styles.qrLabel}>SCAN TO VERIFY</Text>
                    </View>
                </View>

                {/* Right Panel - Entry Pass Details */}
                <View style={styles.rightPanel}>
                    <View style={styles.passHeader}>
                        <Text style={styles.passTitle}>ENTRY PASS</Text>
                        <Text style={styles.passSubtitle}>OFFICIAL PARTICIPANT CREDENTIAL</Text>
                    </View>

                    <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>NAME</Text>
                            <Text style={styles.infoValue}>{userData.name.toUpperCase()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>EMAIL</Text>
                            <Text style={styles.infoValue}>{userData.email}</Text>
                        </View>

                        {userData.collage && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>COLLEGE</Text>
                                <Text style={styles.infoValue}>{userData.collage}</Text>
                            </View>
                        )}

                        {userData.collageId && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>COLLEGE ID</Text>
                                <Text style={styles.infoValue}>{userData.collageId}</Text>
                            </View>
                        )}

                        {userData.transactionId && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>TXN ID</Text>
                                <Text style={styles.infoValue}>{userData.transactionId}</Text>
                            </View>
                        )}
                    </View>

                    {/* Status Badge */}
                    <View style={styles.statusContainer}>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {userData.isApproved ? '✓ APPROVED' : 'PENDING'}
                            </Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>KL UNIVERSITY • VIJAYAWADA</Text>
                    </View>
                </View>
            </Page>

            {/* Page 2: Essential Rules (Compact) */}
            <Page size="A4" style={[styles.page, styles.rulesPage]}>
                <Text style={styles.rulesTitle}>ENTRY REQUIREMENTS</Text>
                <Text style={styles.rulesSubtitle}>Please read before attending</Text>

                <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ MANDATORY</Text>
                    <Text style={styles.warningText}>
                        • Bring COLLEGE ID CARD + This PDF (soft/printed copy)
                    </Text>
                    <Text style={styles.warningText}>
                        • Both documents required at entry gate
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Entry Guidelines</Text>
                <Text style={styles.bulletPoint}>• Valid ticket and college ID mandatory</Text>
                <Text style={styles.bulletPoint}>• Arrive 30 minutes before event time</Text>
                <Text style={styles.bulletPoint}>• Follow designated entry/exit points</Text>
                <Text style={styles.bulletPoint}>• Keep documents accessible</Text>

                <Text style={styles.sectionTitle}>Prohibited Items</Text>
                <Text style={styles.bulletPoint}>• Weapons or dangerous objects</Text>
                <Text style={styles.bulletPoint}>• Alcohol, drugs, illegal substances</Text>
                <Text style={styles.bulletPoint}>• Outside food (water allowed)</Text>
                <Text style={styles.bulletPoint}>• Professional cameras without permission</Text>

                <Text style={styles.sectionTitle}>General Rules</Text>
                <Text style={styles.bulletPoint}>• Maintain decorum and respect others</Text>
                <Text style={styles.bulletPoint}>• Follow event timings strictly</Text>
                <Text style={styles.bulletPoint}>• No smoking inside campus</Text>
                <Text style={styles.bulletPoint}>• Photography for personal use only</Text>
                <Text style={styles.bulletPoint}>• Management reserves entry rights</Text>

                <View style={styles.contactSection}>
                    <Text style={styles.contactText}>📧 surabhi@kluniversity.in</Text>
                    <Text style={styles.contactText}>🌐 klsurabhi.nischalsingana.com</Text>
                </View>

                <View style={styles.finalNote}>
                    <Text style={styles.finalNoteText}>
                        We look forward to seeing you at Surabhi 2026!
                    </Text>
                    <Text style={[styles.finalNoteText, { fontSize: 8, marginTop: 5 }]}>
                        KL University • Student Activity Center • Vijayawada
                    </Text>
                </View>
            </Page>
        </Document>
    );

    // Render to buffer
    const pdfBuffer = await renderToBuffer(TicketDocument);
    return pdfBuffer;
}
