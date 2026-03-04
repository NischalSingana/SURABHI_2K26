"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { generateCertificatePDF, type CertificateData } from "@/lib/certificate-generator";
import { sendCertificateEmail, sendBundledCertificateEmail } from "@/lib/zeptomail";


interface GroupMemberJson {
    name: string;
    phone?: string;
    gender?: string;
    inGameName?: string;
    inGameId?: string;
    college?: string;
    regNo?: string;
    branch?: string;
    certificateId?: string;
}

function makeCertificateId(eventSlug: string, userId: string): string {
    // e.g. CERT-NRITHYA-abc123-2026
    const slug = eventSlug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    const uid = userId.slice(-6).toUpperCase();
    return `CERT-${slug}-${uid}-2026`;
}

/**
 * Returns all events that have at least one APPROVED registration.
 * Used to populate the admin dropdown.
 */
export async function getEventsForCertificate() {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized. Admin or Master only." };
    }

    const events = await prisma.event.findMany({
        where: {
            OR: [
                { individualRegistrations: { some: { paymentStatus: "APPROVED" } } },
                { groupRegistrations: { some: { paymentStatus: "APPROVED" } } },
            ],
        },
        select: {
            id: true,
            name: true,
            slug: true,
            date: true,
            isGroupEvent: true,
            _count: {
                select: {
                    individualRegistrations: {
                        where: { paymentStatus: "APPROVED" },
                    },
                    groupRegistrations: {
                        where: { paymentStatus: "APPROVED" },
                    },
                },
            },
        },
        orderBy: { date: "asc" },
    });

    return { success: true, data: events };
}

interface SendResult {
    sent: number;
    failed: number;
    errors: string[];
    skipped: number;
}

/**
 * Generates and sends participation certificates to all APPROVED participants
 * of the given event (individual + all group members).
 */
export async function sendCertificatesForEvent(eventId: string): Promise<{ success: boolean; data?: SendResult; error?: string }> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized. Admin or Master only." };
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, slug: true, date: true },
    });

    if (!event) {
        return { success: false, error: "Event not found." };
    }

    const result: SendResult = { sent: 0, failed: 0, errors: [], skipped: 0 };
    const sentEmails = new Set<string>(); // de-dupe within one event

    // ── Individual Registrations ───────────────────────────────────────────────
    const individualRegs = await prisma.individualRegistration.findMany({
        where: { eventId, paymentStatus: "APPROVED" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    gender: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    certificateId: true,
                } as any,
            },
        },
    });

    for (const reg of (individualRegs as any[])) {
        const { user } = reg;
        if (!user.email) { result.skipped++; continue; }
        if (sentEmails.has(user.email)) { result.skipped++; continue; }

        const certData: CertificateData = {
            name: user.name || "Participant",
            college: user.collage,
            regNo: user.collageId,
            branch: user.branch,
            eventName: event.name,
            eventDate: event.date,
            certificateId: user.certificateId || makeCertificateId(event.slug, user.id),
        };

        try {
            const pdfBuffer = await generateCertificatePDF(certData);
            const emailResult = await sendCertificateEmail(
                { name: user.name || "Participant", email: user.email },
                { name: event.name, date: event.date },
                certData.certificateId,
                pdfBuffer
            );

            if (emailResult.success) {
                sentEmails.add(user.email);
                result.sent++;
            } else {
                result.failed++;
                result.errors.push(`${user.email}: ${emailResult.error || "Unknown error"}`);
            }
        } catch (err) {
            result.failed++;
            result.errors.push(`${user.email}: ${err instanceof Error ? err.message : "Generation failed"}`);
        }
    }

    // ── Group Registrations ────────────────────────────────────────────────────
    const groupRegs = await prisma.groupRegistration.findMany({
        where: { eventId, paymentStatus: "APPROVED" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    gender: true,
                    collage: true,
                    collageId: true,
                    branch: true,
                    certificateId: true,
                } as any,
            },
        },
    });

    for (const reg of (groupRegs as any[])) {
        // Team lead
        const lead = reg.user;
        if (!lead.email) continue;
        if (sentEmails.has(lead.email)) continue;

        // Collect all certificates for this team
        const teamCertificates: { name: string; pdfBuffer: Buffer; certificateId: string }[] = [];

        // 1. Generate Lead Certificate
        const leadCertData: CertificateData = {
            name: lead.name || "Participant",
            college: lead.collage,
            regNo: lead.collageId,
            branch: lead.branch,
            eventName: event.name,
            eventDate: event.date,
            certificateId: lead.certificateId || makeCertificateId(event.slug, lead.id),
        };

        try {
            const pdfBuffer = await generateCertificatePDF(leadCertData);
            teamCertificates.push({
                name: leadCertData.name,
                pdfBuffer,
                certificateId: leadCertData.certificateId,
            });
        } catch (err) {
            result.failed++;
            result.errors.push(`${lead.email} (Lead): ${err instanceof Error ? err.message : "Generation failed"}`);
        }

        // 2. Generate Member Certificates
        const members = (reg.members as unknown as GroupMemberJson[]) || [];
        for (const member of members) {
            if (!member.name) continue;
            
            const certData: CertificateData = {
                name: member.name,
                college: member.college || lead.collage,
                regNo: member.regNo || lead.collageId,
                branch: member.branch || lead.branch,
                eventName: event.name,
                eventDate: event.date,
                certificateId: member.certificateId || makeCertificateId(event.slug, `m-${reg.id}-${member.name}`),
            };

            try {
                const pdfBuffer = await generateCertificatePDF(certData);
                teamCertificates.push({
                    name: certData.name,
                    pdfBuffer,
                    certificateId: certData.certificateId,
                });
            } catch (err) {
                result.failed++;
                result.errors.push(`${lead.email} (for ${member.name}): ${err instanceof Error ? err.message : "Generation failed"}`);
            }
        }

        // 3. Send Bundled Email if any certificates generated
        if (teamCertificates.length > 0) {
            try {
                const emailResult = await sendBundledCertificateEmail(
                    { name: lead.name || "Participant", email: lead.email },
                    { name: event.name, date: event.date },
                    teamCertificates
                );
                
                if (emailResult.success) { 
                    sentEmails.add(lead.email); 
                    result.sent += teamCertificates.length; 
                } else { 
                    result.failed += teamCertificates.length; 
                    result.errors.push(`${lead.email} (Team): ${emailResult.error}`); 
                }
            } catch (err) {
                result.failed += teamCertificates.length;
                result.errors.push(`${lead.email} (Team Email): ${err instanceof Error ? err.message : "Email sending failed"}`);
            }
        }
    }

    return { success: true, data: result };
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-PARTICIPANT ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface ParticipantRecord {
    userId: string;
    registrationId: string;
    type: "INDIVIDUAL" | "GROUP" | "MEMBER";
    name: string;
    email: string;

    college: string | null;
    regNo: string | null;
    branch: string | null;
    certificateId: string;
    missingFields: string[];
    
    memberIndex?: number;
}

