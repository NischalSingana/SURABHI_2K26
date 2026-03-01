"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/zeptomail";
import { generateTicketPDF } from "@/lib/pdf-generator";

const FEST_DAYS = [
  { value: "2026-03-02", label: "March 2, 2026" },
  { value: "2026-03-03", label: "March 3, 2026" },
  { value: "2026-03-04", label: "March 4, 2026" },
  { value: "2026-03-05", label: "March 5, 2026" },
  { value: "2026-03-06", label: "March 6, 2026" },
  { value: "2026-03-07", label: "March 7, 2026" },
];

function getDayBounds(dayStr: string) {
  const start = new Date(dayStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dayStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getFestDays() {
  return { success: true, days: FEST_DAYS };
}

export async function getDayWiseParticipants(dayStr: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized" };
    }

    const { start, end } = getDayBounds(dayStr);
    const dayLabel = FEST_DAYS.find((d) => d.value === dayStr)?.label || dayStr;

    const [individualRegs, groupRegs] = await Promise.all([
      prisma.individualRegistration.findMany({
        where: {
          paymentStatus: "APPROVED",
          isVirtual: false,
          event: { date: { gte: start, lte: end } },
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, collage: true, collageId: true, gender: true, state: true, city: true } },
          event: { select: { id: true, name: true, date: true, venue: true, startTime: true, endTime: true, Category: { select: { name: true } } } },
        },
      }),
      prisma.groupRegistration.findMany({
        where: {
          paymentStatus: "APPROVED",
          isVirtual: false,
          event: { date: { gte: start, lte: end } },
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, collage: true, collageId: true, gender: true, state: true, city: true } },
          event: { select: { id: true, name: true, date: true, venue: true, startTime: true, endTime: true, Category: { select: { name: true } } } },
        },
      }),
    ]);

    const userMap = new Map<
      string,
      {
        user: { id: string; name: string | null; email: string; phone: string | null; collage: string | null; collageId: string | null; gender: string | null; state: string | null; city: string | null };
        competitions: { name: string; category?: string; date: string; venue: string; startTime: string; endTime?: string }[];
        firstReg: { regId: string; type: "INDIVIDUAL" | "GROUP"; eventId: string; eventName: string; isGroup: boolean; groupName?: string | null; venue?: string; startTime?: string; endTime?: string };
      }
    >();

    const addCompetition = (
      userId: string,
      user: { id: string; name: string | null; email: string; phone: string | null; collage: string | null; collageId: string | null; gender: string | null; state: string | null; city: string | null },
      ev: { id: string; name: string; date: Date; venue: string; startTime: string; endTime: string; Category: { name: string } },
      isGroup: boolean,
      regId: string,
      groupName?: string | null
    ) => {
      const comp = {
        name: ev.name,
        category: ev.Category.name,
        date: new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
        venue: ev.venue,
        startTime: ev.startTime,
        endTime: ev.endTime || undefined,
      };
      const existing = userMap.get(userId);
      if (!existing) {
        userMap.set(userId, {
          user,
          competitions: [comp],
          firstReg: { regId, type: isGroup ? "GROUP" : "INDIVIDUAL", eventId: ev.id, eventName: ev.name, isGroup, groupName, venue: ev.venue, startTime: ev.startTime, endTime: ev.endTime || undefined },
        });
      } else {
        if (!existing.competitions.some((c) => c.name === comp.name)) {
          existing.competitions.push(comp);
        }
      }
    };

    individualRegs.forEach((r) => addCompetition(r.userId, r.user, r.event, false, r.id));
    groupRegs.forEach((r) => addCompetition(r.userId, r.user, r.event, true, r.id, r.groupName));

    const participants = Array.from(userMap.values()).map((p) => ({
      userId: p.user.id,
      userName: p.user.name || p.user.email,
      userEmail: p.user.email,
      competitions: p.competitions,
      firstReg: p.firstReg,
    })) as {
      userId: string;
      userName: string;
      userEmail: string;
      competitions: { name: string; category?: string; date: string; venue: string; startTime: string; endTime?: string }[];
      firstReg: { regId: string; type: "INDIVIDUAL" | "GROUP"; eventId: string; eventName: string; isGroup: boolean; groupName?: string | null; venue?: string; startTime?: string; endTime?: string };
    }[];

    return { success: true, participants, dayLabel, count: participants.length };
  } catch (e) {
    console.error("getDayWiseParticipants:", e);
    return { success: false, error: (e as Error).message, participants: [], count: 0 };
  }
}

