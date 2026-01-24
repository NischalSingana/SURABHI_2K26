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

        const allVisitorPasses = await prisma.pass.findMany({
            where: {
                passType: "VISITOR"
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        // Filter for pending passes and fetch user data
        const pendingPasses = allVisitorPasses.filter(p => p.paymentStatus === "PENDING");
        const visitorPasses = await Promise.all(
            pendingPasses.map(async (pass) => {
                const user = await prisma.user.findUnique({ where: { id: pass.userId } });
                return { ...pass, user };
            })
        );

        return {
            success: true,
            data: {
                individual: individualRegistrations,
                group: groupRegistrations,
                visitorPasses: visitorPasses
            }
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
            return { success: false, error: "Unauthorized" };
        }

        const individualRegistrations = await prisma.individualRegistration.findMany({
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

        const groupRegistrations = await prisma.groupRegistration.findMany({
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

        const allVisitorPasses = await prisma.pass.findMany({
            where: {
                passType: "VISITOR",
                paymentStatus: { in: ["APPROVED", "REJECTED"] }
            },
            orderBy: {
                updatedAt: "desc"
            }
        });

        // Filter for user data
        const visitorPasses = await Promise.all(
            allVisitorPasses.map(async (pass) => {
                const user = await prisma.user.findUnique({ where: { id: pass.userId } });
                return { ...pass, user };
            })
        );

        return {
            success: true,
            data: {
                individual: individualRegistrations,
                group: groupRegistrations,
                visitorPasses: visitorPasses
            }
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
            return { success: false, error: "Unauthorized" };
        }

        if (type === "VISITOR_PASS") {
            // Check if pass exists first
            const existingPass = await prisma.pass.findUnique({
                where: { id }
            });

            if (!existingPass) {
                return { success: false, error: "Visitor pass not found" };
            }

            if (existingPass.passType !== "VISITOR") {
                return { success: false, error: "This is not a visitor pass" };
            }

            const pass = await prisma.pass.update({
                where: { id },
                data: {
                    paymentStatus: status,
                    passToken: status === "APPROVED" ? crypto.randomUUID() : undefined,
                    isActive: status === "APPROVED"
                }
            });

            const user = await prisma.user.findUnique({ where: { id: pass.userId } });
            if (!user) {
                return { success: false, error: "User not found" };
            }

            if (status === "APPROVED") {
                // Generate Pass and Email
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
                            city: user.city || ""
                        });

                        const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
                        await sendEventConfirmationEmail(
                            { name: user.name || "Visitor", email: user.email },
                            { name: "Surabhi 2026", date: new Date(), venue: "KL University" },
                            pdfBuffer,
                            "VISITOR"
                        );
                    } catch (e) {
                        console.error("Failed to send visitor pass approval email", e);
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
                                whatsappLink: registration.event.whatsappLink
                            }
                        );
                    } catch (e) {
                        console.error("Failed to send approval email", e);
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
                                whatsappLink: registration.event.whatsappLink
                            }
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