/**
 * Returns all approved participants for a given event with their cert-relevant fields.
 */
export async function getParticipantsForEvent(eventId: string): Promise<{
    success: boolean;
    data?: { event: { id: string; name: string; slug: string; date: Date }; participants: ParticipantRecord[] };
    error?: string;
}> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized." };
    }

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, slug: true, date: true },
    });
    if (!event) return { success: false, error: "Event not found." };

    const userSelect: any = {
        id: true, name: true, email: true,
        gender: true, collage: true, collageId: true, branch: true,
        certificateId: true,
    };

    const [indRegs, grpRegs] = await Promise.all([
        prisma.individualRegistration.findMany({
            where: { eventId, paymentStatus: "APPROVED" },
            include: { user: { select: userSelect } },
        }),
        prisma.groupRegistration.findMany({
            where: { eventId, paymentStatus: "APPROVED" },
            include: { user: { select: userSelect } },
        }),
    ]);

    const seenUserIds = new Set<string>();
    const participants: ParticipantRecord[] = [];

    const toRecord = (user: {
        id: string;
        name: string | null;
        email: string;
        collage: string | null;
        collageId: string | null;
        branch: string | null;
        certificateId: string | null;
    }, regId: string, type: "INDIVIDUAL" | "GROUP"): ParticipantRecord => {
        const certId = user.certificateId || makeCertificateId(event.slug, user.id);
        const missing: string[] = [];
        if (!user.name) missing.push("Name");
        if (!user.collage) missing.push("College");
        if (!user.collageId) missing.push("Reg. No.");
        if (!user.branch) missing.push("Department");
        return {
            userId: user.id,
            registrationId: regId,
            type,
            name: user.name || "",
            email: user.email,
            college: user.collage,
            regNo: user.collageId,
            branch: user.branch,
            certificateId: certId,
            missingFields: missing,
        };
    };

    for (const reg of (indRegs as any[])) {
        if (!seenUserIds.has(reg.user.id)) {
            seenUserIds.add(reg.user.id);
            participants.push(toRecord(reg.user, reg.id, "INDIVIDUAL"));
        }
    }
    for (const reg of (grpRegs as any[])) {
        if (!seenUserIds.has(reg.user.id)) {
            seenUserIds.add(reg.user.id);
            participants.push(toRecord(reg.user, reg.id, "GROUP"));
        }
        
        const members = (reg.members as unknown as GroupMemberJson[]) || [];
        members.forEach((member, index) => {
            if (!member.name) return;
            
            // For members, we don't naturally have a user ID. So we can use a composite or dummy UUID.
            // The action will use registrationId and memberIndex anyway.
            const certId = member.certificateId || "";
            const missing: string[] = [];
            if (!member.name) missing.push("Name");
            if (!member.college) missing.push("College");
            if (!member.regNo) missing.push("Reg. No.");
            if (!member.branch) missing.push("Department");
            
            participants.push({
                userId: `member-${reg.id}-${index}`, // Dummy userId for keying
                registrationId: reg.id,
                type: "MEMBER",
                name: member.name,
                email: "", // Members don't have emails
                college: member.college || null,
                regNo: member.regNo || null,
                branch: member.branch || null,
                certificateId: certId,
                missingFields: missing,
                memberIndex: index,
            });
        });
    }

    return { success: true, data: { event, participants } };
}

