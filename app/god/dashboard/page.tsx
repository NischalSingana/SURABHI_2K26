"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
    FiLogOut, FiUser, FiUsers, FiCalendar, FiDownload,
    FiCheckCircle, FiXCircle, FiClock, FiTrendingUp, FiShield
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { getDailyReportStats, getDetailedEventRegistrations } from "@/actions/admin/analytics.action";
import { getAccommodationAnalytics } from "@/actions/admin/accommodation-analytics.action";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DashboardStats {
    totalUsers: number;
    totalAdmins: number;
    totalJudges: number;
    totalManagers: number;
    totalMasters: number;
    totalEvents: number;
    totalRegistrations: number;
    pendingApprovals: number;
    totalRevenue: number;
}

interface RegistrationUser {
    id: string;
    name: string | null;
    email: string;
    gender: string | null;
    collage: string | null;
}

interface IndividualRegistration {
    id: string;
    user: RegistrationUser;
}

interface GroupRegistration {
    id: string;
    user: RegistrationUser;
    members?: unknown;
}

interface DetailedEvent {
    id: string;
    name: string;
    category: string;
    isGroupEvent: boolean;
    individualRegistrations: IndividualRegistration[];
    groupRegistrations: GroupRegistration[];
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

function getTeamParticipants(members: unknown): number {
    const memberCount = Array.isArray(members)
        ? members.length
        : members && typeof members === "object"
            ? Object.keys(members as Record<string, unknown>).length
            : 0;
    return 1 + memberCount;
}

function formatEventDate(dateInput: string): string {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function sortByDateThenTop(a: DailyReportItem, b: DailyReportItem): number {
    const ta = new Date(a.eventDate).getTime();
    const tb = new Date(b.eventDate).getTime();
    if (ta !== tb) return ta - tb;
    if (b.totalParticipants !== a.totalParticipants) return b.totalParticipants - a.totalParticipants;
    return a.eventName.localeCompare(b.eventName);
}

export default function GodDashboard() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [activeReport, setActiveReport] = useState<"dailyPdf" | "dailyExcel" | "accommodationPdf" | null>(null);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        } else if (session?.user?.role !== "GOD") {
            router.push("/");
        } else {
            fetchDashboardData();
        }
    }, [session, isPending, router]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch("/api/god/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                toast.error("Failed to load dashboard data");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push("/");
        toast.success("Logged out successfully");
    };

    const fetchReportData = async () => {
        const [dailyResult, detailedResult] = await Promise.all([
            getDailyReportStats(),
            getDetailedEventRegistrations(),
        ]);

        if (!dailyResult.success || !dailyResult.data) {
            throw new Error("Failed to fetch daily report stats");
        }
        if (!detailedResult.success || !detailedResult.events) {
            throw new Error("Failed to fetch detailed registration stats");
        }

        return {
            dailyData: dailyResult.data as DailyReportItem[],
            detailedEvents: detailedResult.events as DetailedEvent[],
        };
    };

    const buildSummary = (detailedEvents: DetailedEvent[], dailyData: DailyReportItem[]) => {
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

        const overallVirtualParticipants = dailyData.reduce((acc, item) => acc + item.virtualParticipants, 0);
        const overallPhysicalParticipants = dailyData.reduce((acc, item) => acc + item.physicalParticipants, 0);

        return { summary, overallVirtualParticipants, overallPhysicalParticipants };
    };

    const handleDownloadDailyReportPdf = async () => {
        try {
            setActiveReport("dailyPdf");
            setReportLoading(true);
            const { dailyData, detailedEvents } = await fetchReportData();
            const { summary, overallVirtualParticipants, overallPhysicalParticipants } = buildSummary(detailedEvents, dailyData);

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
            doc.text("Daily Registration Report - Category Wise", 14, 15);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text(`Generated on: ${timestamp}`, 14, 22);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.text("Note: Counts represent total participants (including group members).", 14, 26);
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

            const groupedByCategory = dailyData.reduce<Record<string, DailyReportItem[]>>((acc, item) => {
                if (!acc[item.categoryName]) acc[item.categoryName] = [];
                acc[item.categoryName].push(item);
                return acc;
            }, {});
            const categoryNames = Object.keys(groupedByCategory).sort((a, b) => {
                const aMinDate = Math.min(
                    ...groupedByCategory[a].map((item) => new Date(item.eventDate).getTime()).filter((t) => !Number.isNaN(t))
                );
                const bMinDate = Math.min(
                    ...groupedByCategory[b].map((item) => new Date(item.eventDate).getTime()).filter((t) => !Number.isNaN(t))
                );

                const aDate = Number.isFinite(aMinDate) ? aMinDate : Number.MAX_SAFE_INTEGER;
                const bDate = Number.isFinite(bMinDate) ? bMinDate : Number.MAX_SAFE_INTEGER;
                if (aDate !== bDate) return aDate - bDate;
                return a.localeCompare(b);
            });

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

                    const soloRows = soloItems.map((item) => [
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

                    const groupRows = groupItems.map((item) => [
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

            doc.save(`Daily_Report_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("Daily report PDF downloaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report PDF");
        } finally {
            setReportLoading(false);
            setActiveReport(null);
        }
    };

    const handleDownloadDailyReportExcel = async () => {
        try {
            setActiveReport("dailyExcel");
            setReportLoading(true);
            const { dailyData, detailedEvents } = await fetchReportData();
            const { summary, overallVirtualParticipants, overallPhysicalParticipants } = buildSummary(detailedEvents, dailyData);

            const genderByEvent = new Map<string, { male: number; female: number }>();
            detailedEvents.forEach((event) => {
                let male = 0;
                let female = 0;
                event.individualRegistrations.forEach((reg) => {
                    const g = (reg.user.gender || "").toUpperCase();
                    if (g === "MALE") male += 1;
                    if (g === "FEMALE") female += 1;
                });
                event.groupRegistrations.forEach((reg) => {
                    const lead = (reg.user.gender || "").toUpperCase();
                    if (lead === "MALE") male += 1;
                    if (lead === "FEMALE") female += 1;
                    const membersValue = reg.members;
                    let membersList: Array<{ gender?: string }> = [];
                    if (Array.isArray(membersValue)) {
                        membersList = membersValue as Array<{ gender?: string }>;
                    } else if (membersValue && typeof membersValue === "object") {
                        membersList = Object.values(membersValue as Record<string, { gender?: string }>);
                    }
                    membersList.forEach((m) => {
                        const g = (m?.gender || "").toUpperCase();
                        if (g === "MALE") male += 1;
                        if (g === "FEMALE") female += 1;
                    });
                });
                genderByEvent.set(event.id, { male, female });
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

            const sortedData = dailyData
                .slice()
                .sort(sortByDateThenTop);

            const soloRows = sortedData
                .filter((item) => !item.isGroupEvent)
                .map((item) => {
                    const gender = genderByEvent.get(item.eventId) || { male: 0, female: 0 };
                    return {
                        Category: item.categoryName,
                        Competition: item.eventName,
                        "Event Date": formatEventDate(item.eventDate),
                        "KL Participants": item.participants.kl,
                        "Other Participants": item.participants.other,
                        Male: gender.male,
                        Female: gender.female,
                        "Virtual Participants": item.virtualParticipants,
                        "Physical Participants": item.physicalParticipants,
                        "Total Participants": `${item.totalParticipants} participants`,
                    };
                });

            const groupRows = sortedData
                .filter((item) => item.isGroupEvent)
                .map((item) => {
                    const gender = genderByEvent.get(item.eventId) || { male: 0, female: 0 };
                    return {
                        Category: item.categoryName,
                        Competition: item.eventName,
                        "Event Date": formatEventDate(item.eventDate),
                        "Total Teams": `${item.teams.total} teams`,
                        "KL Participants": item.participants.kl,
                        "Other Participants": item.participants.other,
                        Male: gender.male,
                        Female: gender.female,
                        "Virtual Participants": item.virtualParticipants,
                        "Physical Participants": item.physicalParticipants,
                        "Total Participants": `${item.totalParticipants} participants`,
                    };
                });

            const competitionWiseRows = sortedData.map((item) => {
                const gender = genderByEvent.get(item.eventId) || { male: 0, female: 0 };
                return {
                    Category: item.categoryName,
                    Competition: item.eventName,
                    "Event Date": formatEventDate(item.eventDate),
                    "Event Type": item.isGroupEvent ? "Group" : "Solo",
                    "Total Teams": item.isGroupEvent ? `${item.teams.total} teams` : "0 teams",
                    "KL Participants": item.participants.kl,
                    "Other Participants": item.participants.other,
                    Male: gender.male,
                    Female: gender.female,
                    "Virtual Participants": item.virtualParticipants,
                    "Physical Participants": item.physicalParticipants,
                    "Total Participants": `${item.totalParticipants} participants`,
                };
            });

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
            const summaryRef = XLSX.utils.decode_range(wsSummary["!ref"] || "A1");
            wsSummary["!autofilter"] = { ref: XLSX.utils.encode_range(summaryRef) };

            const wsCompetitionWise = XLSX.utils.json_to_sheet(competitionWiseRows);
            wsCompetitionWise["!cols"] = [
                { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
                { wch: 17 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 19 }, { wch: 17 }, { wch: 30 },
            ];
            const fullRef = XLSX.utils.decode_range(wsCompetitionWise["!ref"] || "A1");
            wsCompetitionWise["!autofilter"] = { ref: XLSX.utils.encode_range(fullRef) };

            const wsSolo = XLSX.utils.json_to_sheet(soloRows);
            wsSolo["!cols"] = [
                { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 17 }, { wch: 10 },
                { wch: 10 }, { wch: 18 }, { wch: 19 }, { wch: 17 },
            ];
            const soloRef = XLSX.utils.decode_range(wsSolo["!ref"] || "A1");
            wsSolo["!autofilter"] = { ref: XLSX.utils.encode_range(soloRef) };

            const wsGroup = XLSX.utils.json_to_sheet(groupRows);
            wsGroup["!cols"] = [
                { wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 17 },
                { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 19 }, { wch: 17 }, { wch: 30 },
            ];
            const groupRef = XLSX.utils.decode_range(wsGroup["!ref"] || "A1");
            wsGroup["!autofilter"] = { ref: XLSX.utils.encode_range(groupRef) };

            const wsCategoryTotals = XLSX.utils.json_to_sheet(categoryTotals);
            wsCategoryTotals["!cols"] = [
                { wch: 24 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
                { wch: 18 }, { wch: 18 }, { wch: 18 },
            ];
            const catTotalsRef = XLSX.utils.decode_range(wsCategoryTotals["!ref"] || "A1");
            wsCategoryTotals["!autofilter"] = { ref: XLSX.utils.encode_range(catTotalsRef) };

            XLSX.utils.book_append_sheet(wb, wsCompetitionWise, "Competition Wise Full");
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
            XLSX.utils.book_append_sheet(wb, wsSolo, "Solo Competitions");
            XLSX.utils.book_append_sheet(wb, wsGroup, "Group Competitions");
            XLSX.utils.book_append_sheet(wb, wsCategoryTotals, "Category Totals");
            XLSX.writeFile(wb, `Daily_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Daily report Excel downloaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report Excel");
        } finally {
            setReportLoading(false);
            setActiveReport(null);
        }
    };

    const handleDownloadAccommodationReportPdf = async () => {
        try {
            setActiveReport("accommodationPdf");
            setReportLoading(true);
            const result = await getAccommodationAnalytics();
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to fetch accommodation analytics");
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
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text(`Generated on: ${timestamp}`, 14, 22);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);

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
                body: stats.byCollege.map((c) => [
                    c.name,
                    String(c.bookings),
                    String(c.male),
                    String(c.female),
                    String(c.guests),
                ]),
                theme: "grid",
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
                styles: { fontSize: 8.5, cellPadding: 2.2, fontStyle: "bold" },
                margin: { left: 14, right: 14 },
                columnStyles: {
                    1: { halign: "right" },
                    2: { halign: "right" },
                    3: { halign: "right" },
                    4: { halign: "right" },
                },
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
                columnStyles: {
                    3: { halign: "right" },
                },
            });

            doc.save(`Accommodation_Report_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("Accommodation analytics PDF downloaded");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate accommodation report PDF");
        } finally {
            setReportLoading(false);
            setActiveReport(null);
        }
    };

    if (isPending || loading) {
        return <Loader />;
    }

    if (!session?.user || session.user.role !== "GOD") {
        return null;
    }

    const statCards = [
        {
            title: "Total Users",
            value: stats?.totalUsers || 0,
            icon: FiUsers,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10"
        },
        {
            title: "Admins",
            value: stats?.totalAdmins || 0,
            icon: FiShield,
            color: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-500/10"
        },
        {
            title: "Judges",
            value: stats?.totalJudges || 0,
            icon: FiUser,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-500/10"
        },
        {
            title: "Managers",
            value: stats?.totalManagers || 0,
            icon: FiUser,
            color: "from-orange-500 to-red-500",
            bgColor: "bg-orange-500/10"
        },
        {
            title: "Masters",
            value: stats?.totalMasters || 0,
            icon: FiShield,
            color: "from-yellow-500 to-amber-500",
            bgColor: "bg-yellow-500/10"
        },
        {
            title: "Total Events",
            value: stats?.totalEvents || 0,
            icon: FiCalendar,
            color: "from-red-500 to-orange-500",
            bgColor: "bg-red-500/10"
        },
        {
            title: "Registrations",
            value: stats?.totalRegistrations || 0,
            icon: FiTrendingUp,
            color: "from-indigo-500 to-purple-500",
            bgColor: "bg-indigo-500/10"
        },
        {
            title: "Pending Approvals",
            value: stats?.pendingApprovals || 0,
            icon: FiClock,
            color: "from-yellow-500 to-orange-500",
            bgColor: "bg-yellow-500/10"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                                God Dashboard
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Ultimate System Control
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium">{session?.user?.name || "God"}</p>
                                <p className="text-xs text-gray-400">{session?.user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all"
                            >
                                <FiLogOut />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4"
                >
                    <h2 className="text-lg font-semibold mb-3">Daily Report Downloads</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleDownloadDailyReportPdf}
                            disabled={reportLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <FiDownload />
                            {activeReport === "dailyPdf" ? "Preparing..." : "Download Daily Report PDF"}
                        </button>
                        <button
                            onClick={handleDownloadDailyReportExcel}
                            disabled={reportLoading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <FiDownload />
                            {activeReport === "dailyExcel" ? "Preparing..." : "Download Daily Report Excel"}
                        </button>
                        <button
                            onClick={handleDownloadAccommodationReportPdf}
                            disabled={reportLoading}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <FiDownload />
                            {activeReport === "accommodationPdf" ? "Preparing..." : "Download Accommodation Report PDF"}
                        </button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`${card.bgColor} border border-white/10 rounded-xl p-6 backdrop-blur-sm`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color} bg-opacity-20`}>
                                        <Icon className="text-2xl text-white" />
                                    </div>
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium mb-1">{card.title}</h3>
                                <p className="text-3xl font-bold text-white">{card.value.toLocaleString()}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-left"
                        >
                            <h3 className="font-semibold mb-1">Admin Dashboard</h3>
                            <p className="text-sm text-gray-400">Access admin panel</p>
                        </button>
                        <button
                            onClick={() => router.push("/admin/users")}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-left"
                        >
                            <h3 className="font-semibold mb-1">User Management</h3>
                            <p className="text-sm text-gray-400">Manage all users</p>
                        </button>
                        <button
                            onClick={() => router.push("/admin/analytics")}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-left"
                        >
                            <h3 className="font-semibold mb-1">Analytics</h3>
                            <p className="text-sm text-gray-400">View system analytics</p>
                        </button>
                    </div>
                </motion.div>

                {/* System Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                    <h2 className="text-xl font-bold mb-4">System Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Role</p>
                            <p className="text-lg font-semibold text-red-400">GOD</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Email</p>
                            <p className="text-lg font-semibold">{session?.user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">User ID</p>
                            <p className="text-lg font-semibold font-mono text-sm">{session?.user?.id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Status</p>
                            <p className="text-lg font-semibold text-green-400 flex items-center gap-2">
                                <FiCheckCircle />
                                Active
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
