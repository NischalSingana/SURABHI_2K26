import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { generateTicketQR, generateAccommodationQR } from './qr-generator';
import fs from 'fs';
import path from 'path';

interface MemberData {
    name: string;
    phone: string;
    gender: string;
}

export interface EventTicketData {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    collage: string | null;
    collageId: string | null;
    paymentStatus: string;
    isApproved: boolean;
    eventName: string;
    isGroupEvent: boolean;
    eventId?: string;
    groupName?: string | null;
    gender?: string | null;
    state?: string | null;
    city?: string | null;
    teamMembers?: MemberData[];
    /** When true, venue shows Virtual, no time, and Virtual Participation Guidelines on page 2 */
    isInternational?: boolean;
    /** Venue from event (DB) - when provided, used instead of default */
    venue?: string | null;
    /** Event start/end time from DB */
    startTime?: string | null;
    endTime?: string | null;
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
        padding: 30, // Reduced padding (was 40)
        paddingTop: 0, // Reduced top padding (was 10)
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
        width: 180, // Increased size
        height: 180, // Increased size
        marginBottom: 10,
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10, // Reduced margin (was 20)
        paddingHorizontal: 20,
    },
    klLogo: {
        width: 130, // Fixed width
        height: 60, // Fixed height to maintain layout
        // objectFit removed to prevent complex scaling artifacts with some PNGs
        marginLeft: -25,
        marginTop: 10,
    },
    surabhiTextLogo: {
        width: 120,
        height: 120,
        marginTop: 5,
    },
    title: {
        color: '#dc2626', // Red-600
        fontSize: 36,
        fontWeight: 'heavy',
        letterSpacing: 4,
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        color: '#d4d4d8', // Zinc-300
        fontSize: 14,
        letterSpacing: 4,
        marginBottom: 20,
        textTransform: 'uppercase',
    },

    // Event Title
    eventTitleBox: {
        backgroundColor: '#dc2626',
        paddingHorizontal: 20,
        paddingVertical: 5, // Reduced vertical padding
        borderRadius: 4,
        marginBottom: 10, // Reduced margin (was 20)
    },
    eventTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },

    // Ticket Box
    ticketCard: {
        width: '100%',
        backgroundColor: '#18181b', // Zinc-900
        borderRadius: 20,
        border: '1px solid #3f3f46', // Zinc-700
        padding: 20, // Reduced padding (was 25)
        flexDirection: 'column',
    },

    // User Info Row
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15, // Reduced margin (was 20)
        borderBottom: '1px solid #27272a', // Zinc-800
        paddingBottom: 15, // Reduced padding (was 20)
    },
    infoCol: {
        flexDirection: 'column',
    },
    label: {
        color: '#71717a', // Zinc-500
        fontSize: 9, // Reduced font size (was 10)
        marginBottom: 4, // Reduced spacing
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: 'bold',
    },
    value: {
        color: '#ffffff',
        fontSize: 18, // Increased size
        fontWeight: 'bold',
        marginBottom: 4, // Added spacing
    },
    valueSmall: {
        color: '#e4e4e7', // Zinc-200
        fontSize: 14, // Increased size
        marginBottom: 3, // Added spacing
    },

    // Group Table
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1px solid #3f3f46',
        paddingBottom: 5,
        marginBottom: 5,
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    col1: { width: '40%' },
    col2: { width: '40%' },
    col3: { width: '20%' },
    tableText: { color: '#d4d4d8', fontSize: 12 }, // Increased size
    tableHeadText: { color: '#71717a', fontSize: 10, fontWeight: 'bold', paddingBottom: 5 },


    // QR Section
    qrSection: {
        marginLeft: 20,
        alignItems: 'center',
    },
    qrCode: {
        width: 140,
        height: 140,
        backgroundColor: '#ffffff',
        padding: 6,
        borderRadius: 10,
    },
    qrText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 6,
        letterSpacing: 1.2,
        textAlign: 'center',
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

// Cache for static assets to avoid repeated disk I/O and base64 conversion
const logoCache = {
    surabhiWhite: '',
    klWhite: '',
    surabhiText: ''
};

