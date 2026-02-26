"use client";

import { useEffect, useState } from "react";
import { getPendingRegistrations, getRegistrationHistory, updateRegistrationStatus } from "@/actions/admin.action";
import { toast } from "sonner";
import Image from "next/image";
import { format } from "date-fns";
import Loader from "@/components/ui/Loader";
import * as XLSX from "xlsx";

function isKLUniversity(reg: { user?: { email?: string | null; collage?: string | null } | null }): boolean {
    const u = reg.user;
    if (!u) return false;
    if (u.email?.toLowerCase().endsWith("@kluniversity.in")) return true;
    const c = (u.collage || "").toLowerCase();
    // More specific checks to avoid false positives like "Brooklyn" matching "kl"
    return (
        c.includes("kl university") || 
        c.includes("koneru") || 
        c.includes("klef") || 
        c === "kl" || 
        c.startsWith("kl ") || 
        c.endsWith(" kl") || 
        c.includes(" kl ") ||
        c.includes("k l university") ||
        c.includes("k.l. university")
    );
}

function isVirtualParticipation(reg: { isVirtual?: boolean | null; user?: { isInternational?: boolean } | null }): boolean {
    // Legacy-safe: treat international registrations as virtual even if old rows missed isVirtual.
    return !!reg.isVirtual || !!reg.user?.isInternational;
}

type Registration = {
    id: string;
    isVirtual?: boolean | null;
    user: {
        name: string | null;
        email: string;
        phone: string | null;
        collage: string | null;
        collageId: string | null;
        isInternational?: boolean;
        country?: string | null;
    };
    event?: {
        name: string;
        date: Date;
    };
    paymentScreenshot: string | null;
    utrId: string | null;
    payeeName: string | null;
    paymentStatus: string;
    createdAt: Date;
    type: "INDIVIDUAL" | "GROUP" | "VISITOR";
    groupName?: string;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    approver?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
    } | null;
};

type CollegeFilter = "ALL" | "KL_UNIVERSITY" | "OTHER";