/**
 * Sends certificate to a single participant.
 */
export async function sendCertificateToOne(
    userId: string,
    eventId: string,
): Promise<{ success: boolean; error?: string }> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized." };
    }

    const [user, event] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, gender: true, collage: true, collageId: true, branch: true, certificateId: true } as any,
        }),
        prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, slug: true, date: true },
        }),
    ]);

    if (!user) return { success: false, error: "User not found." };
    if (!event) return { success: false, error: "Event not found." };

    const certData: CertificateData = {
        name: (user as any).name || "Participant",
        college: (user as any).collage,
        regNo: (user as any).collageId,
        branch: (user as any).branch,
        eventName: event.name,
        eventDate: event.date,
        certificateId: (user as any).certificateId || makeCertificateId(event.slug, (user as any).id),
    };

    try {
        const pdfBuffer = await generateCertificatePDF(certData);
        return sendCertificateEmail(
            { name: certData.name, email: (user as any).email },
            { name: event.name, date: event.date },
            certData.certificateId,
            pdfBuffer,
        );
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Certificate generation failed" };
    }
}

/**
 * Generates a certificate PDF and returns it as a base64 string for in-browser preview.
 */
export async function generateCertificatePreview(
    userId: string,
    eventId: string,
): Promise<{ success: boolean; base64?: string; error?: string }> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized." };
    }

    if (userId.startsWith("member-")) {
        const [, regId, idxStr] = userId.split("-");
        const memberIndex = parseInt(idxStr, 10);

        const [groupReg, event] = await Promise.all([
            prisma.groupRegistration.findUnique({
                where: { id: regId },
                include: { user: { select: { collage: true, collageId: true, branch: true } } }
            }),
            prisma.event.findUnique({
                where: { id: eventId },
                select: { id: true, name: true, slug: true, date: true },
            }),
        ]);

        if (!groupReg || !event) return { success: false, error: "Record not found." };

        const members = (groupReg.members as unknown as GroupMemberJson[]) || [];
        const member = members[memberIndex];
        if (!member) return { success: false, error: "Member not found." };
        if (!member.name) return { success: false, error: "Member name is missing." };

        const certData: CertificateData = {
            name: member.name,
            college: member.college || (groupReg.user as any).collage,
            regNo: member.regNo || (groupReg.user as any).collageId,
            branch: member.branch || (groupReg.user as any).branch,
            eventName: event.name,
            eventDate: event.date,
            certificateId: member.certificateId || makeCertificateId(event.slug, `m-${regId}-${member.name}`),
        };

        try {
            const pdfBuffer = await generateCertificatePDF(certData);
            return { success: true, base64: pdfBuffer.toString("base64") };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Preview generation failed" };
        }
    }

    const [user, event] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, gender: true, collage: true, collageId: true, branch: true, certificateId: true } as any,
        }),
        prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, slug: true, date: true },
        }),
    ]);

    if (!user) return { success: false, error: "User not found." };
    if (!event) return { success: false, error: "Event not found." };

    const certData: CertificateData = {
        name: (user as any).name || "Participant",
        college: (user as any).collage,
        regNo: (user as any).collageId,
        branch: (user as any).branch,
        eventName: event.name,
        eventDate: event.date,
        certificateId: (user as any).certificateId || makeCertificateId(event.slug, (user as any).id),
    };

    try {
        const pdfBuffer = await generateCertificatePDF(certData);
        return { success: true, base64: pdfBuffer.toString("base64") };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Preview generation failed" };
    }
}

/**
 * Updates only the certificate-relevant fields on a user record.
 */
export async function updateParticipantCertDetails(
    userId: string,
    data: {
        name?: string;
        college?: string;
        regNo?: string;
        branch?: string;
        certificateId?: string;
    },
): Promise<{ success: boolean; error?: string }> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized." };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.college !== undefined && { collage: data.college }),
                ...(data.regNo !== undefined && { collageId: data.regNo }),
                ...(data.branch !== undefined && { branch: data.branch }),
                ...(data.certificateId !== undefined && { certificateId: data.certificateId }),
            },
        } as any);
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Update failed" };
    }
}

