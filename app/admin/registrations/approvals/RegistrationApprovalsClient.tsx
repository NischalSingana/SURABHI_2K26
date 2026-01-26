"use client";

import { useEffect, useState } from "react";
import { getPendingRegistrations, getRegistrationHistory, updateRegistrationStatus } from "@/actions/admin.action";
import { toast } from "sonner";
import Image from "next/image";
import { format } from "date-fns";
import Loader from "@/components/ui/Loader";

type Registration = {
    id: string;
    user: {
        name: string | null;
        email: string;
        phone: string | null;
        collage: string | null;
        collageId: string | null;
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

export default function RegistrationApprovalsClient() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "GROUP" | "VISITOR">("INDIVIDUAL");
    const [viewMode, setViewMode] = useState<"PENDING" | "HISTORY">("PENDING");

    useEffect(() => {
        fetchRegistrations();
    }, [viewMode]);

    const fetchRegistrations = async () => {
        setLoading(true);
        const result = viewMode === "PENDING"
            ? await getPendingRegistrations()
            : await getRegistrationHistory();

        if (result.success && result.data) {
            const individual = result.data.individual.map((r: any) => ({ ...r, type: "INDIVIDUAL" }));
            const group = result.data.group.map((r: any) => ({ ...r, type: "GROUP" }));
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
            const all = [...individual, ...group, ...visitor].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setRegistrations(all as Registration[]);
        } else {
            toast.error("Failed to fetch registrations");
        }
        setLoading(false);
    };

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

        if (result.success) {
            toast.success(result.message || `Registration ${status.toLowerCase()} successfully`);
            fetchRegistrations();
        } else {
            toast.error(result.error || "Failed to update status");
        }
    };

    const filteredRegistrations = registrations.filter((reg) => {
        if (activeTab === "INDIVIDUAL" && reg.type !== "INDIVIDUAL") return false;
        if (activeTab === "GROUP" && reg.type !== "GROUP") return false;
        if (activeTab === "VISITOR" && reg.type !== "VISITOR") return false;
        return true;
    });

    // Calculate counts for each registration type
    const individualCount = registrations.filter((reg) => reg.type === "INDIVIDUAL").length;
    const groupCount = registrations.filter((reg) => reg.type === "GROUP").length;
    const visitorCount = registrations.filter((reg) => reg.type === "VISITOR").length;

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Registration Approvals</h1>
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
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
                <button
                    onClick={() => setActiveTab("INDIVIDUAL")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "INDIVIDUAL" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                        }`}
                >
                    Individual Registrations ({individualCount})
                </button>
                <button
                    onClick={() => setActiveTab("GROUP")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "GROUP" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                        }`}
                >
                    Group Registrations ({groupCount})
                </button>
                <button
                    onClick={() => setActiveTab("VISITOR")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "VISITOR" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                        }`}
                >
                    Visitor Passes ({visitorCount})
                </button>
            </div>

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
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === "HISTORY" ? 6 : 5} className="px-6 py-12 text-center text-zinc-500">
                                        No {viewMode === "PENDING" ? "pending registrations" : "history"} found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{reg.user.name || "Unknown"}</div>
                                            <div className="text-xs">{reg.user.email}</div>
                                            <div className="text-xs">{reg.user.phone || "N/A"}</div>
                                            <div className="text-xs text-zinc-500">{reg.user.collage || "N/A"} {reg.user.collageId ? `(${reg.user.collageId})` : ""}</div>
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

