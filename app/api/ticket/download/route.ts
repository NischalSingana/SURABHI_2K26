"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { generateTicketPDF } from "@/lib/pdf-generator";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Fetch User Details
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                phone: true,
                collage: true,
                collageId: true,
                gender: true, // Fetch gender
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch Event Details
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { name: true, isGroupEvent: true, id: true }
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        let ticketData: any = {
            userId: userId,
            name: user.name || "Unknown",
            email: user.email,
            phone: user.phone,
            collage: user.collage,
            collageId: user.collageId,
            gender: user.gender || "-", // Add gender to ticket data
            eventName: event.name,
            eventId: event.id, // Add eventId to pass to PDF/QR generator
            isGroupEvent: event.isGroupEvent,
            paymentStatus: 'CONFIRMED', // Defaulting since we check registration presence
            isApproved: true, // Defaulting as confirmed registration
        };

        if (event.isGroupEvent) {
            // Check Group Registration
            const groupReg = await prisma.groupRegistration.findFirst({
                where: {
                    eventId: eventId,
                    userId: userId // User must be the one who registered (Team Lead)
                }
            });

            if (!groupReg) {
                // Check if user is a member of a group? 
                // Current logic implies only Team Lead registers and gets the ticket for the team.
                // If normal member tries to download, they might not find it here if we stick to `userId: userId` as creator.
                // But for now, let's assume only Team Leads download or we search deeply.
                // Wait, if I am a member, I should be able to get a ticket too? 
                // The prompt said: "IF GROUP COMPETETION THEN DISPLAY FULL DETAILS OF THE TEAM LEAD AND THEN DISPLAY THE MANUALLY ENTERED DETAILS OF THE TEAMMATES"
                // This implies the ticket is a TEAM TICKET.

                return NextResponse.json(
                    { error: "Group registration not found for this event." },
                    { status: 404 }
                );
            }

            ticketData.groupName = groupReg.groupName;

            // Parse members
            let members: any[] = [];
            if (groupReg.members && Array.isArray(groupReg.members)) {
                members = groupReg.members.map((m: any) => ({
                    name: m.name || "Unknown",
                    phone: m.phone || "-",
                    gender: m.gender || "-"
                }));
            }
            ticketData.teamMembers = members;
            // For group events, the lead's details are already in `user` which is passed to `ticketData`.

        } else {
            // Check Individual Registration
            const individualReg = await prisma.eventSubmission.findUnique({
                where: {
                    userId_eventId: {
                        userId: userId,
                        eventId: eventId
                    }
                }
            });

            if (!individualReg) {
                // Fallback: Check if user is registered via the standard relation
                // (for events that didn't require extra details)
                const basicReg = await prisma.user.findFirst({
                    where: {
                        id: userId,
                        registeredEvents: {
                            some: {
                                id: eventId
                            }
                        }
                    }
                });

                if (!basicReg) {
                    return NextResponse.json(
                        { error: "Registration not found for this event." },
                        { status: 404 }
                    );
                }
                // Found basic registration, proceed with ticket generation
            }
            // Individual registration confirmed (either detailed or basic)
        }

        // Generate PDF
        const pdfBuffer = await generateTicketPDF(ticketData);

        // Return PDF as download
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="surabhi-2026-ticket-${event.name.replace(/\s+/g, '-')}.pdf"`,
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Error generating ticket:", error);
        return NextResponse.json(
            { error: `Failed to generate ticket: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