/**
 * Updates only the certificate-relevant fields on a group member.
 */
export async function updateGroupMemberCertDetails(
    registrationId: string,
    memberIndex: number,
    data: {
        name?: string;
        college?: string;
        regNo?: string;
        branch?: string;
        certificateId?: string;
    },
): Promise<{ success: boolean; error?: string }> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized." };
    }

    try {
        const reg = await prisma.groupRegistration.findUnique({
            where: { id: registrationId },
            select: { members: true },
        });

        if (!reg) return { success: false, error: "Registration not found." };

        const members = (reg.members as unknown as GroupMemberJson[]) || [];
        if (memberIndex < 0 || memberIndex >= members.length) {
            return { success: false, error: "Member not found." };
        }

        const member = members[memberIndex];
        if (data.name !== undefined) member.name = data.name;
        if (data.college !== undefined) member.college = data.college;
        if (data.regNo !== undefined) member.regNo = data.regNo;
        if (data.branch !== undefined) member.branch = data.branch;
        if (data.certificateId !== undefined) member.certificateId = data.certificateId;

        await prisma.groupRegistration.update({
            where: { id: registrationId },
            data: { members: members as unknown as any },
        });

        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Update failed" };
    }
}

/**
 * Auto-assigns sequential SUR-XXXX certificate IDs to ALL approved participants
 * who do not yet have a certificateId, ordered by event date then registration date.
 *
 * The sequence continues from the highest existing SUR-XXXX number globally.
 */
export async function autoAssignCertificateIds(): Promise<{ success: boolean; assigned?: number; error?: string }> {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
        return { success: false, error: "Unauthorized." };
    }

    // 1. Find the current highest SUR-XXXX number globally
    const allUsers = await (prisma.user as any).findMany({
        where: { certificateId: { startsWith: "SUR-" } },
        select: { certificateId: true } as any,
    }) as Array<{ certificateId: string | null }>;

    let maxSeq = 0;
    for (const u of allUsers) {
        const match = u.certificateId?.match(/^SUR-(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxSeq) maxSeq = num;
        }
    }

    // 2. Fetch all events with approved registrations, ordered by event date
    const events = await prisma.event.findMany({
        where: {
            OR: [
                { individualRegistrations: { some: { paymentStatus: "APPROVED" } } },
                { groupRegistrations: { some: { paymentStatus: "APPROVED" } } },
            ],
        },
        select: { id: true, date: true },
        orderBy: { date: "asc" },
    });

    let assigned = 0;

    for (const event of events) {
        // Fetch individual registrations without a cert ID yet, ordered by registration date
        const indRegs = await (prisma.individualRegistration as any).findMany({
            where: {
                eventId: event.id,
                paymentStatus: "APPROVED",
                user: { certificateId: null },
            },
            include: {
                user: { select: { id: true, certificateId: true } as any },
            },
            orderBy: { createdAt: "asc" },
        }) as Array<{ user: { id: string; certificateId: string | null } }>;

        for (const reg of indRegs) {
            if (reg.user.certificateId) continue; // already assigned
            maxSeq++;
            const certId = `SUR-${String(maxSeq).padStart(4, "0")}`;
            await (prisma.user as any).update({
                where: { id: reg.user.id },
                data: { certificateId: certId } as any,
            });
            assigned++;
        }

        // Fetch group registrations
        const grpRegs = await (prisma.groupRegistration as any).findMany({
            where: {
                eventId: event.id,
                paymentStatus: "APPROVED",
            },
            include: {
                user: { select: { id: true, certificateId: true } as any },
            },
            orderBy: { createdAt: "asc" },
        }) as Array<{ id: string; members: any; user: { id: string; certificateId: string | null } }>;

        for (const reg of grpRegs) {
            let updatedMembers = false;
            
            // Assign to lead
            if (!reg.user.certificateId) {
                maxSeq++;
                const certId = `SUR-${String(maxSeq).padStart(4, "0")}`;
                await (prisma.user as any).update({
                    where: { id: reg.user.id },
                    data: { certificateId: certId } as any,
                });
                assigned++;
            }
            
            // Assign to members
            const members = (reg.members as unknown as GroupMemberJson[]) || [];
            for (const member of members) {
                if (member.name && !member.certificateId) {
                    maxSeq++;
                    const certId = `SUR-${String(maxSeq).padStart(4, "0")}`;
                    member.certificateId = certId;
                    updatedMembers = true;
                    assigned++;
                }
            }
            
            if (updatedMembers) {
                await (prisma.groupRegistration as any).update({
                    where: { id: reg.id },
                    data: { members: members as unknown as any },
                });
            }
        }
    }

    return { success: true, assigned };
}
