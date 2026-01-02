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

// Professional Movie Pass Design
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#0a0000',
    },
    // Page 1 - Ticket (Landscape 8.5" x 3.5")
    ticketContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    // Left Panel (30%)
    leftPanel: {
        width: '30%',
        backgroundColor: '#1a0000',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRight: '3px dashed #dc2626',
    },
    branding: {
        textAlign: 'center',
        marginTop: 8,
    },
    brandName: {
        fontSize: 28,
        color: '#dc2626',
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    brandYear: {
        fontSize: 13,
        color: '#ef4444',
        marginTop: 3,
    },
    brandTagline: {
        fontSize: 6.5,
        color: '#9ca3af',
        marginTop: 4,
        letterSpacing: 0.8,
        lineHeight: 1.3,
    },
    qrSection: {
        alignItems: 'center',
        marginBottom: 8,
    },
    qrCode: {
        width: 100,
        height: 100,
    },
    qrLabel: {
        fontSize: 6.5,
        color: '#6b7280',
        marginTop: 4,
    },
    // Right Panel (70%)
    rightPanel: {
        width: '70%',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    header: {
        marginBottom: 15,
    },
    passTitle: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    passSubtitle: {
        fontSize: 8,
        color: '#9ca3af',
        letterSpacing: 1,
        marginTop: 3,
    },
    infoGrid: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 8,
        color: '#6b7280',
        width: '25%',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 11,
        color: '#ffffff',
        fontWeight: 'bold',
        width: '75%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #dc2626',
        paddingTop: 8,
        marginTop: 10,
    },
    statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        backgroundColor: '#10b98130',
        borderWidth: 2,
        borderColor: '#10b981',
    },
    statusText: {
        color: '#10b981',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footerText: {
        fontSize: 7,
        color: '#6b7280',
        letterSpacing: 1,
    },
    // Page 2 - Rules (Increased font sizes)
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
        marginBottom: 18,
    },
    warningBox: {
        backgroundColor: '#dc262620',
        borderWidth: 2,
        borderColor: '#dc2626',
        borderRadius: 6,
        padding: 12,
        marginBottom: 14,
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
        marginTop: 14,
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
        borderRadius: 4,
    },
    finalNoteText: {
        fontSize: 9,
        color: '#9ca3af',
        textAlign: 'center',
        fontWeight: 'bold',
    },
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

    const TicketDocument = (
        <Document>
            {/* Page 1: Entry Pass */}
            <Page size={[612, 252]} style={styles.page}>
                <View style={styles.ticketContainer}>
                    {/* Left Panel */}
                    <View style={styles.leftPanel}>
                        <View style={styles.branding}>
                            <Text style={styles.brandName}>SURABHI</Text>
                            <Text style={styles.brandYear}>2026</Text>
                            <Text style={styles.brandTagline}>
                                INTERNATIONAL{'\n'}CULTURAL FEST
                            </Text>
                        </View>

                        <View style={styles.qrSection}>
                            <Image src={qrCodeDataURL} style={styles.qrCode} />
                            <Text style={styles.qrLabel}>SCAN TO VERIFY</Text>
                        </View>
                    </View>

                    {/* Right Panel */}
                    <View style={styles.rightPanel}>
                        <View style={styles.header}>
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

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>KL UNIVERSITY • VIJAYAWADA</Text>
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusText}>
                                    {userData.isApproved ? '✓ APPROVED' : 'PENDING'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>

            {/* Page 2: Rules (Larger fonts) */}
            <Page size="A4" style={[styles.page, styles.rulesPage]}>
                <Text style={styles.rulesTitle}>ENTRY REQUIREMENTS</Text>
                <Text style={styles.rulesSubtitle}>Please read before attending</Text>

                <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ MANDATORY</Text>
                    <Text style={styles.warningText}>
                        • Bring COLLEGE ID CARD + This PDF (soft/printed)
                    </Text>
                    <Text style={styles.warningText}>
                        • Both documents required at entry gate
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Entry Guidelines</Text>
                <Text style={styles.bulletPoint}>• Valid ticket and college ID mandatory</Text>
                <Text style={styles.bulletPoint}>• Arrive 30 minutes before event time</Text>
                <Text style={styles.bulletPoint}>• Follow designated entry/exit points</Text>
                <Text style={styles.bulletPoint}>• Keep documents accessible at all times</Text>

                <Text style={styles.sectionTitle}>Prohibited Items</Text>
                <Text style={styles.bulletPoint}>• Weapons or dangerous objects</Text>
                <Text style={styles.bulletPoint}>• Alcohol, drugs, illegal substances</Text>
                <Text style={styles.bulletPoint}>• Outside food (water bottles allowed)</Text>
                <Text style={styles.bulletPoint}>• Professional cameras without permission</Text>

                <Text style={styles.sectionTitle}>General Rules</Text>
                <Text style={styles.bulletPoint}>• Maintain decorum and respect others</Text>
                <Text style={styles.bulletPoint}>• Follow event timings strictly</Text>
                <Text style={styles.bulletPoint}>• No smoking inside campus premises</Text>
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
                    <Text style={[styles.finalNoteText, { fontSize: 8, marginTop: 4 }]}>
                        KL University • Student Activity Center • Vijayawada
                    </Text>
                </View>
            </Page>
        </Document>
    );

    const pdfBuffer = await renderToBuffer(TicketDocument);
    return pdfBuffer;
}
