"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin-logs";
import { approveBookingInternal } from "@/actions/admin/accommodation.action";

interface GroupMember {
    name: string;
  phone?: string;
    gender: string;
    inGameName?: string;
    inGameId?: string;
    riotId?: string;
}

function getManualContactEmail(registrationDetails: Prisma.JsonValue | null | undefined): string | null {
    if (!registrationDetails || typeof registrationDetails !== "object" || Array.isArray(registrationDetails)) return null;
    const value = (registrationDetails as Record<string, unknown>).manualContactEmail;
    return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export async function getPendingRegistrations() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
            return { success: false, error: "Unauthorized. Admin or Master only." };
        }

        const individualRegistrations = await prisma.individualRegistration.findMany({
            where: {
                paymentStatus: "PENDING"
            },
            include: {
                user: true,
                event: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const groupRegistrations = await prisma.groupRegistration.findMany({
            where: {
                paymentStatus: "PENDING"
            },
            include: {
                user: true,
                event: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const visitorPasses = await prisma.visitorPassRegistration.findMany({
            where: { paymentStatus: "PENDING" },
            include: { user: true },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: {
                individual: individualRegistrations,
                group: groupRegistrations,
                visitorPasses,
            },
        };
    } catch (error) {
        console.error("Error fetching pending registrations:", error);
        return { success: false, error: "Failed to fetch registrations" };
    }
}

export async function getRegistrationHistory() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
            return { success: false, error: "Unauthorized. Admin or Master only." };
        }

        const individualRegistrationsRaw = await prisma.individualRegistration.findMany({
            where: {
                paymentStatus: { in: ["APPROVED", "REJECTED"] }
            },
            include: {
                user: true,
                event: true
            },
            orderBy: {
                updatedAt: "desc"
            }
        });

        // Fetch approver info for individual registrations
        const individualRegistrations = await Promise.all(
            individualRegistrationsRaw.map(async (reg) => {
                let approver = null;
                if (reg.approvedBy) {
                    approver = await prisma.user.findUnique({
                        where: { id: reg.approvedBy },
                        select: { id: true, name: true, email: true, role: true },
                    });
                }
                return { ...reg, approver };
            })
        );

        const groupRegistrationsRaw = await prisma.groupRegistration.findMany({
            where: {
                paymentStatus: { in: ["APPROVED", "REJECTED"] }
            },
            include: {
                user: true,
                event: true
            },
            orderBy: {
                updatedAt: "desc"
            }
        });

        // Fetch approver info for group registrations
        const groupRegistrations = await Promise.all(
            groupRegistrationsRaw.map(async (reg) => {
                let approver = null;
                if (reg.approvedBy) {
                    approver = await prisma.user.findUnique({
                        where: { id: reg.approvedBy },
                        select: { id: true, name: true, email: true, role: true },
                    });
                }
                return { ...reg, approver };
            })
        );

        const visitorPassesRaw = await prisma.visitorPassRegistration.findMany({
            where: { paymentStatus: { in: ["APPROVED", "REJECTED"] } },
            include: { user: true },
            orderBy: { updatedAt: "desc" },
        });

        // Fetch approver info for visitor passes
        const visitorPasses = await Promise.all(
            visitorPassesRaw.map(async (pass) => {
                let approver = null;
                if (pass.approvedBy) {
                    approver = await prisma.user.findUnique({
                        where: { id: pass.approvedBy },
                        select: { id: true, name: true, email: true, role: true },
                    });
                }
                return { ...pass, approver };
            })
        );

        return {
            success: true,
            data: {
                individual: individualRegistrations,
                group: groupRegistrations,
                visitorPasses,
            },
        };
    } catch (error) {
        console.error("Error fetching registration history:", error);
        return { success: false, error: "Failed to fetch registration history" };
    }
}

export async function updateRegistrationStatus(
    id: string,
    type: "INDIVIDUAL" | "GROUP" | "VISITOR_PASS",
    status: "APPROVED" | "REJECTED"
) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.MASTER && session.user.role !== Role.ADMIN)) {
            return { success: false, error: "Unauthorized. Admin or Master only." };
        }

        if (type === "VISITOR_PASS") {
            const existing = await prisma.visitorPassRegistration.findUnique({
                where: { id },
                include: { user: true },
            });

            if (!existing) {
                return { success: false, error: "Visitor pass not found" };
            }

            await prisma.visitorPassRegistration.update({
                where: { id },
                data: {
                    paymentStatus: status,
                    ...(status === "APPROVED" && { passToken: crypto.randomUUID() }),
                    approvedBy: session.user.id,
                    approvedAt: new Date(),
                },
            });

            const user = existing.user;
            if (!user) {
                return { success: false, error: "User not found" };
            }

            // Log the approval/rejection activity
            await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
                action: status === "APPROVED" ? "APPROVE_VISITOR_PASS" : "REJECT_VISITOR_PASS",
                entityType: "VISITOR_PASS",
                entityId: id,
                entityName: `Visitor Pass - ${user.name || user.email}`,
                details: {
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name,
                    status: status,
                    utrId: existing.utrId,
                    payeeName: existing.payeeName,
                },
            });

            if (status === "APPROVED") {
                const isInternational = !!(user as { isInternational?: boolean }).isInternational;
                (async () => {
                    try {
                        const { generateTicketPDF } = await import("@/lib/pdf-generator");
                        const pdfBuffer = await generateTicketPDF({
                            userId: user.id,
                            name: user.name || "Visitor",
                            email: user.email,
                            phone: user.phone || "",
                            collage: user.collage || "",
                            collageId: user.collageId || "",
                            paymentStatus: "PAID",
                            isApproved: true,
                            eventName: "Surabhi 2026",
                            isGroupEvent: false,
                            eventId: undefined,
                            gender: user.gender || "N/A",
                            state: user.state || "",
                            city: user.city || "",
                            isInternational: isInternational || undefined,
                        });
                        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
                        const emailResult = await sendEventConfirmationEmail(
                            { name: user.name || "Visitor", email: user.email },
                            { name: "Surabhi 2026", date: new Date(), venue: "KL University" },
                            pdfBuffer,
                            "VISITOR",
                            undefined,
                            undefined,
                            isInternational
                        );
                        if (!emailResult || !emailResult.success) {
                            console.error(`Failed to send visitor pass approval email to ${user.email}:`, emailResult?.error || "Unknown error");
                        }
                    } catch (e: unknown) {
                        const err = e as Error;
                        console.error(`Failed to send visitor pass approval email to ${user.email}:`, e);
                        console.error("Error details:", { message: err?.message, stack: err?.stack, name: err?.name });
                    }
                })();
            }

            revalidatePath("/admin/registrations/approvals");
            revalidatePath("/profile");
            revalidatePath("/profile/competitions");
            revalidatePath("/competitions");
            return { success: true, message: `Visitor pass ${status.toLowerCase()} successfully` };
        } else if (type === "INDIVIDUAL") {
            // Check if registration exists first
            const existingReg = await prisma.individualRegistration.findUnique({
                where: { id }
            });

            if (!existingReg) {
                return { success: false, error: "Individual registration not found" };
            }

            const registration = await prisma.individualRegistration.update({
                where: { id },
                data: {
                    paymentStatus: status,
                    approvedBy: session.user.id,
                    approvedAt: new Date(),
                },
                include: { user: true, event: { select: { id: true, name: true, date: true, venue: true, startTime: true, endTime: true, description: true, termsandconditions: true, virtualTermsAndConditions: true, whatsappLink: true } } }
            });

            // Log the approval/rejection activity
            await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
                action: status === "APPROVED" ? "APPROVE_INDIVIDUAL_REGISTRATION" : "REJECT_INDIVIDUAL_REGISTRATION",
                entityType: "INDIVIDUAL_REGISTRATION",
                entityId: id,
                entityName: `${registration.event.name} - ${registration.user.name || registration.user.email}`,
                details: {
                    userId: registration.userId,
                    userEmail: registration.user.email,
                    userName: registration.user.name,
                    eventId: registration.eventId,
                    eventName: registration.event.name,
                    status: status,
                    utrId: registration.utrId,
                    payeeName: registration.payeeName,
                },
            });

            if (status === "REJECTED") {
                // Cancel accommodation if user has no remaining PENDING/APPROVED physical registrations
                const [remainingIndividual, remainingGroup] = await Promise.all([
                    prisma.individualRegistration.count({
                        where: {
                            userId: registration.userId,
                            paymentStatus: { in: ["PENDING", "APPROVED"] },
                            isVirtual: false,
                        },
                    }),
                    prisma.groupRegistration.count({
                        where: {
                            userId: registration.userId,
                            paymentStatus: { in: ["PENDING", "APPROVED"] },
                            isVirtual: false,
                        },
                    }),
                ]);
                if (remainingIndividual === 0 && remainingGroup === 0) {
                    await prisma.accommodationBooking.updateMany({
                        where: {
                            userId: registration.userId,
                            status: { notIn: ["CANCELLED", "REJECTED"] },
                        },
                        data: { status: "CANCELLED", paymentStatus: "REJECTED" },
                    });
                    revalidatePath("/accommodation");
                    revalidatePath("/profile");
                }
            }

            if (status === "APPROVED") {
                try {
                    const manualContactEmail = getManualContactEmail(registration.registrationDetails);
                    const accommodationEmails = [registration.user.email, manualContactEmail].filter(
                        (value): value is string => !!value
                    );
                    const pendingAccommodationBookings = await prisma.accommodationBooking.findMany({
                        where: {
                            status: "PENDING",
                            OR: [
                                { userId: registration.userId },
                                ...(accommodationEmails.length > 0
                                    ? [{ primaryEmail: { in: accommodationEmails } }]
                                    : []),
                            ],
                        },
                        select: { id: true },
                    });
                    for (const booking of pendingAccommodationBookings) {
                        try {
                            await approveBookingInternal(booking.id);
                        } catch (bookingError) {
                            console.error("Failed to auto-approve accommodation booking:", bookingError);
                        }
                    }
                } catch (accommodationError) {
                    console.error("Failed to auto-approve accommodation for individual approval:", accommodationError);
                }

                const userFull = await prisma.user.findUnique({
                    where: { id: registration.userId },
                    select: { id: true, name: true, email: true, phone: true, collage: true, collageId: true, gender: true, state: true, city: true, isInternational: true },
                });
                if (!userFull) return;
                const manualContactEmail = getManualContactEmail(registration.registrationDetails);
                const destinationEmail = manualContactEmail || userFull.email;

                const isInternational = !!userFull.isInternational;
                const isVirtual = !!registration.isVirtual;
                const isVirtualParticipant = isInternational || isVirtual;

                (async () => {


                    try {
                        let pdfBuffer: Buffer | null = null;
                        if (!isVirtualParticipant) {
                            const { generateTicketPDF } = await import("@/lib/pdf-generator");
                            pdfBuffer = await generateTicketPDF({
                                userId: userFull.id,
                                name: userFull.name || "Participant",
                                email: destinationEmail,
                                phone: userFull.phone,
                                collage: userFull.collage,
                                collageId: userFull.collageId,
                                paymentStatus: "PAID",
                                isApproved: true,
                                eventName: registration.event.name,
                                isGroupEvent: false,
                                eventId: registration.event.id,
                                gender: userFull.gender,
                                state: userFull.state,
                                city: userFull.city,
                                venue: registration.event.venue ?? undefined,
                                startTime: registration.event.startTime ?? undefined,
                                endTime: registration.event.endTime ?? undefined,
                            });
                        }
                        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
                        await sendEventConfirmationEmail(
                            { name: userFull.name || "User", email: destinationEmail },
                            {
                                name: registration.event.name,
                                date: registration.event.date,
                                venue: registration.event.venue,
                                startTime: registration.event.startTime,
                                endTime: registration.event.endTime
                            },
                            pdfBuffer,
                            "INDIVIDUAL",
                            undefined,
                            {
                                description: registration.event.description,
                                termsAndConditions: registration.event.termsandconditions,
                                virtualTermsAndConditions: registration.event.virtualTermsAndConditions,
                                whatsappLink: registration.event.whatsappLink
                            },
                            isInternational,
                            isVirtualParticipant
                        );
                    } catch (e: unknown) {
                        const err = e as Error;
                        console.error("Failed to send approval email", err);
                    }
                })();
            }

        } else {
            // Check if registration exists first
            const existingReg = await prisma.groupRegistration.findUnique({
                where: { id }
            });

            if (!existingReg) {
                return { success: false, error: "Group registration not found" };
            }

            const registration = await prisma.groupRegistration.update({
                where: { id },
                data: {
                    paymentStatus: status,
                    approvedBy: session.user.id,
                    approvedAt: new Date(),
                },
                include: { user: true, event: { select: { id: true, name: true, date: true, venue: true, startTime: true, endTime: true, description: true, termsandconditions: true, virtualTermsAndConditions: true, whatsappLink: true } } }
            });

            // Log the approval/rejection activity
            await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
                action: status === "APPROVED" ? "APPROVE_GROUP_REGISTRATION" : "REJECT_GROUP_REGISTRATION",
                entityType: "GROUP_REGISTRATION",
                entityId: id,
                entityName: `${registration.event.name} - ${registration.groupName || "Team"} (${registration.user.name || registration.user.email})`,
                details: {
                    userId: registration.userId,
                    userEmail: registration.user.email,
                    userName: registration.user.name,
                    eventId: registration.eventId,
                    eventName: registration.event.name,
                    groupName: registration.groupName,
                    status: status,
                    teamSize: Array.isArray(registration.members) ? (registration.members as Prisma.JsonArray).length + 1 : 1,
                },
            });

            if (status === "REJECTED") {
                // Cancel accommodation if team lead has no remaining PENDING/APPROVED physical registrations
                const [remainingIndividual, remainingGroup] = await Promise.all([
                    prisma.individualRegistration.count({
                        where: {
                            userId: registration.userId,
                            paymentStatus: { in: ["PENDING", "APPROVED"] },
                            isVirtual: false,
                        },
                    }),
                    prisma.groupRegistration.count({
                        where: {
                            userId: registration.userId,
                            paymentStatus: { in: ["PENDING", "APPROVED"] },
                            isVirtual: false,
                        },
                    }),
                ]);
                if (remainingIndividual === 0 && remainingGroup === 0) {
                    await prisma.accommodationBooking.updateMany({
                        where: {
                            userId: registration.userId,
                            status: { notIn: ["CANCELLED", "REJECTED"] },
                        },
                        data: { status: "CANCELLED", paymentStatus: "REJECTED" },
                    });
                    revalidatePath("/accommodation");
                    revalidatePath("/profile");
                }
            }

            if (status === "APPROVED") {
                try {
                    const manualContactEmail = getManualContactEmail(registration.registrationDetails);
                    const accommodationEmails = [registration.user.email, manualContactEmail].filter(
                        (value): value is string => !!value
                    );
                    const pendingAccommodationBookings = await prisma.accommodationBooking.findMany({
                        where: {
                            status: "PENDING",
                            OR: [
                                { userId: registration.userId },
                                ...(accommodationEmails.length > 0
                                    ? [{ primaryEmail: { in: accommodationEmails } }]
                                    : []),
                            ],
                        },
                        select: { id: true },
                    });
                    for (const booking of pendingAccommodationBookings) {
                        try {
                            await approveBookingInternal(booking.id);
                        } catch (bookingError) {
                            console.error("Failed to auto-approve accommodation booking:", bookingError);
                        }
                    }
                } catch (accommodationError) {
                    console.error("Failed to auto-approve accommodation for group approval:", accommodationError);
                }

                const lead = await prisma.user.findUnique({
                    where: { id: registration.userId },
                    select: { id: true, name: true, email: true, phone: true, collage: true, collageId: true, gender: true, state: true, city: true, isInternational: true },
                });
                if (!lead) return;
                const manualContactEmail = getManualContactEmail(registration.registrationDetails);
                const destinationEmail = manualContactEmail || lead.email;

                const members = (registration.members as unknown as GroupMember[]) || [];
                const membersForTicket = members.map((member) => ({
                    ...member,
                    phone: member.phone || "-",
                }));
                const groupName = registration.groupName || "Team";
                const isInternational = !!lead.isInternational;
                const isVirtual = !!registration.isVirtual;
                const isVirtualParticipant = isInternational || isVirtual;

                (async () => {


                    try {
                        let pdfBuffer: Buffer | null = null;
                        if (!isVirtualParticipant) {
                            const { generateTicketPDF } = await import("@/lib/pdf-generator");
                            pdfBuffer = await generateTicketPDF({
                                userId: lead.id,
                                name: lead.name || "Team Lead",
                                email: destinationEmail,
                                phone: lead.phone,
                                collage: lead.collage,
                                collageId: lead.collageId,
                                paymentStatus: "PAID",
                                isApproved: true,
                                eventName: registration.event.name,
                                isGroupEvent: true,
                                groupName: groupName,
                                teamMembers: membersForTicket,
                                eventId: registration.event.id,
                                gender: lead.gender,
                                state: lead.state,
                                city: lead.city,
                                venue: registration.event.venue ?? undefined,
                                startTime: registration.event.startTime ?? undefined,
                                endTime: registration.event.endTime ?? undefined,
                            });
                        }
                        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
                        await sendEventConfirmationEmail(
                            { name: lead.name || "User", email: destinationEmail },
                            {
                                name: registration.event.name,
                                date: registration.event.date,
                                venue: registration.event.venue,
                                startTime: registration.event.startTime,
                                endTime: registration.event.endTime
                            },
                            pdfBuffer,
                            "GROUP",
                            { groupName: groupName, members: members },
                            {
                                description: registration.event.description,
                                termsAndConditions: registration.event.termsandconditions,
                                virtualTermsAndConditions: registration.event.virtualTermsAndConditions,
                                whatsappLink: registration.event.whatsappLink
                            },
                            isInternational,
                            isVirtualParticipant
                        );
                    } catch (e) {
                        console.error("Failed to send group approval email", e);
                    }
                })();
            }
        }

        revalidatePath("/admin/registrations/approvals");
        revalidatePath("/profile");
        revalidatePath("/profile/competitions");
        revalidatePath("/competitions");
        return { success: true, message: `Registration ${status.toLowerCase()} successfully` };

    } catch (error) {
        console.error("Error updating registration status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