export default function RegistrationApprovalsClient() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "GROUP" | "VISITOR" | "INTERNATIONAL">("INDIVIDUAL");
    const [viewMode, setViewMode] = useState<"PENDING" | "HISTORY">("PENDING");
    const [collegeFilter, setCollegeFilter] = useState<CollegeFilter>("ALL");
    const [filters, setFilters] = useState({
        user: "",
        event: "",
        payment: "",
        status: "",
        approvedBy: "",
        actions: "",
    });

    const fetchRegistrations = async () => {
        setLoading(true);
        const result = viewMode === "PENDING"
            ? await getPendingRegistrations()
            : await getRegistrationHistory();

        if (result.success && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const individual = result.data.individual.map((r: any) => ({ ...r, type: "INDIVIDUAL" }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const group = result.data.group.map((r: any) => ({ ...r, type: "GROUP" }));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const visitor = (result.data.visitorPasses || []).map((p: any) => ({
                id: p.id,
                user: p.user || { name: null, email: "", phone: null, collage: null, collageId: null },
                event: undefined, // Visitor passes don't have events
                paymentScreenshot: p.paymentScreenshot || null,
                utrId: p.utrId || null,
                payeeName: p.payeeName || null,
                paymentStatus: p.paymentStatus,
                createdAt: p.createdAt,
                approvedBy: p.approvedBy || null,
                approvedAt: p.approvedAt || null,
                approver: p.approver || null,
                type: "VISITOR" as const
            }));

            // Combine and sort by date desc
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const all = [...individual, ...group, ...visitor].sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setRegistrations(all as Registration[]);
        } else {
            toast.error("Failed to fetch registrations");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRegistrations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (viewMode === "PENDING") {
                fetchRegistrations();
            }
        }, 20000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    const handleStatusUpdate = async (
        id: string,
        type: "INDIVIDUAL" | "GROUP" | "VISITOR",
        status: "APPROVED" | "REJECTED"
    ) => {
        const loadingToast = toast.loading(`Updating status to ${status}...`);
        // Convert VISITOR to VISITOR_PASS for backend
        const backendType = type === "VISITOR" ? "VISITOR_PASS" : type;
        const result = await updateRegistrationStatus(id, backendType as "INDIVIDUAL" | "GROUP" | "VISITOR_PASS", status);
        toast.dismiss(loadingToast);

        if (!result) {
            toast.error("Failed to update status");
            return;
        }
        if (result.success) {
            toast.success(result.message || `Registration ${status.toLowerCase()} successfully`);
            fetchRegistrations();
        } else {
            toast.error(result.error || "Failed to update status");
        }
    };

    const filteredRegistrations = registrations.filter((reg) => {
        if (activeTab === "INTERNATIONAL") {
            if (!reg.user?.isInternational) return false;
        } else if (activeTab === "INDIVIDUAL" && reg.type !== "INDIVIDUAL") return false;
        else if (activeTab === "GROUP" && reg.type !== "GROUP") return false;
        else if (activeTab === "VISITOR" && reg.type !== "VISITOR") return false;

        if ((activeTab === "INDIVIDUAL" || activeTab === "GROUP")) {
            if (collegeFilter === "KL_UNIVERSITY" && !isKLUniversity(reg)) return false;
            if (collegeFilter === "OTHER" && isKLUniversity(reg)) return false;
        }

        const userStr = [
            reg.user?.name || "",
            reg.user?.email || "",
            reg.user?.phone || "",
            reg.user?.collage || "",
            reg.user?.collageId || "",
        ].join(" ").toLowerCase();
        const eventStr = reg.type === "VISITOR" ? "visitor pass" : (reg.event?.name || "").toLowerCase();
        const paymentStr = [
            reg.utrId || "",
            reg.payeeName || "",
            reg.paymentStatus || "",
        ].join(" ").toLowerCase();
        const statusStr = (reg.paymentStatus || "").toLowerCase();
        const approvedByStr = (reg.approver?.name || reg.approver?.email || "not tracked").toLowerCase();
        const actionsStr = reg.approvedAt
            ? format(new Date(reg.approvedAt), "dd MMM yyyy").toLowerCase()
            : format(new Date(reg.createdAt), "dd MMM yyyy").toLowerCase();

        if (filters.user && !userStr.includes(filters.user.toLowerCase())) return false;
        if (filters.event && !eventStr.includes(filters.event.toLowerCase())) return false;
        if (filters.payment && !paymentStr.includes(filters.payment.toLowerCase())) return false;
        if (filters.status && !statusStr.includes(filters.status.toLowerCase())) return false;
        if (filters.approvedBy && !approvedByStr.includes(filters.approvedBy.toLowerCase())) return false;
        if (filters.actions && !actionsStr.includes(filters.actions.toLowerCase())) return false;

        return true;
    });

    // Calculate counts for each registration type
    const individualCount = registrations.filter((reg) => reg.type === "INDIVIDUAL").length;
    const groupCount = registrations.filter((reg) => reg.type === "GROUP").length;
    const visitorCount = registrations.filter((reg) => reg.type === "VISITOR").length;
    const internationalCount = registrations.filter((reg) => !!reg.user?.isInternational).length;

    const individualKLCount = registrations.filter((r) => r.type === "INDIVIDUAL" && isKLUniversity(r)).length;
    const individualOtherCount = registrations.filter((r) => r.type === "INDIVIDUAL" && !isKLUniversity(r)).length;
    const groupKLCount = registrations.filter((r) => r.type === "GROUP" && isKLUniversity(r)).length;
    const groupOtherCount = registrations.filter((r) => r.type === "GROUP" && !isKLUniversity(r)).length;

    const showCollegeSubTabs = (activeTab === "INDIVIDUAL" || activeTab === "GROUP");

    const rowToExport = (reg: Registration) => ({
        "Username": reg.user?.name || "—",
        "Email": reg.user?.email || "—",
        "Phone Number": reg.user?.phone || "—",
        "College": reg.user?.isInternational ? (reg.user?.country || "—") : `${reg.user?.collage || "—"} ${reg.user?.collageId ? `(${reg.user.collageId})` : ""}`.trim(),
        "Event": reg.type === "VISITOR" ? "Visitor Pass" : reg.event ? `${reg.event.name} (${format(new Date(reg.event.date), "PPP")})` : "—",
        "Payment Details": [reg.utrId ? `UTR: ${reg.utrId}` : "", reg.payeeName ? `Payee: ${reg.payeeName}` : "", reg.paymentScreenshot ? "Screenshot attached" : ""].filter(Boolean).join("; ") || "No payment details",
        "Status": reg.paymentStatus || "—",
        "Approved By": reg.approver ? `${reg.approver.name || ""} (${reg.approver.email})` : "Not tracked",
        "Actions": reg.approvedAt ? format(new Date(reg.approvedAt), "dd MMM yyyy") : format(new Date(reg.createdAt), "dd MMM yyyy"),
    });

    const exportToXlsx = () => {
        const toExport = filteredRegistrations.map(rowToExport);

        if (toExport.length === 0) {
            toast.error("No registrations to export");
            return;
        }
        try {
            const ws = XLSX.utils.json_to_sheet(toExport);
            const ref = XLSX.utils.decode_range(ws["!ref"] || "A1");
            ws["!autofilter"] = { ref: XLSX.utils.encode_range(ref) };
            const wb = XLSX.utils.book_new();
            const sheetName = `${activeTab}_${viewMode}${collegeFilter !== "ALL" ? `_${collegeFilter === "KL_UNIVERSITY" ? "KL" : "Other"}` : ""}`.slice(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, `registrations_${viewMode}_${activeTab}_${new Date().toISOString().split("T")[0]}.xlsx`);
            toast.success("Exported successfully");
        } catch (e) {
            console.error(e);
            toast.error("Failed to export");
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="px-4 py-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-white">Registration Approvals</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRegistrations}
                        className="px-4 py-2 bg-zinc-700/50 text-zinc-200 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-600"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={exportToXlsx}
                        className="px-4 py-2 bg-green-600/20 text-green-500 hover:bg-green-600/30 rounded-lg text-sm font-medium transition-colors border border-green-500/30"
                    >
                        Export XLSX
                    </button>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setViewMode("PENDING")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "PENDING" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setViewMode("HISTORY")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "HISTORY" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        History
                    </button>
                </div>
                {viewMode === "PENDING" && (
                    <p className="text-xs text-zinc-500">
                        Auto-refresh every 20s
                    </p>
                )}
            </div>

            {/* Tabs: horizontal scroll on mobile so International + Visitor Passes always visible */}
            <div className="mb-6 border-b border-zinc-800 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-2 sm:gap-4 overflow-x-auto overflow-y-hidden pb-px min-w-0">
                    <button
                        onClick={() => setActiveTab("INTERNATIONAL")}
                        className={`shrink-0 px-3 sm:px-4 py-2 font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === "INTERNATIONAL" ? "text-amber-400 border-b-2 border-amber-500" : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        International ({internationalCount})
                    </button>
                    <button
                        onClick={() => setActiveTab("INDIVIDUAL")}
                        className={`shrink-0 px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === "INDIVIDUAL" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        Individual ({individualCount})
                    </button>
                    <button
                        onClick={() => setActiveTab("GROUP")}
                        className={`shrink-0 px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === "GROUP" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        Group ({groupCount})
                    </button>
                    <button
                        onClick={() => setActiveTab("VISITOR")}
                        className={`shrink-0 px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === "VISITOR" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        Visitor Passes ({visitorCount})
                    </button>
                </div>
            </div>

            {showCollegeSubTabs && (
                <div className="mb-4 flex gap-2">
                    <button
                        onClick={() => setCollegeFilter("ALL")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${collegeFilter === "ALL" ? "bg-zinc-700 text-white" : "bg-zinc-800/50 text-zinc-400 hover:text-white"}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setCollegeFilter("KL_UNIVERSITY")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${collegeFilter === "KL_UNIVERSITY" ? "bg-zinc-700 text-white" : "bg-zinc-800/50 text-zinc-400 hover:text-white"}`}
                    >
                        KL University ({activeTab === "INDIVIDUAL" ? individualKLCount : groupKLCount})
                    </button>
                    <button
                        onClick={() => setCollegeFilter("OTHER")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${collegeFilter === "OTHER" ? "bg-zinc-700 text-white" : "bg-zinc-800/50 text-zinc-400 hover:text-white"}`}
                    >
                        Other College ({activeTab === "INDIVIDUAL" ? individualOtherCount : groupOtherCount})
                    </button>
                </div>
            )}

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-xs uppercase text-zinc-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">Payment Details</th>
                                <th className="px-6 py-4">Status</th>
                                {viewMode === "HISTORY" && <th className="px-6 py-4">Approved By</th>}
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                            <tr className="bg-zinc-900/50">
                                <th className="px-6 py-2">
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={filters.user}
                                        onChange={(e) => setFilters((f) => ({ ...f, user: e.target.value }))}
                                        className="w-full max-w-[180px] px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                    />
                                </th>
                                <th className="px-6 py-2">
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={filters.event}
                                        onChange={(e) => setFilters((f) => ({ ...f, event: e.target.value }))}
                                        className="w-full max-w-[180px] px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                    />
                                </th>
                                <th className="px-6 py-2">
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={filters.payment}
                                        onChange={(e) => setFilters((f) => ({ ...f, payment: e.target.value }))}
                                        className="w-full max-w-[180px] px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                    />
                                </th>
                                <th className="px-6 py-2">
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={filters.status}
                                        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                                        className="w-full max-w-[120px] px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                    />
                                </th>
                                {viewMode === "HISTORY" && (
                                    <th className="px-6 py-2">
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.approvedBy}
                                            onChange={(e) => setFilters((f) => ({ ...f, approvedBy: e.target.value }))}
                                            className="w-full max-w-[140px] px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-2">
                                    <input
                                        type="text"
                                        placeholder="Filter..."
                                        value={filters.actions}
                                        onChange={(e) => setFilters((f) => ({ ...f, actions: e.target.value }))}
                                        className="w-full max-w-[120px] px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === "HISTORY" ? 6 : 5} className="px-6 py-12 text-center text-zinc-500">
                                        {activeTab === "INTERNATIONAL"
                                            ? "No international registrations found."
                                            : showCollegeSubTabs && collegeFilter !== "ALL"
                                            ? `No ${collegeFilter === "KL_UNIVERSITY" ? "KL University" : "other college"} ${viewMode === "PENDING" ? "pending " : ""}${activeTab.toLowerCase()} registrations found.`
                                            : `No ${viewMode === "PENDING" ? "pending " : ""}${activeTab.toLowerCase().replace("_", " ")} registrations found.`}
                                        {viewMode === "PENDING" && (
                                            <div className="text-xs text-zinc-600 mt-2">
                                                Switch to All Statuses or History to view already approved/rejected registrations.
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white flex items-center gap-2">
                                                {reg.user.name || "Unknown"}
                                                {isVirtualParticipation(reg) && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-900/30 text-sky-400 border border-sky-700/50">
                                                        Virtual Participation
                                                    </span>
                                                )}
                                                {reg.user.isInternational && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">
                                                        International
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs">{reg.user.email}</div>
                                            <div className="text-xs">{reg.user.phone || "N/A"}</div>
                                            <div className="text-xs text-zinc-500">
                                                {reg.user.isInternational ? (reg.user.country || "—") : `${reg.user.collage || "N/A"} ${reg.user.collageId ? `(${reg.user.collageId})` : ""}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {reg.type === "VISITOR" ? (
                                                <div className="text-white font-medium">Visitor Pass</div>
                                            ) : reg.event ? (
                                                <>
                                                    <div className="text-white font-medium">{reg.event.name}</div>
                                                    <div className="text-xs">{format(new Date(reg.event.date), "PPP")}</div>
                                                    {reg.type === "GROUP" && (
                                                        <div className="text-xs text-blue-400 mt-1">Group: {reg.groupName}</div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-zinc-500 text-xs">N/A</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {reg.utrId && (
                                                    <div><span className="text-zinc-500">UTR:</span> <span className="text-white font-mono">{reg.utrId}</span></div>
                                                )}
                                                {reg.payeeName && (
                                                    <div><span className="text-zinc-500">Payee:</span> <span className="text-white">{reg.payeeName}</span></div>
                                                )}
                                                {reg.paymentScreenshot && (
                                                    <button
                                                        onClick={() => setSelectedRegistration(reg)}
                                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                                    >
                                                        View Screenshot
                                                    </button>
                                                )}
                                                {!reg.utrId && !reg.payeeName && !reg.paymentScreenshot && (
                                                    <span className="text-zinc-500 text-xs">No payment details</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                reg.paymentStatus === "APPROVED" 
                                                    ? "bg-green-500/10 text-green-500" 
                                                    : reg.paymentStatus === "REJECTED"
                                                    ? "bg-red-500/10 text-red-500"
                                                    : "bg-yellow-500/10 text-yellow-500"
                                            }`}>
                                                {reg.paymentStatus}
                                            </span>
                                        </td>
                                        {viewMode === "HISTORY" && (
                                            <td className="px-6 py-4">
                                                {reg.approver ? (
                                                    <div>
                                                        <div className="text-white text-sm font-medium">{reg.approver.name || "Unknown"}</div>
                                                        <div className="text-xs text-zinc-400">{reg.approver.email}</div>
                                                        <div className="text-xs text-zinc-500">{reg.approver.role}</div>
                                                        {reg.approvedAt && (
                                                            <div className="text-xs text-zinc-600 mt-1">
                                                                {format(new Date(reg.approvedAt), "dd MMM yyyy, HH:mm")}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-500 text-xs italic">Not tracked</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {viewMode === "PENDING" ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(reg.id, reg.type, "APPROVED")}
                                                            className="px-3 py-1 bg-green-600/20 text-green-500 hover:bg-green-600/30 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(reg.id, reg.type, "REJECTED")}
                                                            className="px-3 py-1 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-zinc-500 text-xs italic">
                                                        {format(new Date(reg.createdAt), "dd MMM yyyy")}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Screenshot Modal */}
            {selectedRegistration && selectedRegistration.paymentScreenshot && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedRegistration(null)}
                >
                    <div
                        className="bg-zinc-900 rounded-lg p-6 max-w-4xl w-full border border-zinc-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Payment Screenshot</h2>
                            <button
                                onClick={() => setSelectedRegistration(null)}
                                className="text-zinc-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="relative w-full h-[600px] bg-zinc-950 rounded-lg overflow-hidden">
                            <Image
                                src={selectedRegistration.paymentScreenshot}
                                alt="Payment Screenshot"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

