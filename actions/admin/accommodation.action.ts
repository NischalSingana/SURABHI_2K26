"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role, BookingStatus, PaymentStatus, BookingType, Gender } from "@prisma/client";
import { generateAccommodationPassToken } from "@/lib/accommodation-pass";
import { generateAccommodationPassPDF } from "@/lib/pdf-generator";
import { sendAccommodationConfirmationEmail } from "@/lib/zeptomail";

export async function getAllBookings(filters?: {
    bookingType?: BookingType;
    gender?: Gender;
    paymentStatus?: PaymentStatus;
    status?: BookingStatus;
}) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const where: any = {};

        if (filters?.bookingType) {
            where.bookingType = filters.bookingType;
        }

        if (filters?.gender) {
            where.gender = filters.gender;
        }

        if (filters?.paymentStatus) {
            where.paymentStatus = filters.paymentStatus;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        const bookings = await prisma.accommodationBooking.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        collage: true,
                        individualRegistrations: {
                            where: {
                                paymentStatus: "APPROVED",
                            },
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date: true,
                                        venue: true,
                                        startTime: true,
                                        endTime: true,
                                        Category: {
                                            select: {
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        groupRegistrations: {
                            where: {
                                paymentStatus: "APPROVED",
                            },
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        name: true,
                                        date: true,
                                        venue: true,
                                        startTime: true,
                                        endTime: true,
                                        Category: {
                                            select: {
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Convert Decimal to string for serialization and handle nested dates
        const serializedBookings = bookings.map((booking) => ({
            ...booking,
            amount: booking.amount ? booking.amount.toString() : null,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
            user: {
                ...booking.user,
                individualRegistrations: booking.user.individualRegistrations.map((reg: any) => ({
                    ...reg,
                    createdAt: reg.createdAt.toISOString(),
                    updatedAt: reg.updatedAt.toISOString(),
                    event: reg.event ? {
                        ...reg.event,
                        date: reg.event.date.toISOString(),
                    } : null,
                })),
                groupRegistrations: booking.user.groupRegistrations.map((reg: any) => ({
                    ...reg,
                    createdAt: reg.createdAt.toISOString(),
                    updatedAt: reg.updatedAt.toISOString(),
                    event: reg.event ? {
                        ...reg.event,
                        date: reg.event.date.toISOString(),
                    } : null,
                })),
            },
        }));

        return { success: true, bookings: serializedBookings };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export type AccommodationExcelRow = {
    sNo: number;
    name: string;
    college: string;
    competitions: string;
    groupNames: string;
    phone: string;
    gender: string;
    email: string;
    bookingType: string;
};

function normalizePhone(phone: string): string {
    if (!phone || typeof phone !== "string") return "";
    return phone.replace(/\D/g, "").trim();
}

function formatCompetition(reg: { event?: { name?: string | null; Category?: { name?: string | null } | null } | null }): string {
    const event = reg?.event;
    if (!event) return "";
    const name = (event.name || "").trim();
    const cat = event.Category?.name?.trim();
    if (!name && !cat) return "";
    if (cat && name) return `${cat} - ${name}`;
    return name || cat || "";
}

/**
 * Get accommodation booking data formatted for Excel export.
 * Boys and girls in separate arrays. Same participant merged into one row with competitions comma-separated.
 */
export async function getAccommodationExcelData(): Promise<{
    success: boolean;
    boys?: AccommodationExcelRow[];
    girls?: AccommodationExcelRow[];
    error?: string;
}> {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            return { success: false, error: "Unauthorized" };
        }

        const result = await getAllBookings();
        if (!result.success || !result.bookings) {
            return { success: false, error: result.error || "Failed to load bookings" };
        }

        const bookings = result.bookings.filter(
            (b: any) => b.status === "PENDING" || b.status === "CONFIRMED"
        );

        const userIds = [...new Set(bookings.map((b: any) => b.userId))];

        // Fetch physical competitions (PENDING + APPROVED, isVirtual: false) for primary users
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
                    paymentStatus: { in: ["PENDING", "APPROVED"] },
                    isVirtual: false,
                },
                select: {
                    userId: true,
                    groupName: true,
                    members: true,
                    user: { select: { phone: true } },
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
        const groupNamesByUser = new Map<string, Set<string>>();
        const competitionsByPhone = new Map<string, Set<string>>();
        const groupNamesByPhone = new Map<string, Set<string>>();

        const addComp = (uid: string, label: string) => {
            if (!label.trim()) return;
            const set = competitionsByUser.get(uid) || new Set<string>();
            set.add(label.trim());
            competitionsByUser.set(uid, set);
        };
        const addGroupName = (uid: string, gn: string) => {
            if (!gn?.trim()) return;
            const set = groupNamesByUser.get(uid) || new Set<string>();
            set.add(gn.trim());
            groupNamesByUser.set(uid, set);
        };
        const addCompByPhone = (phoneNorm: string, label: string) => {
            if (!phoneNorm || !label.trim()) return;
            const set = competitionsByPhone.get(phoneNorm) || new Set<string>();
            set.add(label.trim());
            competitionsByPhone.set(phoneNorm, set);
        };
        const addGroupNameByPhone = (phoneNorm: string, gn: string) => {
            if (!phoneNorm || !gn?.trim()) return;
            const set = groupNamesByPhone.get(phoneNorm) || new Set<string>();
            set.add(gn.trim());
            groupNamesByPhone.set(phoneNorm, set);
        };

        individualRegs.forEach((r) => addComp(r.userId, formatCompetition(r)));
        groupRegs.forEach((r) => {
            const compLabel = formatCompetition(r);
            const groupName = (r.groupName || "").trim();
            addComp(r.userId, compLabel);
            if (groupName) addGroupName(r.userId, groupName);

            const leadPhoneNorm = normalizePhone((r.user as { phone?: string })?.phone || "");
            if (leadPhoneNorm) {
                addCompByPhone(leadPhoneNorm, compLabel);
                if (groupName) addGroupNameByPhone(leadPhoneNorm, groupName);
            }

            const members = r.members as unknown;
            const arr = Array.isArray(members) ? members : (members && typeof members === "object" ? Object.values(members as Record<string, unknown>) : []);
            for (const m of arr) {
                const member = m as { name?: string; phone?: string };
                const phone = (member?.phone || "").trim();
                const phoneNorm = normalizePhone(phone);
                if (!phoneNorm) continue;
                addCompByPhone(phoneNorm, compLabel);
                if (groupName) addGroupNameByPhone(phoneNorm, groupName);
            }
        });

        const personByKey = new Map<string, AccommodationExcelRow>();

        const addOrMerge = (
            key: string,
            name: string,
            college: string,
            comps: string[],
            groupNames: string[],
            phone: string,
            gender: string,
            email: string,
            bookingType: string
        ) => {
            const existing = personByKey.get(key);
            const compList = comps.filter(Boolean);
            const groupList = groupNames.filter(Boolean);
            if (existing) {
                const existingComps = existing.competitions && existing.competitions !== "—"
                    ? existing.competitions.split(", ").filter(Boolean)
                    : [];
                const existingGroups = existing.groupNames && existing.groupNames !== "—"
                    ? existing.groupNames.split(", ").filter(Boolean)
                    : [];
                const mergedComps = [...new Set([...existingComps, ...compList])];
                const mergedGroups = [...new Set([...existingGroups, ...groupList])];
                existing.competitions = mergedComps.length > 0 ? mergedComps.join(", ") : (existing.competitions || "—");
                existing.groupNames = mergedGroups.length > 0 ? mergedGroups.join(", ") : (existing.groupNames || "—");
                if (phone && phone !== "—") existing.phone = phone;
                if (email && email !== "—") existing.email = email;
            } else {
                personByKey.set(key, {
                    sNo: 0,
                    name: name || "—",
                    college: college || "—",
                    competitions: compList.length > 0 ? compList.join(", ") : "—",
                    groupNames: groupList.length > 0 ? groupList.join(", ") : "—",
                    phone: phone || "—",
                    gender,
                    email: email || "—",
                    bookingType,
                });
            }
        };

        for (const b of bookings) {
            const college = (b.user?.collage || "Unknown").trim() || "Unknown";
            const gender = (b.gender || "MALE") as string;
            const bookingType = b.bookingType || "INDIVIDUAL";

            const userComps = Array.from(competitionsByUser.get(b.userId) || []);
            const userGroups = Array.from(groupNamesByUser.get(b.userId) || []);

            const primaryPhone = (b.primaryPhone || b.user?.phone || "").trim();
            const primaryPhoneNorm = normalizePhone(primaryPhone);
            const primaryEmail = (b.primaryEmail || b.user?.email || "").trim().toLowerCase();
            const primaryName = (b.primaryName || b.user?.name || "").trim() || "—";

            const key = primaryPhoneNorm
                ? `${gender}:phone:${primaryPhoneNorm}`
                : primaryEmail
                    ? `${gender}:email:${primaryEmail}`
                    : `${gender}:unique:${b.id}:primary`;

            const primaryComps = primaryPhoneNorm
                ? [...userComps, ...Array.from(competitionsByPhone.get(primaryPhoneNorm) || [])]
                : userComps;
            const primaryGroups = primaryPhoneNorm
                ? [...userGroups, ...Array.from(groupNamesByPhone.get(primaryPhoneNorm) || [])]
                : userGroups;

            addOrMerge(
                key,
                primaryName,
                college,
                primaryComps,
                primaryGroups,
                primaryPhone || b.user?.phone || "",
                gender,
                b.primaryEmail || b.user?.email || "",
                bookingType
            );

            const groupMembers = Array.isArray(b.groupMembers) ? (b.groupMembers as { name?: string; phone?: string; email?: string }[]) : [];
            groupMembers.forEach((m, idx) => {
                const mName = (m.name || "").trim();
                const mPhone = (m.phone || "").trim();
                const mPhoneNorm = normalizePhone(mPhone);
                const mEmail = (m.email || "").trim().toLowerCase();
                if (!mName && !mPhone) return;

                const mComps = mPhoneNorm ? Array.from(competitionsByPhone.get(mPhoneNorm) || []) : [];
                const mGroups = mPhoneNorm ? Array.from(groupNamesByPhone.get(mPhoneNorm) || []) : [];

                const mKey = mPhoneNorm
                    ? `${gender}:phone:${mPhoneNorm}`
                    : mEmail
                        ? `${gender}:email:${mEmail}`
                        : `${gender}:unique:${b.id}:m${idx}`;

                addOrMerge(mKey, mName || "—", college, mComps, mGroups, mPhone, gender, m.email || "", bookingType);
            });
        }

        const boys = Array.from(personByKey.entries())
            .filter(([, r]) => r.gender === "MALE")
            .map(([, r]) => r);
        const girls = Array.from(personByKey.entries())
            .filter(([, r]) => r.gender === "FEMALE")
            .map(([, r]) => r);

        const sortFn = (a: AccommodationExcelRow, b: AccommodationExcelRow) => {
            const c = (a.college || "").localeCompare(b.college || "");
            if (c !== 0) return c;
            return (a.name || "").localeCompare(b.name || "");
        };
        boys.sort(sortFn);
        girls.sort(sortFn);

        boys.forEach((r, i) => { r.sNo = i + 1; });
        girls.forEach((r, i) => { r.sNo = i + 1; });

        return { success: true, boys, girls };
    } catch (error: any) {
        console.error("getAccommodationExcelData error:", error);
        return { success: false, error: error.message };
    }
}

export async function approveBooking(bookingId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        const passToken = generateAccommodationPassToken();

        const booking = await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
                paymentStatus: PaymentStatus.APPROVED,
                passToken,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        collage: true,
                        collageId: true,
                        individualRegistrations: {
                            where: { paymentStatus: "APPROVED" },
                            include: {
                                event: {
                                    select: {
                                        name: true,
                                        Category: { select: { name: true } },
                                    },
                                },
                            },
                        },
                        groupRegistrations: {
                            where: { paymentStatus: "APPROVED" },
                            include: {
                                event: {
                                    select: {
                                        name: true,
                                        Category: { select: { name: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const members = [
            { name: booking.primaryName, email: booking.primaryEmail, phone: booking.primaryPhone || "" },
            ...((booking.groupMembers as any[]) || []).map((m: any) => ({
                name: m.name || "Unknown",
                email: m.email || "",
                phone: m.phone || "",
            })),
        ];

        const individualEvents = (booking.user.individualRegistrations || []).map((r: any) => ({
            name: r.event?.name,
            category: r.event?.Category?.name,
        }));
        const groupEvents = (booking.user.groupRegistrations || []).map((r: any) => ({
            name: r.event?.name,
            category: r.event?.Category?.name,
        }));
        const competitions = [...individualEvents, ...groupEvents];

        const pdfData = {
            passToken,
            primaryName: booking.primaryName,
            primaryEmail: booking.primaryEmail,
            primaryPhone: booking.primaryPhone || "",
            collage: booking.user.collage,
            collageId: booking.user.collageId,
            gender: booking.gender,
            bookingType: booking.bookingType,
            members,
            competitions,
        };

        const pdfBuffer = await generateAccommodationPassPDF(pdfData);

        await sendAccommodationConfirmationEmail(
            { name: booking.user.name || booking.primaryName, email: booking.primaryEmail },
            {
                primaryName: booking.primaryName,
                primaryEmail: booking.primaryEmail,
                primaryPhone: booking.primaryPhone || "",
                bookingType: booking.bookingType,
                gender: booking.gender,
                totalMembers: booking.totalMembers,
                members,
                competitions,
            },
            pdfBuffer
        );

        return { success: true, message: "Booking approved successfully. Email sent with accommodation pass." };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectBooking(bookingId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CANCELLED,
                paymentStatus: PaymentStatus.REJECTED,
            },
        });

        return { success: true, message: "Booking rejected" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
            throw new Error("Unauthorized");
        }

        await prisma.accommodationBooking.update({
            where: { id: bookingId },
            data: { status },
        });

        return { success: true, message: "Booking status updated successfully" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
