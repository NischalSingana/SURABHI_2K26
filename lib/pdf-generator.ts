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

// Define styles
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#0a0000',
        padding: 0,
    },
    // Page 1 - Ticket
    ticketContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    leftSection: {
        width: '35%',
        backgroundColor: '#1a0000',
        padding: 20,
        alignItems: 'center',
    },
    rightSection: {
        width: '65%',
        padding: 30,
    },
    logo: {
        fontSize: 32,
        color: '#dc2626',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#ef4444',
        marginBottom: 5,
    },
    tagline: {
        fontSize: 10,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 30,
    },
    qrCode: {
        width: 100,
        height: 100,
        marginTop: 20,
    },
    title: {
        fontSize: 20,
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 30,
    },
    label: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 5,
    },
    value: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    statusBadge: {
        backgroundColor: '#10b98120',
        borderRadius: 5,
        padding: 8,
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    statusText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        borderTopWidth: 2,
        borderTopColor: '#dc2626',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#6b7280',
        textAlign: 'center',
    },
    // Page 2 - Rules
    rulesPage: {
        padding: 40,
    },
    rulesTitle: {
        fontSize: 24,
        color: '#dc2626',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    rulesSubtitle: {
        fontSize: 10,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 30,
    },
    warningBox: {
        backgroundColor: '#dc262620',
        borderWidth: 1,
        borderColor: '#dc2626',
        borderRadius: 5,
        padding: 15,
        marginBottom: 20,
    },
    warningTitle: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    warningText: {
        fontSize: 10,
        color: '#ffffff',
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    bulletPoint: {
        fontSize: 10,
        color: '#ffffff',
        marginBottom: 8,
        paddingLeft: 15,
    },
    contactInfo: {
        fontSize: 10,
        color: '#ffffff',
        marginBottom: 5,
    },
});

/**
 * Generate a cinematic movie ticket-style PDF with QR code
 * Dark theme with fiery red accents matching the website
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
        {/* Page 1: Ticket */ }
        < Page size = { [612, 252]} style = { styles.page } >
            <View style={ styles.ticketContainer }>
                {/* Left Section */ }
                < View style = { styles.leftSection } >
                    <Text style={ styles.logo }> SURABHI </Text>
                        < Text style = { styles.subtitle } > 2026 </Text>
                            < Text style = { styles.tagline } > INTERNATIONAL{ '\n' }CULTURAL FEST </Text>
                                < Image src = { qrCodeDataURL } style = { styles.qrCode } />
                                    </View>

    {/* Right Section */ }
    <View style={ styles.rightSection }>
        <Text style={ styles.title }> ENTRY PASS </Text>

            < Text style = { styles.label } > PARTICIPANT NAME </Text>
                < Text style = { styles.value } > { userData.name.toUpperCase() } </Text>

                    < Text style = { styles.label } > EMAIL </Text>
                        < Text style = { styles.value } > { userData.email } </Text>

    {
        userData.collage && (
            <>
            <Text style={ styles.label }> COLLEGE </Text>
                < Text style = { styles.value } > { userData.collage } </Text>
                    </>
                        )
    }

    <View style={ styles.statusBadge }>
        <Text style={ styles.statusText }>
            { userData.isApproved ? 'APPROVED' : 'PENDING' }
            </Text>
            </View>

            < View style = { styles.footer } >
                <Text style={ styles.footerText }> KL UNIVERSITY • VIJAYAWADA </Text>
                    </View>
                    </View>
                    </View>
                    </Page>

    {/* Page 2: Rules */ }
    <Page size="A4" style = { [styles.page, styles.rulesPage]} >
        <Text style={ styles.rulesTitle }> ENTRY REQUIREMENTS & RULES </Text>
            < Text style = { styles.rulesSubtitle } > Please read carefully before attending the event </Text>

                < View style = { styles.warningBox } >
                    <Text style={ styles.warningTitle }>⚠️ MANDATORY REQUIREMENTS </Text>
                        < Text style = { styles.warningText } >
                        • Bring your COLLEGE ID CARD along with this PDF(soft copy or printed)
        </Text>
        < Text style = { styles.warningText } >
                        • Both documents must be presented at the entry gate for verification
        </Text>
        </View>

        < Text style = { styles.sectionTitle } > Entry Guidelines </Text>
        < Text style = { styles.bulletPoint } >• Entry is strictly by valid ticket and college ID only </Text>
            < Text style = { styles.bulletPoint } >• Arrive at least 30 minutes before your event time </Text>
                < Text style = { styles.bulletPoint } >• Follow the designated entry and exit points </Text>
                    < Text style = { styles.bulletPoint } >• Cooperate with security personnel during verification </Text>
                        < Text style = { styles.bulletPoint } >• Keep your ticket and ID accessible at all times </Text>

                            < Text style = { styles.sectionTitle } > Prohibited Items </Text>
                                < Text style = { styles.bulletPoint } >• Weapons, sharp objects, or any dangerous items </Text>
                                    < Text style = { styles.bulletPoint } >• Alcohol, drugs, or illegal substances </Text>
                                        < Text style = { styles.bulletPoint } >• Outside food and beverages(except water) </Text>
                                            < Text style = { styles.bulletPoint } >• Professional cameras or recording equipment without permission </Text>
                                                < Text style = { styles.bulletPoint } >• Banners, posters, or promotional materials </Text>

                                                    < Text style = { styles.sectionTitle } > General Rules </Text>
                                                        < Text style = { styles.bulletPoint } >• Maintain decorum and respect fellow participants </Text>
                                                            < Text style = { styles.bulletPoint } >• Follow event timings strictly - late entry may not be permitted </Text>
                                                                < Text style = { styles.bulletPoint } >• Smoking is strictly prohibited inside the campus </Text>
                                                                    < Text style = { styles.bulletPoint } >• Littering is prohibited - use designated dustbins </Text>
                                                                        < Text style = { styles.bulletPoint } >• Photography is allowed for personal use only </Text>
                                                                            < Text style = { styles.bulletPoint } >• Management reserves the right to deny entry without prior notice </Text>

                                                                                < Text style = { styles.sectionTitle } > Contact Information </Text>
                                                                                    < Text style = { styles.contactInfo } >📧 Email: surabhi @kluniversity.in</Text>
                                                                                        < Text style = { styles.contactInfo } >📞 Phone: +91 XXX XXX XXXX </Text>
                                                                                            < Text style = { styles.contactInfo } >🌐 Website: klsurabhi.nischalsingana.com </Text>

                                                                                                < View style = {{ marginTop: 30, borderTopWidth: 2, borderTopColor: '#dc2626', paddingTop: 15 }
}>
    <Text style={ { fontSize: 10, color: '#9ca3af', textAlign: 'center', fontWeight: 'bold' } }>
        We look forward to seeing you at Surabhi 2026!
            </Text>
            < Text style = {{ fontSize: 8, color: '#6b7280', textAlign: 'center', marginTop: 5 }}>
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
