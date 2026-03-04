"use client";

import { useCallback, useEffect, useState } from "react";
import {
    getUserStats,
    getEventStats,
    getAccommodationStats,
    getDetailedEventRegistrations,
    getDailyReportStats,
} from "@/actions/admin/analytics.action";
import { getAccommodationAnalytics } from "@/actions/admin/accommodation-analytics.action";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interfaces for analytics data
interface UserStats {
    total: number;
    approved: number;
    pending: number;
    paymentApproved: number;
    paymentPending: number;
    paymentRejected: number;
}

interface EventStats {
    totalEvents: number;
    categories: { name: string; eventCount: number }[];
    registrations: { name: string; count: number }[];
}

interface AccommodationStats {
    totalBookings: number;
    individualBookings: number;
    groupBookings: number;
    maleBookings: number;
    femaleBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalMembers: number;
}

interface RegistrationUser {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    collage: string | null;
    collageId: string | null;
    branch: string | null;
    year: number | null;
    state: string | null;
    city: string | null;
    country: string | null;
    isInternational: boolean | null;
    gender: string | null;
}

interface IndividualRegistration {
    id: string;
    isVirtual?: boolean | null;
    createdAt: Date;
    paymentStatus: string;
    user: RegistrationUser;
}

interface GroupRegistration {
    id: string;
    isVirtual?: boolean | null;
    groupName: string | null;
    mentorName: string | null;
    mentorPhone: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members?: any;
    createdAt: Date;
    paymentStatus: string;
    user: RegistrationUser;
}

interface DetailedEvent {
    id: string;
    name: string;
    category: string;
    isGroupEvent: boolean;
    totalRegistrations: number;
    individualCount: number;
    groupCount: number;
    individualRegistrations: IndividualRegistration[];
    groupRegistrations: GroupRegistration[];
}

interface AccommodationCollegeStat {
    name: string;
    bookings: number;
    male: number;
    female: number;
    guests: number;
}

interface AccommodationBookingItem {
    primaryName: string;
    totalMembers: number;
    gender: string;
    status: string;
    competitions?: string[];
    user?: {
        collage?: string | null;
    } | null;
}

function isKLUser(user: RegistrationUser): boolean {
    const email = user.email?.toLowerCase() || "";
    const collage = (user.collage || "").toLowerCase();
    return (
        email.endsWith("@kluniversity.in") ||
        collage.includes("kl university") ||
        collage.includes("koneru") ||
        collage.includes("klef")
    );
}

function withVirtualTag(name: string | null | undefined, isVirtual: boolean | null | undefined): string {
    const safeName = (name || "").trim();
    if (!isVirtual) return safeName;
    return safeName ? `${safeName} [VIRTUAL]` : "[VIRTUAL]";
}

function highlightVirtualNameCells(ws: XLSX.WorkSheet, headerName: string) {
    const ref = ws["!ref"];
    if (!ref) return;
    const range = XLSX.utils.decode_range(ref);

    let nameCol = -1;
    for (let col = range.s.c; col <= range.e.c; col++) {
        const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const headerValue = ws[headerAddress]?.v;
        if (String(headerValue ?? "").trim() === headerName) {
            nameCol = col;
            break;
        }
    }
    if (nameCol === -1) return;

    for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: nameCol });
        const cell = ws[cellAddress];
        if (!cell) continue;
        const value = String(cell.v ?? "");
        if (!value.includes("[VIRTUAL]")) continue;
        cell.s = {
            ...(cell.s || {}),
            fill: { fgColor: { rgb: "FFA500" } }, // Orange highlight for virtual participant names
            font: {
                ...(typeof cell.s === "object" && cell.s && "font" in cell.s ? (cell.s.font || {}) : {}),
                bold: true,
                color: { rgb: "000000" },
            },
        };
    }
}

function mergeCellsByHeaderAndSpans(
    ws: XLSX.WorkSheet,
    headerName: string,
    spans: Array<{ start: number; end: number }>
) {
    const ref = ws["!ref"];
    if (!ref) return;
    const range = XLSX.utils.decode_range(ref);

    let targetCol = -1;
    for (let col = range.s.c; col <= range.e.c; col++) {
        const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const headerValue = ws[headerAddress]?.v;
        if (String(headerValue ?? "").trim() === headerName) {
            targetCol = col;
            break;
        }
    }
    if (targetCol === -1) return;

    const merges = ws["!merges"] || [];
    for (const span of spans) {
        if (span.end <= span.start) continue;
        merges.push({
            s: { r: span.start + 1, c: targetCol }, // +1 for header row
            e: { r: span.end + 1, c: targetCol },
        });
    }
    ws["!merges"] = merges;
}

