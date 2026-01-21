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
    event: {
        name: string;
        date: Date;
    };
    paymentScreenshot: string | null;
    utrId: string | null;
    payeeName: string | null;
    paymentStatus: string;
    createdAt: Date;
    type: "INDIVIDUAL" | "GROUP";
    groupName?: string;
};

export default function RegistrationApprovals() {
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

            // Combine and sort by date desc
            const all = [...individual, ...group].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setRegistrations(all as Registration[]);
        } else {
            toast.error("Failed to fetch registrations");
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (id: string, type: "INDIVIDUAL" | "GROUP", status: "APPROVED" | "REJECTED") => {
        toast.loading(`Updating status to ${status}...`);
        const result = await updateRegistrationStatus(id, type, status);
        toast.dismiss();

        if (result.success) {
            toast.success(result.message);
            fetchRegistrations();
            setSelectedRegistration(null);
        } else {
            toast.error(result.error || "Failed to update status");
        }
    };

    const filteredRegistrations = registrations.filter(r => r.type === activeTab);

    if (loading) return <Loader />;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Registration Approvals</h1>

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
                    Individual Registrations
                </button>
                <button
                    onClick={() => setActiveTab("GROUP")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "GROUP" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                        }`}
                >
                    Group Registrations
                </button>
                <button
                    onClick={() => setActiveTab("VISITOR")}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === "VISITOR" ? "text-red-500 border-b-2 border-red-500" : "text-zinc-400 hover:text-white"
                        }`}
                >
                    Visitor Passes
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
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No {viewMode === "PENDING" ? "pending registrations" : "history"} found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{reg.user.name || "Unknown"}</div>
                                            <div className="text-xs">{reg.user.email}</div>
                                            <div className="text-xs">{reg.user.phone}</div>
                                            <div className="text-xs text-zinc-500">{reg.user.collage || "N/A"} ({reg.user.collageId || "N/A"})</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{reg.event.name}</div>
                                            <div className="text-xs">{format(new Date(reg.event.date), "PPP")}</div>
                                            {reg.type === "GROUP" && (
                                                <div className="text-xs text-blue-400 mt-1">Group: {reg.groupName}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div><span className="text-zinc-500">UTR:</span> <span className="text-white font-mono">{reg.utrId}</span></div>
                                                <div><span className="text-zinc-500">Payee:</span> <span className="text-white">{reg.payeeName}</span></div>
                                                {reg.paymentScreenshot && (
                                                    <button
                                                        onClick={() => setSelectedRegistration(reg)}
                                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                                    >
                                                        View Screenshot
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                                                {reg.paymentStatus}
                                            </span>
                                        </td>
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

            {/* Screenshot Modal */}
            {selectedRegistration && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRegistration(null)}>
                    <div className="bg-zinc-900 p-4 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Payment Screenshot</h3>
                            <button onClick={() => setSelectedRegistration(null)} className="text-zinc-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="relative flex-1 min-h-[400px] w-full bg-black rounded-lg overflow-hidden">
                            {selectedRegistration.paymentScreenshot ? (
                                <Image
                                    src={selectedRegistration.paymentScreenshot}
                                    alt="Payment Proof"
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-500">No image available</div>
                            )}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRegistration(null);
                                }}
                                className="px-4 py-2 bg-zinc-800 text-zinc-400 hover:text-white rounded font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
