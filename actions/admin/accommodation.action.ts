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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.RNC)) {
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

export type DayWiseExcelRow = {
    sNo: number;
    name: string;
    college: string;
    state: string;
    city: string;
    categoryNames: string;
    teamName: string;
    competitions: string;
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.RNC)) {
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

/**
 * Day-wise accommodation export: filter by selected March days (2-7).
 * Returns boys and girls as separate lists. Group members as individual rows with team name and category.
 */
export async function getAccommodationExcelDataByDays(selectedDays: number[]): Promise<{
    success: boolean;
    boys?: DayWiseExcelRow[];
    girls?: DayWiseExcelRow[];
    error?: string;
}> {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({ headers: headersList });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.RNC)) {
            return { success: false, error: "Unauthorized" };
        }

        if (!selectedDays || selectedDays.length === 0) {
            return { success: false, error: "Select at least one day" };
        }

        const validDays = selectedDays.filter((d) => d >= 2 && d <= 7);
        if (validDays.length === 0) {
            return { success: false, error: "Select days between 2 and 7" };
        }

        const year = 2026;
        const month = 2;
        const startOfFirst = new Date(year, month, Math.min(...validDays), 0, 0, 0, 0);
        const endOfLast = new Date(year, month, Math.max(...validDays), 23, 59, 59, 999);

        const eventsOnSelectedDays = await prisma.event.findMany({
            where: {
                date: { gte: startOfFirst, lte: endOfLast },
            },
            select: {
                id: true,
                name: true,
                date: true,
                Category: { select: { name: true } },
            },
        });

        const selectedDateStrs = new Set(validDays.map((d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`));
        const eventIds = eventsOnSelectedDays
            .filter((e) => {
                const d = new Date(e.date);
                const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
                return selectedDateStrs.has(dateStr);
            })
            .map((e) => e.id);

        if (eventIds.length === 0) {
            return { success: true, boys: [], girls: [] };
        }

        const [indivRegs, groupRegs] = await Promise.all([
            prisma.individualRegistration.findMany({
                where: {
                    eventId: { in: eventIds },
                    paymentStatus: { in: ["PENDING", "APPROVED"] },
                    isVirtual: false,
                },
                select: {
                    userId: true,
                    event: { select: { name: true, Category: { select: { name: true } } } },
                },
            }),
            prisma.groupRegistration.findMany({
                where: {
                    eventId: { in: eventIds },
                    paymentStatus: { in: ["PENDING", "APPROVED"] },
                    isVirtual: false,
                },
                select: {
                    userId: true,
                    groupName: true,
                    members: true,
                    user: { select: { phone: true } },
                    event: { select: { name: true, Category: { select: { name: true } } } },
                },
            }),
        ]);

        const userIdsWithPhysicalOnDays = new Set([
            ...indivRegs.map((r) => r.userId),
            ...groupRegs.map((r) => r.userId),
        ]);
        const phonesWithPhysicalOnDays = new Set<string>();
        groupRegs.forEach((r) => {
            const leadPhone = normalizePhone((r.user as { phone?: string })?.phone || "");
            if (leadPhone) phonesWithPhysicalOnDays.add(leadPhone);
            const members = (r.members as unknown) as { phone?: string }[];
            const arr = Array.isArray(members) ? members : [];
            arr.forEach((m) => {
                const mph = normalizePhone((m?.phone || "").trim());
                if (mph) phonesWithPhysicalOnDays.add(mph);
            });
        });

        const regsByUserId = new Map<string, { category: string; event: string; groupName?: string }[]>();
        const regsByPhone = new Map<string, { category: string; event: string; groupName?: string }[]>();
        const addReg = (uid: string, category: string, event: string, groupName?: string) => {
            const arr = regsByUserId.get(uid) || [];
            const label = `${category} - ${event}`;
            if (!arr.some((x) => x.category === category && x.event === event)) {
                arr.push({ category, event: label, groupName });
                regsByUserId.set(uid, arr);
            }
        };
        const addRegByPhone = (phoneNorm: string, category: string, event: string, groupName?: string) => {
            if (!phoneNorm) return;
            const arr = regsByPhone.get(phoneNorm) || [];
            const label = `${category} - ${event}`;
            if (!arr.some((x) => x.category === category && x.event === event)) {
                arr.push({ category, event: label, groupName });
                regsByPhone.set(phoneNorm, arr);
            }
        };
        indivRegs.forEach((r) => addReg(r.userId, r.event.Category.name, r.event.name));
        groupRegs.forEach((r) => {
            const cat = r.event.Category.name;
            const ev = r.event.name;
            const gn = (r.groupName || "").trim();
            addReg(r.userId, cat, ev, gn);
            const leadPhone = normalizePhone((r.user as { phone?: string })?.phone || "");
            if (leadPhone) addRegByPhone(leadPhone, cat, ev, gn);
            const members = (r.members as unknown) as { phone?: string }[];
            const arr = Array.isArray(members) ? members : [];
            arr.forEach((m) => {
                const mph = normalizePhone((m?.phone || "").trim());
                if (mph) addRegByPhone(mph, cat, ev, gn);
            });
        });

        const allBookings = await prisma.accommodationBooking.findMany({
            where: {
                status: { in: ["PENDING", "CONFIRMED"] },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        collage: true,
                        state: true,
                        city: true,
                    },
                },
            },
        });

        const bookings = allBookings.filter((b) => {
            if (userIdsWithPhysicalOnDays.has(b.userId)) return true;
            const primaryPhone = normalizePhone((b.primaryPhone || b.user?.phone || "").trim());
            if (primaryPhone && phonesWithPhysicalOnDays.has(primaryPhone)) return true;
            const groupMembers = Array.isArray(b.groupMembers) ? (b.groupMembers as { phone?: string }[]) : [];
            return groupMembers.some((m) => {
                const mph = normalizePhone((m?.phone || "").trim());
                return mph && phonesWithPhysicalOnDays.has(mph);
            });
        });

        const personByKey = new Map<string, DayWiseExcelRow>();

        const addOrUpdate = (
            key: string,
            name: string,
            college: string,
            state: string,
            city: string,
            categoryNames: string[],
            teamName: string,
            comps: string[],
            phone: string,
            gender: string,
            email: string,
            bookingType: string
        ) => {
            const catStr = [...new Set(categoryNames)].filter(Boolean).join(", ") || "—";
            const compStr = [...new Set(comps)].filter(Boolean).join(", ") || "—";

            const existing = personByKey.get(key);
            if (existing) {
                const mergedCats = [...new Set([...(existing.categoryNames || "—").split(", ").filter(Boolean), ...categoryNames])].join(", ");
                const mergedComps = [...new Set([...(existing.competitions || "—").split(", ").filter(Boolean), ...comps])].join(", ");
                const mergedTeams = [existing.teamName, teamName].filter(Boolean).join(", ");
                existing.categoryNames = mergedCats || "—";
                existing.competitions = mergedComps || "—";
                existing.teamName = mergedTeams || (existing.teamName || "—");
                if (state && state !== "—") existing.state = state;
                if (city && city !== "—") existing.city = city;
            } else {
                personByKey.set(key, {
                    sNo: 0,
                    name: name || "—",
                    college: college || "—",
                    state: state || "—",
                    city: city || "—",
                    categoryNames: catStr,
                    teamName: teamName || "—",
                    competitions: compStr,
                    phone: phone || "—",
                    gender,
                    email: email || "—",
                    bookingType,
                });
            }
        };

        for (const b of bookings) {
            const gender = (b.gender || "MALE") as string;
            const college = (b.user?.collage || "").trim() || "—";
            const state = (b.user?.state || "").trim() || "—";
            const city = (b.user?.city || "").trim() || "—";
            const primaryPhone = (b.primaryPhone || b.user?.phone || "").trim();
            const primaryPhoneNorm = normalizePhone(primaryPhone);
            const primaryEmail = (b.primaryEmail || b.user?.email || "").trim().toLowerCase();
            const primaryName = (b.primaryName || b.user?.name || "").trim() || "—";

            const userRegs = regsByUserId.get(b.userId) || [];
            const phoneRegs = primaryPhoneNorm ? (regsByPhone.get(primaryPhoneNorm) || []) : [];
            const allRegs = [...userRegs, ...phoneRegs];
            const categories = allRegs.map((r) => r.category);
            const comps = allRegs.map((r) => r.event);
            const teamNames = allRegs.map((r) => r.groupName).filter(Boolean);

            const key = primaryPhoneNorm
                ? `${gender}:phone:${primaryPhoneNorm}`
                : primaryEmail
                    ? `${gender}:email:${primaryEmail}`
                    : `${gender}:unique:${b.id}:p`;

            addOrUpdate(
                key,
                primaryName,
                college,
                state,
                city,
                categories,
                teamNames[0] || "",
                comps,
                primaryPhone || b.user?.phone || "",
                gender,
                b.primaryEmail || b.user?.email || "",
                b.bookingType || "INDIVIDUAL"
            );

            const groupMembers = Array.isArray(b.groupMembers) ? (b.groupMembers as { name?: string; phone?: string; email?: string }[]) : [];
            groupMembers.forEach((m, idx) => {
                const mName = (m.name || "").trim();
                const mPhone = (m.phone || "").trim();
                const mPhoneNorm = normalizePhone(mPhone);
                const mEmail = (m.email || "").trim().toLowerCase();
                if (!mName && !mPhone) return;

                const mRegs = mPhoneNorm ? (regsByPhone.get(mPhoneNorm) || []) : [];
                const mCats = mRegs.map((r) => r.category);
                const mComps = mRegs.map((r) => r.event);
                const mTeams = mRegs.map((r) => r.groupName).filter(Boolean);

                const mKey = mPhoneNorm
                    ? `${gender}:phone:${mPhoneNorm}`
                    : mEmail
                        ? `${gender}:email:${mEmail}`
                        : `${gender}:unique:${b.id}:m${idx}`;

                addOrUpdate(
                    mKey,
                    mName || "—",
                    college,
                    "—",
                    "—",
                    mCats,
                    mTeams[0] || "",
                    mComps,
                    mPhone,
                    gender,
                    m.email || "",
                    b.bookingType || "GROUP"
                );
            });
        }

        const boys = Array.from(personByKey.entries())
            .filter(([, r]) => r.gender === "MALE")
            .map(([, r]) => r);
        const girls = Array.from(personByKey.entries())
            .filter(([, r]) => r.gender === "FEMALE")
            .map(([, r]) => r);

        const sortFn = (a: DayWiseExcelRow, b: DayWiseExcelRow) => {
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
        console.error("getAccommodationExcelDataByDays error:", error);
        return { success: false, error: error.message };
    }
}

export async function approveBookingInternal(bookingId: string) {
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
}

export async function approveBooking(bookingId: string) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.RNC)) {
            throw new Error("Unauthorized");
        }

        await approveBookingInternal(bookingId);

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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.RNC)) {
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

        if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.RNC)) {
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