export async function sendWelcomeEmailTest(testEmail: string, dayStr: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized" };
    }

    const dayLabel = FEST_DAYS.find((d) => d.value === dayStr)?.label || dayStr;

    const sampleCompetitions = [
      { name: "LandScape", category: "Chitrakala", date: "2 March 2026", venue: "RND 6th Floor", startTime: "10:00", endTime: "16:00" },
    ];

    // Use session user's ID for PDF generation - createPass requires a valid userId that exists in DB
    const pdfBuffer = await generateTicketPDF({
      userId: session.user.id,
      name: "Test User",
      email: testEmail,
      phone: "9876543210",
      collage: "Test College",
      collageId: "TST001",
      paymentStatus: "PAID",
      isApproved: true,
      eventName: "LandScape",
      isGroupEvent: false,
      eventId: undefined,
      gender: "MALE",
      venue: "RND 6th Floor",
      startTime: "10:00",
      endTime: "16:00",
    });

    const result = await sendWelcomeEmail(
      { name: "Test User", email: testEmail },
      dayLabel,
      sampleCompetitions,
      pdfBuffer
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, message: `Test welcome email sent to ${testEmail}` };
  } catch (e) {
    console.error("sendWelcomeEmailTest:", e);
    return { success: false, error: (e as Error).message };
  }
}

export async function sendWelcomeEmailsForDay(dayStr: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized" };
    }

    const participantsRes = await getDayWiseParticipants(dayStr);
    if (!participantsRes.success || !participantsRes.participants) {
      return { success: false, error: participantsRes.error || "Failed to get participants" };
    }

    const participants = participantsRes.participants;
    const dayLabel = participantsRes.dayLabel || dayStr;
    const sent: string[] = [];
    const failed: { email: string; error: string }[] = [];

    for (const p of participants) {
      try {
        let pdfBuffer: Buffer | null = null;
        const firstReg = p.firstReg;
        const userFull = await prisma.user.findUnique({ where: { id: p.userId } });
        if (userFull && firstReg) {
          if (firstReg.type === "INDIVIDUAL") {
            pdfBuffer = await generateTicketPDF({
              userId: userFull.id,
              name: userFull.name || p.userName,
              email: userFull.email,
              phone: userFull.phone || "",
              collage: userFull.collage || "",
              collageId: userFull.collageId || "",
              paymentStatus: "PAID",
              isApproved: true,
              eventName: firstReg.eventName,
              isGroupEvent: false,
              eventId: firstReg.eventId,
              gender: userFull.gender || undefined,
              state: userFull.state || undefined,
              city: userFull.city || undefined,
              venue: firstReg.venue ?? undefined,
              startTime: firstReg.startTime ?? undefined,
              endTime: firstReg.endTime ?? undefined,
            });
          } else {
            const grpReg = await prisma.groupRegistration.findUnique({
              where: { id: firstReg.regId },
              include: { event: true },
            });
            if (grpReg) {
              const members = Array.isArray(grpReg.members) ? (grpReg.members as { name?: string; phone?: string; gender?: string }[]).map((m) => ({
                name: m.name || "",
                phone: m.phone || "",
                gender: m.gender || "N/A",
              })) : [];
              const ev = grpReg.event;
              pdfBuffer = await generateTicketPDF({
                userId: userFull.id,
                name: userFull.name || p.userName,
                email: userFull.email,
                phone: userFull.phone || "",
                collage: userFull.collage || "",
                collageId: userFull.collageId || "",
                paymentStatus: "PAID",
                isApproved: true,
                eventName: firstReg.eventName,
                isGroupEvent: true,
                groupName: grpReg.groupName || undefined,
                eventId: firstReg.eventId,
                teamMembers: members,
                gender: userFull.gender || undefined,
                state: userFull.state || undefined,
                city: userFull.city || undefined,
                venue: ev.venue ?? undefined,
                startTime: ev.startTime ?? undefined,
                endTime: ev.endTime ?? undefined,
              });
            }
          }
        }

        const result = await sendWelcomeEmail(
          { name: p.userName, email: p.userEmail },
          dayLabel,
          p.competitions,
          pdfBuffer
        );

        if (result.success) {
          sent.push(p.userEmail);
        } else {
          failed.push({ email: p.userEmail, error: result.error || "Unknown error" });
        }
      } catch (err) {
        failed.push({ email: p.userEmail, error: (err as Error).message });
      }
    }

    return {
      success: true,
      message: `Sent ${sent.length} welcome emails. ${failed.length} failed.`,
      sent: sent.length,
      failed: failed.length,
      errors: failed.slice(0, 5),
    };
  } catch (e) {
    console.error("sendWelcomeEmailsForDay:", e);
    return { success: false, error: (e as Error).message };
  }
}
