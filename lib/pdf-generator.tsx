import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
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

// Register fonts if needed, for now standard Helvetica is fine for speed/compatibility
// If custom fonts are needed, they can be registered here.

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        padding: 0,
    },
    // PAGE 1: COVER
    coverContainer: {
        height: '100%',
        backgroundColor: '#0a0a0a', // Dark background
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        position: 'relative',
    },
    // Decorative lines
    topLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 10,
        backgroundColor: '#dc2626', // Red-600
    },
    bottomLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 10,
        backgroundColor: '#dc2626',
    },

    // Logo Section
    logo: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },
    title: {
        color: '#dc2626', // Red-600
        fontSize: 48,
        fontWeight: 'heavy',
        letterSpacing: 4,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        color: '#d4d4d8', // Zinc-300
        fontSize: 18,
        letterSpacing: 6,
        marginBottom: 50,
        textTransform: 'uppercase',
    },

    // Ticket Box
    ticketCard: {
        width: '100%',
        backgroundColor: '#18181b', // Zinc-900
        borderRadius: 20,
        border: '1px solid #3f3f46', // Zinc-700
        padding: 30,
        flexDirection: 'column',
    },

    // User Info Row
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
        borderBottom: '1px solid #27272a', // Zinc-800
        paddingBottom: 25,
    },
    infoCol: {
        flexDirection: 'column',
        width: '48%',
    },
    label: {
        color: '#71717a', // Zinc-500
        fontSize: 12,
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    value: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    valueSmall: {
        color: '#e4e4e7', // Zinc-200
        fontSize: 14,
    },
    statusBadge: {
        color: '#22c55e', // Green-500
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
        textTransform: 'uppercase',
    },

    // QR Section
    qrSection: {
        alignItems: 'flex-start',
        marginTop: 10,
        paddingLeft: 0,
    },
    qrCode: {
        width: 140,
        height: 140,
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 10,
    },
    qrText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 10,
        letterSpacing: 1,
    },

    // Footer on Page 1
    footer: {
        position: 'absolute',
        bottom: 30,
        width: '100%',
        textAlign: 'center',
    },
    footerText: {
        color: '#52525b', // Zinc-600
        fontSize: 10,
    },

    // PAGE 2: RULES
    rulesContainer: {
        height: '100%',
        backgroundColor: '#18181b', // Zinc-900
        padding: 50,
    },
    pageTitle: {
        color: '#dc2626',
        fontSize: 28,
        fontWeight: 'bold',
        borderBottom: '2px solid #dc2626',
        paddingBottom: 10,
        marginBottom: 30,
    },
    sectionTitle: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    ruleText: {
        color: '#d4d4d8', // Zinc-300
        fontSize: 11,
        marginBottom: 8,
        lineHeight: 1.6,
    },
    bullet: {
        width: 3,
        height: 3,
        backgroundColor: '#dc2626',
        borderRadius: 1.5,
        marginRight: 8,
        marginTop: 5,
    },
    bulletRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
});