function getBase64FromPath(p: string) {
    try {
        if (fs.existsSync(p)) {
            return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
        }
    } catch (e) {
        console.error('Error loading asset:', p, e);
    }
    return '';
}

function loadAssets() {
    if (!logoCache.surabhiWhite) {
        logoCache.surabhiWhite = getBase64FromPath(path.join(process.cwd(), 'public', 'images', 'surabhi_white_logo.png'));
    }
    if (!logoCache.klWhite) {
        logoCache.klWhite = getBase64FromPath(path.join(process.cwd(), 'public', 'images', 'kl_logo_white_text.png'));
    }
    if (!logoCache.surabhiText) {
        logoCache.surabhiText = getBase64FromPath(path.join(process.cwd(), 'public', 'images', 'surabhi1.png'));
    }
}

export async function generateTicketPDF(ticketData: EventTicketData): Promise<Buffer> {
    // Load assets into cache if not already loaded (first request only)
    loadAssets();

    const qrCodeDataURL = await generateTicketQR({
        userId: ticketData.userId,
        name: ticketData.name,
        email: ticketData.email,
        phone: ticketData.phone,
        collage: ticketData.collage,
        paymentStatus: ticketData.paymentStatus,
        isApproved: ticketData.isApproved,
        eventId: ticketData.eventId,
        gender: ticketData.gender,
    });

    // Use cached assets
    const logoBase64 = logoCache.surabhiWhite;
    const klLogoBase64 = logoCache.klWhite;
    const surabhiTextLogoBase64 = logoCache.surabhiText;
    const sacLogoBase64 = ''; // Logo file missing, skipped to avoid errors

    const TicketDocument = (
        <Document>
            {/* Page 1: Main Ticket */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverContainer}>
                    <View style={styles.topLine} />

                    {/* Header Row for Logos */}
                    <View style={styles.headerRow}>
                        {klLogoBase64 && <Image src={klLogoBase64} style={styles.klLogo} />}
                        {surabhiTextLogoBase64 && <Image src={surabhiTextLogoBase64} style={styles.surabhiTextLogo} />}
                    </View>

                    {/* SAC Logo (Optional - keeping if needed, but absolute might conflict if not careful. 
                        User asked for KL Top Left, so maybe SAC logo should be removed or moved?
                        The prompt said 'move KL logo to top left', implying it takes precedence. 
                        I'll comment out SAC centered/absolute logic if it interferes.
                        Actually, previous code had SAC absolute at 30,30. KL is now aiming for that spot.
                        I will remove the specific SAC render block to avoid clutter as KL takes priority.
                    */}

                    <Text style={styles.title}>SURABHI-2026</Text>
                    <Text style={styles.subtitle}>OFFICIAL ENTRY PASS</Text>

                    <View style={styles.eventTitleBox}>
                        <Text style={styles.eventTitle}>{ticketData.eventName}</Text>
                    </View>

                    <View style={styles.ticketCard}>
                        {/* Top Section with QR on Right */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <View style={{ flex: 1, paddingRight: 20 }}>
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={styles.label}>{ticketData.isGroupEvent ? "TEAM LEAD" : "ATTENDEE NAME"}</Text>
                                    <Text style={styles.value}>{ticketData.name}</Text>
                                    <Text style={styles.valueSmall}>{ticketData.email}</Text>
                                    {ticketData.phone && <Text style={styles.valueSmall}>{ticketData.phone}</Text>}
                                </View>

                                {ticketData.isGroupEvent && (
                                    <View style={{ marginBottom: 15 }}>
                                        <Text style={styles.label}>TEAM NAME</Text>
                                        <Text style={{ ...styles.value, color: '#dc2626', fontSize: 18 }}>
                                            {ticketData.groupName || "N/A"}
                                        </Text>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={styles.label}>INSTITUTION</Text>
                                        <Text style={styles.valueSmall}>{ticketData.collage || 'N/A'}</Text>
                                        {ticketData.collageId && <Text style={styles.valueSmall}>ID: {ticketData.collageId}</Text>}
                                        {(ticketData.state || ticketData.city) && (
                                            <Text style={styles.valueSmall}>
                                                {[ticketData.city, ticketData.state].filter(Boolean).join(", ")}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.qrSection}>
                                <Image src={qrCodeDataURL} style={styles.qrCode} />
                                <Text style={styles.qrText}>SCAN ENTRY</Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 20, borderTop: '1px solid #27272a', paddingTop: 15 }}>
                            <Text style={styles.label}>STATUS</Text>
                            <Text style={{ ...styles.value, color: ticketData.isApproved ? '#22c55e' : '#f59e0b' }}>
                                {ticketData.isApproved ? 'CONFIRMED' : 'PENDING APPROVAL'}
                            </Text>
                        </View>

                        {/* Team Members for Group Events */}
                        {ticketData.isGroupEvent && ticketData.teamMembers && ticketData.teamMembers.length > 0 && (
                            <View style={{ borderTop: '1px solid #27272a', paddingTop: 15 }}>
                                <Text style={{ ...styles.label, marginBottom: 10 }}>TEAM MEMBERS</Text>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeadText, styles.col1]}>NAME</Text>
                                    <Text style={[styles.tableHeadText, styles.col2]}>PHONE</Text>
                                    <Text style={[styles.tableHeadText, styles.col3]}>GENDER</Text>
                                </View>
                                {/* Lead row first */}
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableText, styles.col1]}>{ticketData.name} (Lead)</Text>
                                    <Text style={[styles.tableText, styles.col2]}>{ticketData.phone || '-'}</Text>
                                    <Text style={[styles.tableText, styles.col3]}>{ticketData.gender || '-'}</Text>
                                </View>
                                {ticketData.teamMembers.map((member, idx) => (
                                    <View key={idx} style={styles.tableRow}>
                                        <Text style={[styles.tableText, styles.col1]}>{member.name}</Text>
                                        <Text style={[styles.tableText, styles.col2]}>{member.phone || ticketData.phone || '-'}</Text>
                                        <Text style={[styles.tableText, styles.col3]}>{member.gender}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Event Details Footer */}
                        <View style={{ borderTop: '1px solid #27272a', paddingTop: 15, marginTop: 'auto' }}>
                            <Text style={styles.label}>VENUE</Text>
                            <Text style={styles.valueSmall}>{ticketData.isInternational ? 'VIRTUAL' : (ticketData.venue?.trim() || 'KL UNIVERSITY, VIJAYAWADA')}</Text>
                            {ticketData.isInternational ? (
                                <>
                                    <Text style={[styles.label, { marginTop: 10 }]}>TIME</Text>
                                    <Text style={styles.valueSmall}>Will be announced later to your convenient timezone.</Text>
                                </>
                            ) : (ticketData.startTime || ticketData.endTime) ? (
                                <>
                                    <Text style={[styles.label, { marginTop: 10 }]}>TIME</Text>
                                    <Text style={styles.valueSmall}>{[ticketData.startTime, ticketData.endTime].filter(Boolean).join(' – ')}</Text>
                                </>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Generated on {new Date().toLocaleDateString()} • Surabhi 2026</Text>
                    </View>

                    <View style={styles.bottomLine} />
                </View>
            </Page>

            {/* Page 2: Rules – Virtual Participation Guidelines for international, else standard */}
            <Page size="A4" style={styles.page}>
                <View style={styles.rulesContainer}>
                    <Text style={styles.pageTitle}>{ticketData.isInternational ? 'VIRTUAL PARTICIPATION GUIDELINES, RULES AND REGULATIONS' : 'RULES & REGULATIONS'}</Text>

                    {ticketData.isInternational ? (
                        <>
                            <Text style={styles.sectionTitle}>VIRTUAL PARTICIPATION</Text>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>This is your official virtual participation pass. Time slots will be announced later to your convenient timezone.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>All sessions and evaluations will be conducted virtually. You will receive meeting links and instructions before the event.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Ensure a stable internet connection and a quiet environment for your participation.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>The organizers reserve the right to admission and to modify the schedule as per convenience.</Text>
                            </View>

                            <Text style={styles.sectionTitle}>CODE OF CONDUCT</Text>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Maintain decorum during virtual sessions. Any form of misbehavior or harassment will lead to immediate disqualification.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Recording or sharing of session links without permission is prohibited.</Text>
                            </View>

                            <Text style={styles.sectionTitle}>EVENT SPECIFIC</Text>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>For group events, all team members must join the virtual call for verification.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Judges' decisions are final and binding.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>For queries, contact: surabhi@kluniversity.in</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.sectionTitle}>GENERAL GUIDELINES</Text>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>This Entry Pass is mandatory for admission. Digital or printed copies are accepted.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Attendees must carry their Physical College ID Card. It is mandatory for identity verification.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Participants should report to the venue at least 30 minutes before the event starts.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>The organizers reserve the right to admission.</Text>
                            </View>

                            <Text style={styles.sectionTitle}>CODE OF CONDUCT</Text>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Strict discipline must be maintained within the campus premises.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Possession or consumption of alcohol, drugs, or smoking is strictly prohibited.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Any form of misbehavior or harassment will lead to immediate disqualification and removal.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Damage to university property will result in penalties.</Text>
                            </View>

                            <Text style={styles.sectionTitle}>EVENT SPECIFIC</Text>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>All team members must be present for group event verification.</Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={styles.ruleText}>Judges' decisions are final and binding.</Text>
                            </View>
                        </>
                    )}

                    <View style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: 5, alignItems: 'center' }}>
                        {/* Footer Logo Section */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 1, gap: 5 }}>
                            {sacLogoBase64 && <Image src={sacLogoBase64} style={{ width: 100, height: 35 }} />}
                            {/* Add Surabhi Logo to Footer */}
                            {surabhiTextLogoBase64 && <Image src={surabhiTextLogoBase64} style={{ width: 80, height: 80 }} />}
                        </View>
                        <Text style={{ color: '#71717a', fontSize: 14, fontWeight: 'bold', marginTop: 5 }}>Surabhi 2026 • KL University</Text>
                    </View>
                </View>
                <View style={styles.bottomLine} />
            </Page>
        </Document>
    );

    return await renderToBuffer(TicketDocument);
}

// Accommodation pass data
export interface AccommodationPassData {
    passToken: string;
    primaryName: string;
    primaryEmail: string;
    primaryPhone: string;
    collage?: string | null;
    collageId?: string | null;
    gender: string;
    bookingType: string;
    members: { name: string; email: string; phone: string }[];
    competitions: { name: string; category?: string; date?: Date; venue?: string }[];
}

const ACCOMMODATION_RULES = [
    "This accommodation pass is mandatory for entry to the accommodation facility during Surabhi 2026.",
    "All guests must carry their Physical College ID Card. It is mandatory for identity verification.",
    "Strict discipline must be maintained within the accommodation premises at all times.",
    "Possession or consumption of alcohol, drugs, or smoking is strictly prohibited.",
    "Any form of misbehavior or damage to property will result in immediate eviction and penalties.",
    "The organizers reserve the right to admission and to modify accommodation arrangements as needed.",
    "Guests must report to the accommodation desk at the designated check-in time.",
    "For queries, contact: surabhi@kluniversity.in",
];

export async function generateAccommodationPassPDF(data: AccommodationPassData): Promise<Buffer> {
    loadAssets();
    const qrCodeDataURL = await generateAccommodationQR(data.passToken);
    const logoBase64 = logoCache.surabhiWhite;
    const klLogoBase64 = logoCache.klWhite;
    const surabhiTextLogoBase64 = logoCache.surabhiText;

    const Doc = (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.coverContainer}>
                    <View style={styles.topLine} />
                    <View style={styles.headerRow}>
                        {klLogoBase64 && <Image src={klLogoBase64} style={styles.klLogo} />}
                        {surabhiTextLogoBase64 && <Image src={surabhiTextLogoBase64} style={styles.surabhiTextLogo} />}
                    </View>
                    <Text style={styles.title}>SURABHI-2026</Text>
                    <Text style={styles.subtitle}>ACCOMMODATION PASS</Text>
                    <View style={styles.eventTitleBox}>
                        <Text style={styles.eventTitle}>ACCOMMODATION</Text>
                    </View>

                    <View style={styles.ticketCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                            <View style={{ flex: 1, paddingRight: 20 }}>
                                <View style={{ marginBottom: 15 }}>
                                    <Text style={styles.label}>PRIMARY GUEST</Text>
                                    <Text style={styles.value}>{data.primaryName}</Text>
                                    <Text style={styles.valueSmall}>{data.primaryEmail}</Text>
                                    {data.primaryPhone && <Text style={styles.valueSmall}>{data.primaryPhone}</Text>}
                                </View>
                                <View style={{ marginBottom: 10 }}>
                                    <Text style={styles.label}>INSTITUTION</Text>
                                    <Text style={styles.valueSmall}>{data.collage || 'N/A'}</Text>
                                    {data.collageId && <Text style={styles.valueSmall}>ID: {data.collageId}</Text>}
                                </View>
                                <View>
                                    <Text style={styles.label}>BOOKING TYPE</Text>
                                    <Text style={styles.valueSmall}>{data.bookingType} • {data.gender}</Text>
                                </View>
                            </View>
                            <View style={styles.qrSection}>
                                <Image src={qrCodeDataURL} style={styles.qrCode} />
                                <Text style={styles.qrText}>SCAN TO VERIFY</Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 20, borderTop: '1px solid #27272a', paddingTop: 15 }}>
                            <Text style={styles.label}>STATUS</Text>
                            <Text style={{ ...styles.value, color: '#22c55e' }}>CONFIRMED</Text>
                        </View>

                        {data.members && data.members.length > 0 && (
                            <View style={{ borderTop: '1px solid #27272a', paddingTop: 15 }}>
                                <Text style={{ ...styles.label, marginBottom: 10 }}>ACCOMMODATION MEMBERS</Text>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeadText, styles.col1]}>NAME</Text>
                                    <Text style={[styles.tableHeadText, styles.col2]}>EMAIL</Text>
                                    <Text style={[styles.tableHeadText, styles.col3]}>PHONE</Text>
                                </View>
                                {data.members.map((m, i) => (
                                    <View key={i} style={styles.tableRow}>
                                        <Text style={[styles.tableText, styles.col1]}>{m.name}</Text>
                                        <Text style={[styles.tableText, styles.col2]}>{m.email}</Text>
                                        <Text style={[styles.tableText, styles.col3]}>{m.phone || '-'}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {data.competitions && data.competitions.length > 0 && (
                            <View style={{ borderTop: '1px solid #27272a', paddingTop: 15, marginTop: 15 }}>
                                <Text style={{ ...styles.label, marginBottom: 10 }}>REGISTERED COMPETITIONS</Text>
                                {data.competitions.map((c, i) => (
                                    <View key={i} style={{ marginBottom: 6 }}>
                                        <Text style={styles.valueSmall}>• {c.name}{c.category ? ` (${c.category})` : ''}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={{ borderTop: '1px solid #27272a', paddingTop: 15, marginTop: 'auto' }}>
                            <Text style={styles.label}>VENUE</Text>
                            <Text style={styles.valueSmall}>KL University, Vijayawada</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Generated on {new Date().toLocaleDateString()} • Surabhi 2026</Text>
                    </View>
                    <View style={styles.bottomLine} />
                </View>
            </Page>

            <Page size="A4" style={styles.page}>
                <View style={styles.rulesContainer}>
                    <Text style={styles.pageTitle}>ACCOMMODATION RULES & REGULATIONS</Text>
                    {ACCOMMODATION_RULES.map((rule, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.ruleText}>{rule}</Text>
                        </View>
                    ))}
                    <View style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: 5, alignItems: 'center' }}>
                        {surabhiTextLogoBase64 && <Image src={surabhiTextLogoBase64} style={{ width: 150, height: 50, objectFit: 'contain', marginBottom: 5 }} />}
                        <Text style={{ color: '#71717a', fontSize: 14, fontWeight: 'bold' }}>Surabhi 2026 • KL University</Text>
                    </View>
                </View>
                <View style={styles.bottomLine} />
            </Page>
        </Document>
    );

    return await renderToBuffer(Doc);
}