export default function AnalyticsPage() {
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [eventStats, setEventStats] = useState<EventStats | null>(null);
    const [accommodationStats, setAccommodationStats] = useState<AccommodationStats | null>(null);
    const [detailedEvents, setDetailedEvents] = useState<DetailedEvent[]>([]);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [activeReport, setActiveReport] = useState<"dailyPdf" | "dailyExcel" | "accommodationPdf" | null>(null);

    const loadStats = useCallback(async () => {

        const [userResult, eventResult, accommodationResult, detailedResult] = await Promise.all([
            getUserStats(),
            getEventStats(),
            getAccommodationStats(),
            getDetailedEventRegistrations(),
        ]);

        if (userResult.success && userResult.stats) {
            setUserStats(userResult.stats);
        } else {
            toast.error("Failed to load user stats");
        }

        if (eventResult.success && eventResult.stats) {
            setEventStats(eventResult.stats);
        } else {
            toast.error("Failed to load event stats");
        }

        if (accommodationResult.success && accommodationResult.stats) {
            setAccommodationStats(accommodationResult.stats);
        } else {
            toast.error("Failed to load accommodation stats");
        }

        if (detailedResult.success && detailedResult.events) {
            setDetailedEvents(detailedResult.events);
        } else {
            toast.error("Failed to load detailed registrations");
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    const downloadEventRegistrations = (event: DetailedEvent) => {
        try {
            // Prepare Individual Registrations Data
            const individualData: Record<string, string | number>[] = [];
            event.individualRegistrations.forEach((reg) => {
                individualData.push({
                    "Name": withVirtualTag(reg.user.name, reg.isVirtual),
                    "Email": reg.user.email || "",
                    "Phone": reg.user.phone || "",
                    "Participation Mode": reg.isVirtual ? "Virtual" : "Physical",
                    "Gender": reg.user.gender || "",
                    "College": reg.user.collage || "",
                    "College ID": reg.user.collageId || "",
                    "Branch": reg.user.branch || "",
                    "Year": reg.user.year || "",
                    "City": reg.user.city || "",
                    "State": reg.user.state || "",
                    "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                });
            });


            // Prepare Group Registrations Data
            const groupData: Record<string, string | number>[] = [];
            const groupNameMergeSpans: Array<{ start: number; end: number }> = [];
            let groupDataRowIndex = 0;
            event.groupRegistrations.forEach((reg) => {
                const rawMembers = reg.members;
                const membersList = Array.isArray(rawMembers)
                    ? rawMembers
                    : rawMembers && typeof rawMembers === "object"
                        ? Object.values(rawMembers as Record<string, unknown>)
                        : [];
                const teamSize = membersList.length + 1;
                const groupStart = groupDataRowIndex;

                // Team lead row
                groupData.push({
                    "Group Name": reg.groupName || "",
                    "Member Name": withVirtualTag(reg.user.name, reg.isVirtual),
                    "Email": reg.user.email || "",
                    "Phone": reg.user.phone || "",
                    "Participation Mode": reg.isVirtual ? "Virtual" : "Physical",
                    "Gender": reg.user.gender || "",
                    "Team Size": teamSize,
                    "Mentor": reg.mentorName || "—",
                    "Mentor Phone": reg.mentorPhone || "—",
                    "College": reg.user.collage || "",
                    "College ID": reg.user.collageId || "",
                    "City": reg.user.city || "",
                    "State": reg.user.state || "",
                    "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                });
                groupDataRowIndex += 1;

                // Team member rows: fallback to team lead details if member fields are missing.
                membersList.forEach((member) => {
                    const memberData = (member && typeof member === "object")
                        ? (member as Record<string, unknown>)
                        : {};
                    groupData.push({
                        "Group Name": reg.groupName || "",
                        "Member Name": withVirtualTag(
                            (memberData.name as string | undefined) || reg.user.name,
                            reg.isVirtual
                        ),
                        "Email": (memberData.email as string | undefined) || reg.user.email || "",
                        "Phone": (memberData.phone as string | undefined) || reg.user.phone || "",
                        "Participation Mode": reg.isVirtual ? "Virtual" : "Physical",
                        "Gender": (memberData.gender as string | undefined) || reg.user.gender || "",
                        "Team Size": teamSize,
                        "Mentor": reg.mentorName || "—",
                        "Mentor Phone": reg.mentorPhone || "—",
                        "College": reg.user.collage || "",
                        "College ID": reg.user.collageId || "",
                        "City": reg.user.city || "",
                        "State": reg.user.state || "",
                        "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                    });
                    groupDataRowIndex += 1;
                });

                groupNameMergeSpans.push({ start: groupStart, end: groupDataRowIndex - 1 });
            });

            if (individualData.length === 0 && groupData.length === 0) {
                toast.error("No registrations to download");
                return;
            }

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Add Individual Registrations sheet
            if (individualData.length > 0) {
                const ws1 = XLSX.utils.json_to_sheet(individualData);
                
                // Set column widths
                ws1['!cols'] = [
                    { wch: 20 }, // Name
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
                    { wch: 18 }, // Participation Mode
                    { wch: 10 }, // Gender
                    { wch: 35 }, // College
                    { wch: 18 }, // College ID
                    { wch: 20 }, // Branch
                    { wch: 10 }, // Year
                    { wch: 18 }, // City
                    { wch: 18 }, // State
                    { wch: 18 }, // Country
                ];

                // Add auto-filter
                const ref = XLSX.utils.decode_range(ws1['!ref'] || 'A1');
                ws1['!autofilter'] = { ref: XLSX.utils.encode_range(ref) };

                // Style header row with sky blue background
                const headerRange = XLSX.utils.decode_range(ws1['!ref'] || 'A1');
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!ws1[cellAddress]) continue;
                    ws1[cellAddress].s = {
                        fill: { fgColor: { rgb: "87CEEB" } }, // Sky blue
                        font: { bold: true, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                highlightVirtualNameCells(ws1, "Name");

                XLSX.utils.book_append_sheet(wb, ws1, "Individual");
            }

            // Add Group Registrations sheet
            if (groupData.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(groupData);
                
                // Set column widths
                ws2['!cols'] = [
                    { wch: 25 }, // Group Name
                    { wch: 24 }, // Member Name
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
                    { wch: 18 }, // Participation Mode
                    { wch: 10 }, // Gender
                    { wch: 12 }, // Team Size
                    { wch: 20 }, // Mentor
                    { wch: 15 }, // Mentor Phone
                    { wch: 35 }, // College
                    { wch: 18 }, // College ID
                    { wch: 18 }, // City
                    { wch: 18 }, // State
                    { wch: 18 }, // Country
                ];

                // Add auto-filter
                const ref = XLSX.utils.decode_range(ws2['!ref'] || 'A1');
                ws2['!autofilter'] = { ref: XLSX.utils.encode_range(ref) };

                // Style header row with sky blue background
                const headerRange = XLSX.utils.decode_range(ws2['!ref'] || 'A1');
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!ws2[cellAddress]) continue;
                    ws2[cellAddress].s = {
                        fill: { fgColor: { rgb: "87CEEB" } }, // Sky blue
                        font: { bold: true, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                highlightVirtualNameCells(ws2, "Member Name");
                mergeCellsByHeaderAndSpans(ws2, "Group Name", groupNameMergeSpans);

                XLSX.utils.book_append_sheet(wb, ws2, "Group");
            }

            // Generate filename
            const filename = `${event.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);
            toast.success("Registration data downloaded successfully");
        } catch (error) {
            console.error("Error downloading registrations:", error);
            toast.error("Failed to download registrations");
        }
    };

    const downloadAllRegistrations = () => {
        try {
            // Prepare Individual Registrations Data (from ALL events)
            const individualData: Record<string, string | number>[] = [];
            detailedEvents.forEach(event => {
                event.individualRegistrations.forEach((reg) => {
                    individualData.push({
                        "Event": event.name,
                        "Category": event.category,
                        "Name": withVirtualTag(reg.user.name, reg.isVirtual),
                        "Email": reg.user.email || "",
                        "Phone": reg.user.phone || "",
                        "Participation Mode": reg.isVirtual ? "Virtual" : "Physical",
                        "Gender": reg.user.gender || "",
                        "College": reg.user.collage || "",
                        "College ID": reg.user.collageId || "",
                        "Branch": reg.user.branch || "",
                        "Year": reg.user.year || "",
                        "City": reg.user.city || "",
                        "State": reg.user.state || "",
                        "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                    });
                });
            });

            // Prepare Group Registrations Data (from ALL events)
            const groupData: Record<string, string | number>[] = [];
            const groupNameMergeSpans: Array<{ start: number; end: number }> = [];
            let groupDataRowIndex = 0;
            detailedEvents.forEach(event => {
                event.groupRegistrations.forEach((reg) => {
                    const rawMembers = reg.members;
                    const membersList = Array.isArray(rawMembers)
                        ? rawMembers
                        : rawMembers && typeof rawMembers === "object"
                            ? Object.values(rawMembers as Record<string, unknown>)
                            : [];
                    const teamSize = membersList.length + 1;
                    const groupStart = groupDataRowIndex;

                    // Team lead row
                    groupData.push({
                        "Event": event.name,
                        "Category": event.category,
                        "Group Name": reg.groupName || "",
                        "Member Name": withVirtualTag(reg.user.name, reg.isVirtual),
                        "Email": reg.user.email || "",
                        "Phone": reg.user.phone || "",
                        "Participation Mode": reg.isVirtual ? "Virtual" : "Physical",
                        "Gender": reg.user.gender || "",
                        "Team Size": teamSize,
                        "Mentor": reg.mentorName || "—",
                        "Mentor Phone": reg.mentorPhone || "—",
                        "College": reg.user.collage || "",
                        "College ID": reg.user.collageId || "",
                        "City": reg.user.city || "",
                        "State": reg.user.state || "",
                        "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                    });
                    groupDataRowIndex += 1;

                    // Team member rows: fallback to team lead details if member fields are missing.
                    membersList.forEach((member) => {
                        const memberData = (member && typeof member === "object")
                            ? (member as Record<string, unknown>)
                            : {};
                        groupData.push({
                            "Event": event.name,
                            "Category": event.category,
                            "Group Name": reg.groupName || "",
                            "Member Name": withVirtualTag(
                                (memberData.name as string | undefined) || reg.user.name,
                                reg.isVirtual
                            ),
                            "Email": (memberData.email as string | undefined) || reg.user.email || "",
                            "Phone": (memberData.phone as string | undefined) || reg.user.phone || "",
                            "Participation Mode": reg.isVirtual ? "Virtual" : "Physical",
                            "Gender": (memberData.gender as string | undefined) || reg.user.gender || "",
                            "Team Size": teamSize,
                            "Mentor": reg.mentorName || "—",
                            "Mentor Phone": reg.mentorPhone || "—",
                            "College": reg.user.collage || "",
                            "College ID": reg.user.collageId || "",
                            "City": reg.user.city || "",
                            "State": reg.user.state || "",
                            "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                        });
                        groupDataRowIndex += 1;
                    });

                    groupNameMergeSpans.push({ start: groupStart, end: groupDataRowIndex - 1 });
                });
            });

            if (individualData.length === 0 && groupData.length === 0) {
                toast.error("No registrations to download");
                return;
            }

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Add Individual Registrations sheet
            if (individualData.length > 0) {
                const ws1 = XLSX.utils.json_to_sheet(individualData);
                
                // Set column widths
                ws1['!cols'] = [
                    { wch: 22 }, // Event
                    { wch: 18 }, // Category
                    { wch: 20 }, // Name
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
                    { wch: 18 }, // Participation Mode
                    { wch: 10 }, // Gender
                    { wch: 35 }, // College
                    { wch: 18 }, // College ID
                    { wch: 20 }, // Branch
                    { wch: 10 }, // Year
                    { wch: 18 }, // City
                    { wch: 18 }, // State
                    { wch: 18 }, // Country
                ];

                // Add auto-filter
                const ref = XLSX.utils.decode_range(ws1['!ref'] || 'A1');
                ws1['!autofilter'] = { ref: XLSX.utils.encode_range(ref) };

                // Style header row with sky blue background
                const headerRange = XLSX.utils.decode_range(ws1['!ref'] || 'A1');
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!ws1[cellAddress]) continue;
                    ws1[cellAddress].s = {
                        fill: { fgColor: { rgb: "87CEEB" } }, // Sky blue
                        font: { bold: true, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                highlightVirtualNameCells(ws1, "Name");

                XLSX.utils.book_append_sheet(wb, ws1, "Individual");
            }

            // Add Group Registrations sheet
            if (groupData.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(groupData);
                
                // Set column widths
                ws2['!cols'] = [
                    { wch: 22 }, // Event
                    { wch: 18 }, // Category
                    { wch: 25 }, // Group Name
                    { wch: 24 }, // Member Name
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
                    { wch: 18 }, // Participation Mode
                    { wch: 10 }, // Gender
                    { wch: 12 }, // Team Size
                    { wch: 20 }, // Mentor
                    { wch: 15 }, // Mentor Phone
                    { wch: 35 }, // College
                    { wch: 18 }, // College ID
                    { wch: 18 }, // City
                    { wch: 18 }, // State
                    { wch: 18 }, // Country
                ];

                // Add auto-filter
                const ref = XLSX.utils.decode_range(ws2['!ref'] || 'A1');
                ws2['!autofilter'] = { ref: XLSX.utils.encode_range(ref) };

                // Style header row with sky blue background
                const headerRange = XLSX.utils.decode_range(ws2['!ref'] || 'A1');
                for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!ws2[cellAddress]) continue;
                    ws2[cellAddress].s = {
                        fill: { fgColor: { rgb: "87CEEB" } }, // Sky blue
                        font: { bold: true, color: { rgb: "000000" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
                highlightVirtualNameCells(ws2, "Member Name");
                mergeCellsByHeaderAndSpans(ws2, "Group Name", groupNameMergeSpans);

                XLSX.utils.book_append_sheet(wb, ws2, "Group");
            }

            // Generate filename
            const filename = `All_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);
            toast.success("All registration data downloaded successfully");
        } catch (error) {
            console.error("Error downloading all registrations:", error);
            toast.error("Failed to download all registrations");
        }
    };

    const generateDailyReport = async () => {
        try {
            setReportLoading(true);
            setActiveReport("dailyPdf");
            const result = await getDailyReportStats();
            if (!result.success || !result.data) {
                toast.error("Failed to fetch daily report data");
                return;
            }

            const doc = new jsPDF("l", "mm", "a4");
            const timestamp = new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }).toUpperCase();
            const reportData = result.data;

            interface DailyReportItem {
                eventId: string;
                eventName: string;
                eventDate: string;
                categoryName: string;
                isGroupEvent: boolean;
                participants: { kl: number; other: number; total: number };
                teams: { kl: number; other: number; total: number };
                virtualParticipants: number;
                physicalParticipants: number;
                totalParticipants: number;
            }
            const typedReportData = reportData as DailyReportItem[];
            const formatEventDate = (dateInput: string) => {
                const d = new Date(dateInput);
                if (Number.isNaN(d.getTime())) return "-";
                return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
            };
            const sortByDateThenTop = (a: DailyReportItem, b: DailyReportItem) => {
                const ta = new Date(a.eventDate).getTime();
                const tb = new Date(b.eventDate).getTime();
                if (ta !== tb) return ta - tb;
                if (b.totalParticipants !== a.totalParticipants) return b.totalParticipants - a.totalParticipants;
                return a.eventName.localeCompare(b.eventName);
            };
            const overallVirtualParticipants = typedReportData.reduce((acc, item) => acc + item.virtualParticipants, 0);
            const overallPhysicalParticipants = typedReportData.reduce((acc, item) => acc + item.physicalParticipants, 0);

            const summary = {
                totalParticipants: 0,
                overallOther: 0,
                overallKl: 0,
                overallMale: 0,
                overallFemale: 0,
                individualTotal: 0,
                individualOther: 0,
                individualKl: 0,
                individualMale: 0,
                individualFemale: 0,
                teamTotalTeams: 0,
                teamOtherTeams: 0,
                teamKlTeams: 0,
                teamOtherParticipants: 0,
                teamKlParticipants: 0,
                teamTotalParticipants: 0,
                teamMale: 0,
                teamFemale: 0,
            };

            detailedEvents.forEach((event) => {
                event.individualRegistrations.forEach((reg) => {
                    const isKL = isKLUser(reg.user);
                    const gender = (reg.user.gender || "").toUpperCase();
                    summary.individualTotal += 1;
                    summary.totalParticipants += 1;
                    if (isKL) summary.individualKl += 1;
                    else summary.individualOther += 1;
                    if (isKL) summary.overallKl += 1;
                    else summary.overallOther += 1;
                    if (gender === "MALE") {
                        summary.individualMale += 1;
                        summary.overallMale += 1;
                    } else if (gender === "FEMALE") {
                        summary.individualFemale += 1;
                        summary.overallFemale += 1;
                    }
                });

                event.groupRegistrations.forEach((reg) => {
                    const isKL = isKLUser(reg.user);
                    const leadGender = (reg.user.gender || "").toUpperCase();
                    summary.teamTotalTeams += 1;
                    if (isKL) summary.teamKlTeams += 1;
                    else summary.teamOtherTeams += 1;

                    // Team lead is one participant
                    summary.teamTotalParticipants += 1;
                    summary.totalParticipants += 1;
                    if (isKL) {
                        summary.teamKlParticipants += 1;
                        summary.overallKl += 1;
                    } else {
                        summary.teamOtherParticipants += 1;
                        summary.overallOther += 1;
                    }
                    if (leadGender === "MALE") {
                        summary.teamMale += 1;
                        summary.overallMale += 1;
                    } else if (leadGender === "FEMALE") {
                        summary.teamFemale += 1;
                        summary.overallFemale += 1;
                    }

                    const membersValue = reg.members;
                    let membersList: Array<{ gender?: string }> = [];
                    if (Array.isArray(membersValue)) {
                        membersList = membersValue as Array<{ gender?: string }>;
                    } else if (membersValue && typeof membersValue === "object") {
                        membersList = Object.values(membersValue as Record<string, { gender?: string }>);
                    }

                    membersList.forEach((member) => {
                        const memberGender = (member?.gender || "").toUpperCase();
                        summary.teamTotalParticipants += 1;
                        summary.totalParticipants += 1;
                        if (isKL) {
                            summary.teamKlParticipants += 1;
                            summary.overallKl += 1;
                        } else {
                            summary.teamOtherParticipants += 1;
                            summary.overallOther += 1;
                        }
                        if (memberGender === "MALE") {
                            summary.teamMale += 1;
                            summary.overallMale += 1;
                        } else if (memberGender === "FEMALE") {
                            summary.teamFemale += 1;
                            summary.overallFemale += 1;
                        }
                    });
                });
            });

            // Single report grouped by Category -> Competition (no separate KL/Other pages)
            doc.setFontSize(16);
            doc.text("Daily Registration Report - Category Wise", 14, 15);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185); // Highlight color
            doc.text(`Generated on: ${timestamp}`, 14, 22);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0); // Reset color
            doc.setFontSize(8);
            doc.text(`Note: Counts represent total participants (including group members).`, 14, 26);
            let currentY = 32;

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Summary at a Glance", 14, currentY);
            currentY += 3;

            autoTable(doc, {
                startY: currentY,
                head: [["TOTAL PARTICIPANTS", String(summary.totalParticipants)]],
                body: [
                    ["Other Colleges", String(summary.overallOther)],
                    ["KL University", String(summary.overallKl)],
                    ["Male", String(summary.overallMale)],
                    ["Female", String(summary.overallFemale)],
                    ["Virtual Participants", String(overallVirtualParticipants)],
                    ["Physical Participants", String(overallPhysicalParticipants)],
                ],
                theme: "grid",
                headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 9, cellPadding: 2.5, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
                columnStyles: { 1: { halign: "right" } },
            });
            currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 4;

            autoTable(doc, {
                startY: currentY,
                head: [["INDIVIDUAL REGISTRATIONS", String(summary.individualTotal)]],
                body: [
                    ["Other Colleges", String(summary.individualOther)],
                    ["KL University", String(summary.individualKl)],
                    ["Male", String(summary.individualMale)],
                    ["Female", String(summary.individualFemale)],
                ],
                theme: "grid",
                headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 9, cellPadding: 2.5, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
                columnStyles: { 1: { halign: "right" } },
            });
            currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 4;

            autoTable(doc, {
                startY: currentY,
                head: [["TEAM REGISTRATIONS", String(summary.teamTotalTeams)]],
                body: [
                    ["Total Participants", String(summary.teamTotalParticipants)],
                    ["Other College Teams", String(summary.teamOtherTeams)],
                    ["KL Teams", String(summary.teamKlTeams)],
                    ["Participants (Other College)", String(summary.teamOtherParticipants)],
                    ["Participants (KL University)", String(summary.teamKlParticipants)],
                    ["Male", String(summary.teamMale)],
                    ["Female", String(summary.teamFemale)],
                ],
                theme: "grid",
                headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 9, cellPadding: 2.5, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
                columnStyles: { 1: { halign: "right" } },
            });
            currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 8;

            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }

            const groupedByCategory = typedReportData.reduce<Record<string, DailyReportItem[]>>((acc, item: DailyReportItem) => {
                if (!acc[item.categoryName]) acc[item.categoryName] = [];
                acc[item.categoryName].push(item);
                return acc;
            }, {});
            const categoryNames = Object.keys(groupedByCategory).sort((a, b) => a.localeCompare(b));

            categoryNames.forEach((categoryName, index) => {
                const items = groupedByCategory[categoryName].sort(sortByDateThenTop);
                const soloItems = items.filter((item) => !item.isGroupEvent);
                const groupItems = items.filter((item) => item.isGroupEvent);

                if (currentY > 250 || (index > 0 && currentY > 230)) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(33, 33, 33);
                doc.text(`Category: ${categoryName}`, 14, currentY);
                currentY += 5;

                if (soloItems.length > 0) {
                    if (currentY > 245) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.text("Solo Competitions (Total Members)", 14, currentY);
                    currentY += 2;

                    const soloRows = soloItems.map((item: DailyReportItem) => [
                        item.eventName,
                        formatEventDate(item.eventDate),
                        String(item.participants.total),
                        String(item.participants.kl),
                        String(item.participants.other),
                        String(item.virtualParticipants),
                        String(item.physicalParticipants),
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [[
                            "Competition",
                            "Event Date",
                            "Total Members",
                            "KL Participants",
                            "Other Participants",
                            "Virtual Participants",
                            "Physical Participants",
                        ]],
                        body: soloRows,
                        theme: "grid",
                        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, fontStyle: "bold" },
                        styles: { fontSize: 8, cellPadding: 2.2, fontStyle: "bold" },
                        margin: { left: 14, right: 14 },
                    });

                    currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 6;
                }

                if (groupItems.length > 0) {
                    if (currentY > 245) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    doc.text("Group Competitions (Teams + Participants)", 14, currentY);
                    currentY += 2;

                    const groupRows = groupItems.map((item: DailyReportItem) => [
                        item.eventName,
                        formatEventDate(item.eventDate),
                        String(item.teams.total),
                        String(item.virtualParticipants),
                        String(item.physicalParticipants),
                        String(item.totalParticipants),
                        `${item.teams.total} teams = ${item.totalParticipants} participants`,
                    ]);

                    autoTable(doc, {
                        startY: currentY,
                        head: [[
                            "Competition",
                            "Event Date",
                            "Total Teams",
                            "Virtual Participants",
                            "Physical Participants",
                            "Total Participants",
                            "Total Teams = Total Participants",
                        ]],
                        body: groupRows,
                        theme: "grid",
                        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, fontStyle: "bold" },
                        styles: { fontSize: 8, cellPadding: 2.2, fontStyle: "bold" },
                        margin: { left: 14, right: 14 },
                    });

                    currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 8;
                }
            });

            doc.save(`Daily_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("Daily report generated successfully");

        } catch (error) {
            console.error("Error generating daily report:", error);
            toast.error("Failed to generate report");
        } finally {
            setReportLoading(false);
            setActiveReport(null);
        }
    };

    const downloadDailyReportExcel = async () => {
        try {
            setReportLoading(true);
            setActiveReport("dailyExcel");
            const result = await getDailyReportStats();
            if (!result.success || !result.data) {
                toast.error("Failed to fetch daily report data");
                return;
            }

            interface DailyReportItem {
                eventId: string;
                eventName: string;
                eventDate: string;
                categoryName: string;
                isGroupEvent: boolean;
                participants: { kl: number; other: number; total: number };
                teams: { kl: number; other: number; total: number };
                virtualParticipants: number;
                physicalParticipants: number;
                totalParticipants: number;
            }

            const typedReportData = result.data as DailyReportItem[];
            const formatEventDate = (dateInput: string) => {
                const d = new Date(dateInput);
                if (Number.isNaN(d.getTime())) return "-";
                return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
            };
            const sortByDateThenTop = (a: DailyReportItem, b: DailyReportItem) => {
                const ta = new Date(a.eventDate).getTime();
                const tb = new Date(b.eventDate).getTime();
                if (ta !== tb) return ta - tb;
                if (b.totalParticipants !== a.totalParticipants) return b.totalParticipants - a.totalParticipants;
                return a.eventName.localeCompare(b.eventName);
            };
            const overallVirtualParticipants = typedReportData.reduce((acc, item) => acc + item.virtualParticipants, 0);
            const overallPhysicalParticipants = typedReportData.reduce((acc, item) => acc + item.physicalParticipants, 0);

            const summary = {
                totalParticipants: 0,
                overallOther: 0,
                overallKl: 0,
                overallMale: 0,
                overallFemale: 0,
                individualTotal: 0,
                individualOther: 0,
                individualKl: 0,
                individualMale: 0,
                individualFemale: 0,
                teamTotalTeams: 0,
                teamOtherTeams: 0,
                teamKlTeams: 0,
                teamOtherParticipants: 0,
                teamKlParticipants: 0,
                teamTotalParticipants: 0,
                teamMale: 0,
                teamFemale: 0,
            };

            detailedEvents.forEach((event) => {
                event.individualRegistrations.forEach((reg) => {
                    const isKL = isKLUser(reg.user);
                    const gender = (reg.user.gender || "").toUpperCase();
                    summary.individualTotal += 1;
                    summary.totalParticipants += 1;
                    if (isKL) summary.individualKl += 1;
                    else summary.individualOther += 1;
                    if (isKL) summary.overallKl += 1;
                    else summary.overallOther += 1;
                    if (gender === "MALE") {
                        summary.individualMale += 1;
                        summary.overallMale += 1;
                    } else if (gender === "FEMALE") {
                        summary.individualFemale += 1;
                        summary.overallFemale += 1;
                    }
                });

                event.groupRegistrations.forEach((reg) => {
                    const isKL = isKLUser(reg.user);
                    const leadGender = (reg.user.gender || "").toUpperCase();
                    summary.teamTotalTeams += 1;
                    if (isKL) summary.teamKlTeams += 1;
                    else summary.teamOtherTeams += 1;

                    summary.teamTotalParticipants += 1;
                    summary.totalParticipants += 1;
                    if (isKL) {
                        summary.teamKlParticipants += 1;
                        summary.overallKl += 1;
                    } else {
                        summary.teamOtherParticipants += 1;
                        summary.overallOther += 1;
                    }
                    if (leadGender === "MALE") {
                        summary.teamMale += 1;
                        summary.overallMale += 1;
                    } else if (leadGender === "FEMALE") {
                        summary.teamFemale += 1;
                        summary.overallFemale += 1;
                    }

                    const membersValue = reg.members;
                    let membersList: Array<{ gender?: string }> = [];
                    if (Array.isArray(membersValue)) {
                        membersList = membersValue as Array<{ gender?: string }>;
                    } else if (membersValue && typeof membersValue === "object") {
                        membersList = Object.values(membersValue as Record<string, { gender?: string }>);
                    }

                    membersList.forEach((member) => {
                        const memberGender = (member?.gender || "").toUpperCase();
                        summary.teamTotalParticipants += 1;
                        summary.totalParticipants += 1;
                        if (isKL) {
                            summary.teamKlParticipants += 1;
                            summary.overallKl += 1;
                        } else {
                            summary.teamOtherParticipants += 1;
                            summary.overallOther += 1;
                        }
                        if (memberGender === "MALE") {
                            summary.teamMale += 1;
                            summary.overallMale += 1;
                        } else if (memberGender === "FEMALE") {
                            summary.teamFemale += 1;
                            summary.overallFemale += 1;
                        }
                    });
                });
            });

            const summarySheet = [
                { Section: "TOTAL PARTICIPANTS", Metric: "Total Participants", Value: summary.totalParticipants },
                { Section: "TOTAL PARTICIPANTS", Metric: "Other Colleges", Value: summary.overallOther },
                { Section: "TOTAL PARTICIPANTS", Metric: "KL University", Value: summary.overallKl },
                { Section: "TOTAL PARTICIPANTS", Metric: "Male", Value: summary.overallMale },
                { Section: "TOTAL PARTICIPANTS", Metric: "Female", Value: summary.overallFemale },
                { Section: "TOTAL PARTICIPANTS", Metric: "Virtual Participants", Value: overallVirtualParticipants },
                { Section: "TOTAL PARTICIPANTS", Metric: "Physical Participants", Value: overallPhysicalParticipants },
                { Section: "INDIVIDUAL REGISTRATIONS", Metric: "Total", Value: summary.individualTotal },
                { Section: "INDIVIDUAL REGISTRATIONS", Metric: "Other Colleges", Value: summary.individualOther },
                { Section: "INDIVIDUAL REGISTRATIONS", Metric: "KL University", Value: summary.individualKl },
                { Section: "INDIVIDUAL REGISTRATIONS", Metric: "Male", Value: summary.individualMale },
                { Section: "INDIVIDUAL REGISTRATIONS", Metric: "Female", Value: summary.individualFemale },
                { Section: "TEAM REGISTRATIONS", Metric: "Total Teams", Value: summary.teamTotalTeams },
                { Section: "TEAM REGISTRATIONS", Metric: "Total Participants", Value: summary.teamTotalParticipants },
                { Section: "TEAM REGISTRATIONS", Metric: "Other College Teams", Value: summary.teamOtherTeams },
                { Section: "TEAM REGISTRATIONS", Metric: "KL Teams", Value: summary.teamKlTeams },
                { Section: "TEAM REGISTRATIONS", Metric: "Participants (Other College)", Value: summary.teamOtherParticipants },
                { Section: "TEAM REGISTRATIONS", Metric: "Participants (KL University)", Value: summary.teamKlParticipants },
                { Section: "TEAM REGISTRATIONS", Metric: "Male", Value: summary.teamMale },
                { Section: "TEAM REGISTRATIONS", Metric: "Female", Value: summary.teamFemale },
            ];

            const sortedData = typedReportData
                .slice()
                .sort(sortByDateThenTop);

            const soloRows = sortedData
                .filter((item) => !item.isGroupEvent)
                .map((item) => ({
                    Category: item.categoryName,
                    Competition: item.eventName,
                    "Event Date": formatEventDate(item.eventDate),
                    "KL Participants": item.participants.kl,
                    "Other Participants": item.participants.other,
                    "Virtual Participants": item.virtualParticipants,
                    "Physical Participants": item.physicalParticipants,
                    "Total Participants": `${item.totalParticipants} participants`,
                }));

            const groupRows = sortedData
                .filter((item) => item.isGroupEvent)
                .map((item) => ({
                    Category: item.categoryName,
                    Competition: item.eventName,
                    "Event Date": formatEventDate(item.eventDate),
                    "Total Teams": `${item.teams.total} teams`,
                    "KL Participants": item.participants.kl,
                    "Other Participants": item.participants.other,
                    "Virtual Participants": item.virtualParticipants,
                    "Physical Participants": item.physicalParticipants,
                    "Total Participants": `${item.totalParticipants} participants`,
                }));

            const competitionWiseRows = sortedData.map((item) => ({
                Category: item.categoryName,
                Competition: item.eventName,
                "Event Date": formatEventDate(item.eventDate),
                "Event Type": item.isGroupEvent ? "Group" : "Solo",
                "Total Teams": item.isGroupEvent ? `${item.teams.total} teams` : "0 teams",
                "KL Participants": item.participants.kl,
                "Other Participants": item.participants.other,
                "Virtual Participants": item.virtualParticipants,
                "Physical Participants": item.physicalParticipants,
                "Total Participants": `${item.totalParticipants} participants`,
            }));

            const categoryTotals = Object.values(
                sortedData.reduce<Record<string, {
                    Category: string;
                    Competitions: number;
                    "Solo Competitions": number;
                    "Group Competitions": number;
                    "Total Teams": number;
                    "Total Participants": number;
                    "Virtual Participants": number;
                    "Physical Participants": number;
                }>>((acc, item) => {
                    if (!acc[item.categoryName]) {
                        acc[item.categoryName] = {
                            Category: item.categoryName,
                            Competitions: 0,
                            "Solo Competitions": 0,
                            "Group Competitions": 0,
                            "Total Teams": 0,
                            "Total Participants": 0,
                            "Virtual Participants": 0,
                            "Physical Participants": 0,
                        };
                    }
                    acc[item.categoryName].Competitions += 1;
                    if (item.isGroupEvent) {
                        acc[item.categoryName]["Group Competitions"] += 1;
                        acc[item.categoryName]["Total Teams"] += item.teams.total;
                    } else {
                        acc[item.categoryName]["Solo Competitions"] += 1;
                    }
                    acc[item.categoryName]["Total Participants"] += item.totalParticipants;
                    acc[item.categoryName]["Virtual Participants"] += item.virtualParticipants;
                    acc[item.categoryName]["Physical Participants"] += item.physicalParticipants;
                    return acc;
                }, {})
            );

            const wb = XLSX.utils.book_new();
            const wsSummary = XLSX.utils.json_to_sheet(summarySheet);
            wsSummary["!cols"] = [{ wch: 28 }, { wch: 36 }, { wch: 14 }];
            const wsCompetitionWise = XLSX.utils.json_to_sheet(competitionWiseRows);
            wsCompetitionWise["!cols"] = [
                { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
                { wch: 17 }, { wch: 18 }, { wch: 19 }, { wch: 17 }, { wch: 30 },
            ];
            const wsSolo = XLSX.utils.json_to_sheet(soloRows);
            wsSolo["!cols"] = [
                { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 17 },
                { wch: 18 }, { wch: 19 }, { wch: 17 },
            ];
            const wsGroup = XLSX.utils.json_to_sheet(groupRows);
            wsGroup["!cols"] = [
                { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 17 },
                { wch: 18 }, { wch: 19 }, { wch: 17 }, { wch: 30 },
            ];
            const wsCategoryTotals = XLSX.utils.json_to_sheet(categoryTotals);
            wsCategoryTotals["!cols"] = [
                { wch: 24 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
                { wch: 18 }, { wch: 18 }, { wch: 18 },
            ];

            XLSX.utils.book_append_sheet(wb, wsCompetitionWise, "Competition Wise Full");
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
            XLSX.utils.book_append_sheet(wb, wsSolo, "Solo Competitions");
            XLSX.utils.book_append_sheet(wb, wsGroup, "Group Competitions");
            XLSX.utils.book_append_sheet(wb, wsCategoryTotals, "Category Totals");
            XLSX.writeFile(wb, `Daily_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Daily report Excel downloaded");
        } catch (error) {
            console.error("Error generating daily report excel:", error);
            toast.error("Failed to generate daily report excel");
        } finally {
            setReportLoading(false);
            setActiveReport(null);
        }
    };

    const downloadAccommodationReportPdf = async () => {
        try {
            setReportLoading(true);
            setActiveReport("accommodationPdf");
            const result = await getAccommodationAnalytics();
            if (!result.success || !result.data) {
                toast.error(result.error || "Failed to fetch accommodation analytics");
                return;
            }

            const stats = result.data.stats as {
                totalBookings: number;
                totalGuests: number;
                byGender: { MALE: number; FEMALE: number };
                byStatus: { PENDING: number; CONFIRMED: number; CANCELLED: number; REJECTED: number };
                byCollege: AccommodationCollegeStat[];
            };
            const bookings = (result.data.bookings || []) as AccommodationBookingItem[];

            const doc = new jsPDF("l", "mm", "a4");
            const timestamp = new Date().toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }).toUpperCase();

            doc.setFontSize(16);
            doc.text("Accommodation Analytics Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated on: ${timestamp}`, 14, 22);

            autoTable(doc, {
                startY: 28,
                head: [["Metric", "Count"]],
                body: [
                    ["Total Bookings", String(stats.totalBookings)],
                    ["Total Guests", String(stats.totalGuests)],
                    ["Male Bookings", String(stats.byGender.MALE)],
                    ["Female Bookings", String(stats.byGender.FEMALE)],
                    ["Pending", String(stats.byStatus.PENDING)],
                    ["Confirmed", String(stats.byStatus.CONFIRMED)],
                ],
                theme: "grid",
                headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 9, cellPadding: 2.5, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
                columnStyles: { 1: { halign: "right" } },
            });

            let currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 28) + 6;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("College-wise Summary", 14, currentY);
            currentY += 2;

            autoTable(doc, {
                startY: currentY,
                head: [["College", "Bookings", "Male", "Female", "Total Guests"]],
                body: stats.byCollege.map((c) => [c.name, String(c.bookings), String(c.male), String(c.female), String(c.guests)]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 8.5, cellPadding: 2.2, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
            });

            currentY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY) + 6;
            if (currentY > 235) {
                doc.addPage();
                currentY = 20;
            }
            doc.setFontSize(12);
            doc.text("Guest-wise Competition Details", 14, currentY);
            currentY += 2;

            autoTable(doc, {
                startY: currentY,
                head: [["Name", "College", "Gender", "Guests", "Status", "Competitions"]],
                body: bookings.map((b) => [
                    b.primaryName || "—",
                    (b.user?.collage || "Unknown").toString(),
                    (b.gender || "—").toString(),
                    String(b.totalMembers || 0),
                    (b.status || "—").toString(),
                    Array.isArray(b.competitions) && b.competitions.length > 0
                        ? b.competitions.join(", ")
                        : "No active physical competition",
                ]),
                theme: "grid",
                headStyles: { fillColor: [142, 68, 173], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 8, cellPadding: 2, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
            });

            doc.save(`Accommodation_Report_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("Accommodation analytics PDF downloaded");
        } catch (error) {
            console.error("Error generating accommodation report:", error);
            toast.error("Failed to generate accommodation report");
        } finally {
            setReportLoading(false);
            setActiveReport(null);
        }
    };

    if (loading) {
        return (
            <div className="px-4 py-6">
                <div className="text-center text-white py-12">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                <button
                    onClick={() => {
                        setLoading(true);
                        loadStats();
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg
                        className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {/* User Statistics */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">User Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Users</p>
                                <p className="text-3xl font-bold text-white mt-2">{userStats?.total || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Approved Users</p>
                                <p className="text-3xl font-bold text-green-400 mt-2">{userStats?.approved || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Pending Approval</p>
                                <p className="text-3xl font-bold text-orange-400 mt-2">{userStats?.pending || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-600/20">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Fully Registered</p>
                        <p className="text-2xl font-bold text-green-400 mt-2">{userStats?.paymentApproved || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Incomplete Registration</p>
                        <p className="text-2xl font-bold text-orange-400 mt-2">{userStats?.paymentPending || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Registration Rejected</p>
                        <p className="text-2xl font-bold text-red-400 mt-2">{userStats?.paymentRejected || 0}</p>
                    </div>
                </div>
            </div>

            {/* Event Statistics */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Competition Statistics</h2>
                <div className="flex gap-2">
                    <button
                        onClick={generateDailyReport}
                        disabled={loading || reportLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {activeReport === "dailyPdf" ? "Preparing..." : "Daily Report"}
                    </button>
                    <button
                        onClick={downloadDailyReportExcel}
                        disabled={loading || reportLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {activeReport === "dailyExcel" ? "Preparing..." : "Daily Excel"}
                    </button>
                    <button
                        onClick={downloadAccommodationReportPdf}
                        disabled={loading || reportLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {activeReport === "accommodationPdf" ? "Preparing..." : "Accommodation PDF"}
                    </button>
                    <button
                        onClick={downloadAllRegistrations}
                        disabled={loading || detailedEvents.length === 0}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Download All (XLSX)
                    </button>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-gray-400 text-sm">Total Events</p>
                                <p className="text-3xl font-bold text-white mt-2">{eventStats?.totalEvents || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                                {eventStats?.categories && eventStats.categories.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-gray-400 text-sm font-medium">Categories:</p>
                                    {eventStats.categories.map((cat: { name: string; eventCount: number }, index: number) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-gray-300">{cat.name}</span>
                                            <span className="text-white font-medium">{cat.eventCount} events</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm mb-4">Top Registered Events</p>
                        <div className="space-y-3">
                            {eventStats?.registrations
                                ?.filter((event: { name: string; count: number }) => event.count > 0)
                                .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
                                .slice(0, 5)
                                .map((event: { name: string; count: number }, index: number) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm truncate flex-1">{event.name}</span>
                                        <span className="text-white font-medium ml-2">{event.count}</span>
                                    </div>
                                ))}
                            {(!eventStats?.registrations ||
                                eventStats.registrations.filter((e: { count: number }) => e.count > 0).length === 0) && (
                                    <p className="text-gray-500 text-sm text-center py-4">No event registrations yet</p>
                                )}
                        </div>
                    </div>
                </div>

                {/* Detailed Event Registrations */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Detailed Registration Data by Event</h3>
                    {detailedEvents.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center text-gray-400">
                            No events with registrations found
                        </div>
                    ) : (
                        detailedEvents
                            .filter(event => event.totalRegistrations > 0)
                            .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
                            .map((event) => (
                                <div key={event.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                                    {/* Event Header */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                                        onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-lg font-semibold text-white">{event.name}</h4>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-600/30">
                                                        {event.category}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                                        {event.isGroupEvent ? "Group Event" : "Solo Event"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm">
                                                    <span className="text-gray-400">
                                                        Total: <span className="text-white font-semibold">{event.totalRegistrations}</span>
                                                    </span>
                                                    {event.individualCount > 0 && (
                                                        <span className="text-gray-400">
                                                            Individual: <span className="text-green-400 font-semibold">{event.individualCount}</span>
                                                        </span>
                                                    )}
                                                    {event.groupCount > 0 && (
                                                        <span className="text-gray-400">
                                                            Group: <span className="text-blue-400 font-semibold">{event.groupCount}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadEventRegistrations(event);
                                                    }}
                                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    Download
                                                </button>
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                                        expandedEvent === event.id ? "rotate-180" : ""
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Registration Details */}
                                    {expandedEvent === event.id && (
                                        <div className="border-t border-gray-700 p-4 bg-gray-850">
                                            {/* Individual Registrations */}
                                            {event.individualRegistrations.length > 0 && (
                                                <div className="mb-6">
                                                    <h5 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                        Individual Registrations ({event.individualCount})
                                                    </h5>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-900 text-gray-400">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">Name</th>
                                                                    <th className="px-3 py-2 text-left">Email</th>
                                                                    <th className="px-3 py-2 text-left">Phone</th>
                                                                    <th className="px-3 py-2 text-left">College</th>
                                                                    <th className="px-3 py-2 text-left">Branch</th>
                                                                    <th className="px-3 py-2 text-left">Year</th>
                                                                    <th className="px-3 py-2 text-left">Location</th>
                                                                    <th className="px-3 py-2 text-left">Type</th>
                                                                    <th className="px-3 py-2 text-left">Payment</th>
                                                                    <th className="px-3 py-2 text-left">Registered</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-700">
                                                                {event.individualRegistrations.map((reg) => (
                                                                    <tr key={reg.id} className="text-gray-300 hover:bg-gray-900/50">
                                                                        <td className="px-3 py-2">{reg.user.name || "—"}</td>
                                                                        <td className="px-3 py-2 text-xs">{reg.user.email}</td>
                                                                        <td className="px-3 py-2">{reg.user.phone || "—"}</td>
                                                                        <td className="px-3 py-2 max-w-[150px] truncate" title={reg.user.collage || ""}>
                                                                            {reg.user.collage || "—"}
                                                                        </td>
                                                                        <td className="px-3 py-2">{reg.user.branch || "—"}</td>
                                                                        <td className="px-3 py-2">{reg.user.year || "—"}</td>
                                                                        <td className="px-3 py-2">
                                                                            {reg.user.isInternational ? (
                                                                                <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
                                                                                    {reg.user.country || "International"}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs">{reg.user.state || reg.user.city || "—"}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            {reg.user.isInternational ? (
                                                                                <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
                                                                                    International
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs">Domestic</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <span
                                                                                className={`text-xs px-2 py-1 rounded ${
                                                                                    reg.paymentStatus === "APPROVED"
                                                                                        ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                                                                        : reg.paymentStatus === "PENDING"
                                                                                        ? "bg-orange-600/20 text-orange-400 border border-orange-600/30"
                                                                                        : "bg-red-600/20 text-red-400 border border-red-600/30"
                                                                                }`}
                                                                            >
                                                                                {reg.paymentStatus || "N/A"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs">
                                                                            {new Date(reg.createdAt).toLocaleDateString()}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Group Registrations */}
                                            {event.groupRegistrations.length > 0 && (
                                                <div>
                                                    <h5 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                        Group Registrations ({event.groupCount})
                                                    </h5>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-900 text-gray-400">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">Group Name</th>
                                                                    <th className="px-3 py-2 text-left">Leader</th>
                                                                    <th className="px-3 py-2 text-left">Email</th>
                                                                    <th className="px-3 py-2 text-left">Phone</th>
                                                                    <th className="px-3 py-2 text-left">Mentor</th>
                                                                    <th className="px-3 py-2 text-left">Members</th>
                                                                    <th className="px-3 py-2 text-left">College</th>
                                                                    <th className="px-3 py-2 text-left">Location</th>
                                                                    <th className="px-3 py-2 text-left">Type</th>
                                                                    <th className="px-3 py-2 text-left">Payment</th>
                                                                    <th className="px-3 py-2 text-left">Registered</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-700">
                                                                {event.groupRegistrations.map((reg) => {

                                                                    const members = (reg.members as Record<string, { name: string }>) || {};
                                                                    const memberCount = Object.keys(members).length;
                                                                    return (
                                                                        <tr key={reg.id} className="text-gray-300 hover:bg-gray-900/50">
                                                                            <td className="px-3 py-2 font-medium">{reg.groupName || "—"}</td>
                                                                            <td className="px-3 py-2">{reg.user.name || "—"}</td>
                                                                            <td className="px-3 py-2 text-xs">{reg.user.email}</td>
                                                                            <td className="px-3 py-2">{reg.user.phone || "—"}</td>
                                                                            <td className="px-3 py-2">
                                                                                {reg.mentorName || "—"}
                                                                                {reg.mentorPhone && <div className="text-xs text-gray-500">{reg.mentorPhone}</div>}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                                                                    {memberCount} members
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 max-w-[150px] truncate" title={reg.user.collage || ""}>
                                                                                {reg.user.collage || "—"}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {reg.user.isInternational ? (
                                                                                    <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
                                                                                        {reg.user.country || "International"}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs">{reg.user.state || reg.user.city || "—"}</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                {reg.user.isInternational ? (
                                                                                    <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-600/30">
                                                                                        International
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs">Domestic</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                <span
                                                                                    className={`text-xs px-2 py-1 rounded ${
                                                                                        reg.paymentStatus === "APPROVED"
                                                                                            ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                                                                            : reg.paymentStatus === "PENDING"
                                                                                            ? "bg-orange-600/20 text-orange-400 border border-orange-600/30"
                                                                                            : "bg-red-600/20 text-red-400 border border-red-600/30"
                                                                                    }`}
                                                                                >
                                                                                    {reg.paymentStatus || "N/A"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-xs">
                                                                                {new Date(reg.createdAt).toLocaleDateString()}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {event.totalRegistrations === 0 && (
                                                <div className="text-gray-500 text-sm text-center py-4">
                                                    No registrations for this event yet
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Accommodation Statistics */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Accommodation Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Total Bookings</p>
                        <p className="text-3xl font-bold text-white mt-2">{accommodationStats?.totalBookings || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Individual</p>
                        <p className="text-3xl font-bold text-red-500 mt-2">{accommodationStats?.individualBookings || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Group</p>
                        <p className="text-3xl font-bold text-red-400 mt-2">{accommodationStats?.groupBookings || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Total Members</p>
                        <p className="text-3xl font-bold text-red-400 mt-2">{accommodationStats?.totalMembers || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Confirmed</p>
                        <p className="text-2xl font-bold text-green-400 mt-2">{accommodationStats?.confirmedBookings || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Pending</p>
                        <p className="text-2xl font-bold text-orange-400 mt-2">{accommodationStats?.pendingBookings || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Cancelled</p>
                        <p className="text-2xl font-bold text-red-400 mt-2">{accommodationStats?.cancelledBookings || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Male Bookings</p>
                        <p className="text-2xl font-bold text-red-500 mt-2">{accommodationStats?.maleBookings || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Female Bookings</p>
                        <p className="text-2xl font-bold text-rose-400 mt-2">{accommodationStats?.femaleBookings || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