export async function generateTicketPDF(userData: UserTicketData): Promise<Buffer> {
    const qrCodeDataURL = await generateTicketQR({
        userId: userData.userId,
        transactionId: userData.transactionId || '',
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        collage: userData.collage,
        paymentStatus: userData.paymentStatus,
        isApproved: userData.isApproved,
    });

    // Read logo
    const logoPath = path.join(process.cwd(), 'public', 'images', 'surabhi_white_logo.png');
    // Fallback if logo doesn't exist to prevent crash
    let logoBase64 = '';
    try {
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
    } catch (e) {
        console.error("Logo not found or readable", e);
    }

    const TicketDocument = (
        <Document>
            {/* Page 1: Main Ticket */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverContainer}>
                    <View style={styles.topLine} />

                    {/* Logo & Header */}
                    {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : null}
                    <Text style={styles.title}>SURABHI-2026</Text>
                    <Text style={styles.subtitle}>OFFICIAL ENTRY PASS</Text>

                    {/* Ticket Card */}
                    <View style={styles.ticketCard}>
                        {/* Row 1: Name & ID */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoCol}>
                                <Text style={styles.label}>ATTENDEE NAME</Text>
                                <Text style={styles.value}>{userData.name}</Text>
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={styles.label}>CONTACT</Text>
                                <Text style={styles.valueSmall}>{userData.email}</Text>
                                {userData.phone && <Text style={styles.valueSmall}>{userData.phone}</Text>}
                            </View>
                        </View>

                        {/* Row 2: College & Status */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoCol}>
                                <Text style={styles.label}>INSTITUTION</Text>
                                <Text style={styles.valueSmall}>{userData.collage || 'N/A'}</Text>
                                <Text style={styles.valueSmall}>{userData.collageId ? `ID: ${userData.collageId}` : ''}</Text>
                            </View>
                            <View style={styles.infoCol}>
                                <Text style={styles.label}>STATUS</Text>
                                <Text style={{ ...styles.value, color: userData.isApproved ? '#22c55e' : '#f59e0b' }}>
                                    {userData.isApproved ? 'CONFIRMED' : 'PENDING'}
                                </Text>
                            </View>
                        </View>

                        {/* Row 3: Event Details & QR Code */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ width: '55%' }}>
                                <Text style={styles.label}>DATE & VENUE</Text>
                                <Text style={styles.value}>FEB 2026</Text>
                                <Text style={styles.valueSmall}>KL UNIVERSITY, VIJAYAWADA</Text>
                            </View>

                            {/* QR Code aligned to the left of its section */}
                            <View style={styles.qrSection}>
                                <Image src={qrCodeDataURL} style={styles.qrCode} />
                                <Text style={styles.qrText}>SCAN AT ENTRY</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Transaction ID: {userData.transactionId || 'N/A'} • Generated on {new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.bottomLine} />
                </View>
            </Page>

            {/* Page 2: Rules */}
            <Page size="A4" style={styles.page}>
                <View style={styles.rulesContainer}>
                    <Text style={styles.pageTitle}>RULES & REGULATIONS</Text>

                    <Text style={styles.sectionTitle}>MANDATORY REQUIREMENTS</Text>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>This Entry Pass (Digital or Printed) is mandatory for admission into the event premises.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Attendees must carry a valid Government ID (Aadhar/Driving License) or Student ID Card.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Entry will be strictly denied without valid identification.</Text>
                    </View>

                    <Text style={styles.sectionTitle}>SECURITY & CONDUCT</Text>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Alcohol, drugs, flammable items, and weapons are strictly prohibited inside the campus.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Any form of misconduct, harassment, or violence will result in immediate disqualification and removal from the venue.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Security checks will be conducted at all entry points. Please cooperate with the security personnel.</Text>
                    </View>

                    <Text style={styles.sectionTitle}>GENERAL GUIDELINES</Text>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Gates will open 1 hour prior to the scheduled event time.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>The organizers reserve the right of admission and may engage security to remove anyone violating the rules.</Text>
                    </View>
                    <View style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.ruleText}>Surabhi 2026 is not responsible for any lost or stolen belongings. Please keep your valuables safe.</Text>
                    </View>

                    <View style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: 20, alignItems: 'center' }}>
                        {logoBase64 ? <Image src={logoBase64} style={{ width: 80, height: 80, opacity: 0.8, marginBottom: 10 }} /> : null}
                        <Text style={{ color: '#71717a', fontSize: 12, fontWeight: 'bold' }}>Surabhi 2026 • National Level Techno-Management Fest</Text>
                        <Text style={{ color: '#71717a', fontSize: 12 }}>KL University, Green Fields, Vaddeswaram, Andhra Pradesh 522502</Text>
                    </View>
                </View>
                <View style={styles.bottomLine} />
            </Page>
        </Document>
    );

    const pdfBuffer = await renderToBuffer(TicketDocument);
    return pdfBuffer;
}
