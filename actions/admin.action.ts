"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getPendingRegistrations() {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
            return { success: false, error: "Unauthorized" };
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

        return {
            success: true,
            data: {
                individual: individualRegistrations,
                group: groupRegistrations
            }
        };
    } catch (error) {
        console.error("Error fetching pending registrations:", error);
        return { success: false, error: "Failed to fetch registrations" };
    }
}

export async function updateRegistrationStatus(
    id: string,
    type: "INDIVIDUAL" | "GROUP",
    status: "APPROVED" | "REJECTED"
) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
            return { success: false, error: "Unauthorized" };
        }

        if (type === "INDIVIDUAL") {
            const registration = await prisma.individualRegistration.update({
                where: { id },
                data: { paymentStatus: status },
                include: { user: true, event: true }
            });

            if (status === "APPROVED") {
                // Generate Ticket and Email
                (async () => {
                    try {
                        // Fetch full user details for PDF
                        const userFull = await prisma.user.findUnique({
                            where: { id: registration.userId }
                        });

                        if (!userFull) return;

                        const { generateTicketPDF } = await import("@/lib/pdf-generator");
                        const pdfBuffer = await generateTicketPDF({
                            userId: userFull.id,
                            name: userFull.name || "Participant",
                            email: userFull.email,
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
                            city: userFull.city
                        });

                        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
                        await sendEventConfirmationEmail(
                            { name: userFull.name || "User", email: userFull.email },
                            { name: registration.event.name, date: registration.event.date, venue: registration.event.venue },
                            pdfBuffer,
                            "INDIVIDUAL"
                        );
                    } catch (e) {
                        console.error("Failed to send approval email", e);
                    }
                })();
            }

        } else {
            const registration = await prisma.groupRegistration.update({
                where: { id },
                data: { paymentStatus: status },
                include: { user: true, event: true }
            });

            if (status === "APPROVED") {
                // Generate Ticket and Email for Group
                (async () => {
                    try {
                        const lead = await prisma.user.findUnique({
                            where: { id: registration.userId }
                        });

                        if (!lead) return;

                        const members = registration.members as any || [];
                        const groupName = registration.groupName || "Team";

                        const { generateTicketPDF } = await import("@/lib/pdf-generator");
                        const pdfBuffer = await generateTicketPDF({
                            userId: lead.id,
                            name: lead.name || "Team Lead",
                            email: lead.email,
                            phone: lead.phone,
                            collage: lead.collage,
                            collageId: lead.collageId,
                            paymentStatus: "PAID",
                            isApproved: true,
                            eventName: registration.event.name,
                            isGroupEvent: true,
                            groupName: groupName,
                            teamMembers: members,
                            eventId: registration.event.id,
                            gender: lead.gender,
                            state: lead.state,
                            city: lead.city
                        });

                        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
                        await sendEventConfirmationEmail(
                            { name: lead.name || "User", email: lead.email },
                            { name: registration.event.name, date: registration.event.date, venue: registration.event.venue },
                            pdfBuffer,
                            "GROUP",
                            { groupName: groupName, members: members }
                        );
                    } catch (e) {
                        console.error("Failed to send group approval email", e);
                    }
                })();
            }
        }

        revalidatePath("/admin/registrations/approvals");
        return { success: true, message: `Registration ${status.toLowerCase()} successfully` };

    } catch (error) {
        console.error("Error updating registration status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
