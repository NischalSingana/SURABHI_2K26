"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

/**
 * Get accommodation analytics for other colleges physical participants only.
 * Excludes KL University, international, and virtual participants.
 */
export async function getAccommodationAnalytics() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || (session.user.role !== Role.GOD && session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch all accommodation bookings with user data
    const bookings = await prisma.accommodationBooking.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            collage: true,
            isInternational: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter: physical participants only (KL and other colleges eligible for accommodation)
    // Exclude: international (virtual), virtual-only participants
    const eligibleBookings = bookings.filter((b) => {
      const u = b.user;
      if (!u) return false;
      if (!!(u as { isInternational?: boolean }).isInternational) return false;
      return true;
    });

    // Virtual check: user must have physical reg - we verify via registration data
    const userIds = [...new Set(eligibleBookings.map((b) => b.userId))];
    const physicalRegs = await Promise.all(
      userIds.map(async (uid) => {
        const [indiv, group] = await Promise.all([
          prisma.individualRegistration.count({
            where: {
              userId: uid,
              paymentStatus: { in: ["PENDING", "APPROVED"] },
              isVirtual: false,
            },
          }),
          prisma.groupRegistration.count({
            where: {
              userId: uid,
              paymentStatus: { in: ["PENDING", "APPROVED"] },
              isVirtual: false,
            },
          }),
        ]);
        return { userId: uid, hasPhysical: indiv > 0 || group > 0 };
      })
    );
    const physicalUserIds = new Set(physicalRegs.filter((r) => r.hasPhysical).map((r) => r.userId));

    // Build competition list per user (physical + active regs only)
    const [individualRegs, groupRegs] = await Promise.all([
      prisma.individualRegistration.findMany({
        where: {
          userId: { in: userIds },
          paymentStatus: { in: ["PENDING", "APPROVED"] },
          isVirtual: false,
        },
        select: {
          userId: true,
          event: {
            select: {
              name: true,
              Category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.groupRegistration.findMany({
        where: {
          userId: { in: userIds },
          paymentStatus: { in: ["PENDING", "APPROVED"] },
          isVirtual: false,
        },
        select: {
          userId: true,
          event: {
            select: {
              name: true,
              Category: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const competitionsByUser = new Map<string, Set<string>>();
    const addCompetition = (uid: string, category: string, eventName: string) => {
      const label = `${category} - ${eventName}`;
      const set = competitionsByUser.get(uid) || new Set<string>();
      set.add(label);
      competitionsByUser.set(uid, set);
    };
    individualRegs.forEach((reg) => addCompetition(reg.userId, reg.event.Category.name, reg.event.name));
    groupRegs.forEach((reg) => addCompetition(reg.userId, reg.event.Category.name, reg.event.name));

    const analyticsBookings = eligibleBookings.filter(
      (b) =>
        physicalUserIds.has(b.userId) &&
        (b.status === "CONFIRMED" || b.status === "PENDING")
    );

    // Compute stats
    const totalBookings = analyticsBookings.length;
    const totalGuests = analyticsBookings.reduce((s, b) => s + b.totalMembers, 0);
    const byGender = {
      MALE: analyticsBookings.filter((b) => b.gender === "MALE").length,
      FEMALE: analyticsBookings.filter((b) => b.gender === "FEMALE").length,
    };
    const byType = {
      INDIVIDUAL: analyticsBookings.filter((b) => b.bookingType === "INDIVIDUAL").length,
      GROUP: analyticsBookings.filter((b) => b.bookingType === "GROUP").length,
    };
    const byStatus = {
      PENDING: analyticsBookings.filter((b) => b.status === "PENDING").length,
      CONFIRMED: analyticsBookings.filter((b) => b.status === "CONFIRMED").length,
      CANCELLED: analyticsBookings.filter((b) => b.status === "CANCELLED").length,
      REJECTED: analyticsBookings.filter((b) => b.status === "REJECTED").length,
    };

    // By college
    const collegeMap = new Map<string, { count: number; guests: number; male: number; female: number }>();
    for (const b of analyticsBookings) {
      const college = (b.user?.collage || "Unknown").trim() || "Unknown";
      const curr = collegeMap.get(college) || { count: 0, guests: 0, male: 0, female: 0 };
      curr.count += 1;
      curr.guests += b.totalMembers;
      if (b.gender === "MALE") curr.male += 1;
      if (b.gender === "FEMALE") curr.female += 1;
      collegeMap.set(college, curr);
    }
    const byCollege = Array.from(collegeMap.entries())
      .map(([name, data]) => ({
        name,
        bookings: data.count,
        male: data.male,
        female: data.female,
        guests: data.guests,
      }))
      .sort((a, b) => b.bookings - a.bookings);

    const serialized = analyticsBookings.map((b) => ({
      ...b,
      amount: b.amount ? b.amount.toString() : null,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      competitions: Array.from(competitionsByUser.get(b.userId) || []),
    }));

    return {
      success: true,
      data: {
        stats: {
          totalBookings,
          totalGuests,
          byGender,
          byType,
          byStatus,
          byCollege,
        },
        bookings: serialized,
      },
    };
  } catch (error: any) {
    console.error("Accommodation analytics error:", error);
    return { success: false, error: error.message };
  }
}
