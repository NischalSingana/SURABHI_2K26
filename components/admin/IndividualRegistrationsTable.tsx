"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Registration {
    id: string;
    user: {
        name: string | null;
        email: string;
        phone: string | null;
        collage: string | null;
        collageId: string | null;
        branch: string | null;
        year: number | null;
        state: string | null;
        city: string | null;
        isInternational?: boolean;
        country?: string | null;
    };
    event: {
        name: string;
        date: string;
    };
    createdAt: string;
}

type FilterTab = "ALL" | "INTERNATIONAL" | "DOMESTIC";

export default function IndividualRegistrationsTable() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
    const [filterTab, setFilterTab] = useState<FilterTab>("ALL");

    useEffect(() => {
        fetch("/api/admin/registrations/individual")
            .then((res) => res.json())
            .then((data) => {
                setRegistrations(data.registrations || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load registrations", err);
                setLoading(false);
            });
    }, []);

    const byFilter = registrations.filter((reg) => {
        if (filterTab === "INTERNATIONAL") return !!reg.user?.isInternational;
        if (filterTab === "DOMESTIC") return !reg.user?.isInternational;
        return true;
    });

    const filtered = byFilter.filter((reg) =>
        reg.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user.collageId?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user.country?.toLowerCase().includes(search.toLowerCase()) ||
        reg.event.name.toLowerCase().includes(search.toLowerCase())
    );

    const internationalCount = registrations.filter((r) => r.user?.isInternational).length;
    const domesticCount = registrations.filter((r) => !r.user?.isInternational).length;

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <>
            <div className="w-full">
                <div className="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
                        <button
                            onClick={() => setFilterTab("ALL")}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterTab === "ALL" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
                        >
                            All ({registrations.length})
                        </button>
                        <button
                            onClick={() => setFilterTab("INTERNATIONAL")}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${filterTab === "INTERNATIONAL" ? "bg-amber-900/40 text-amber-400 border border-amber-700/50" : "text-zinc-400 hover:text-white"}`}
                        >
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            International ({internationalCount})
                        </button>
                        <button
                            onClick={() => setFilterTab("DOMESTIC")}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filterTab === "DOMESTIC" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"}`}
                        >
                            Domestic ({domesticCount})
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Name, ID, Country, or Event..."
                        className="w-full sm:max-w-xs p-2 rounded bg-zinc-800 text-white border border-zinc-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900 text-zinc-200 uppercase">
                            <tr>
                                <th className="px-6 py-3">Student</th>
                                <th className="px-6 py-3">College / Country</th>
                                <th className="px-6 py-3">Event</th>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3">Registered At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-black">
                            {filtered.map((reg) => (
                                <tr
                                    key={reg.id}
                                    className="hover:bg-zinc-900/50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedRegistration(reg)}
                                >
                                    <td className="px-6 py-4 font-medium text-white">
                                        <div className="flex items-center gap-2">
                                            {reg.user.name || "N/A"}
                                            {reg.user.isInternational && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">
                                                    International
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-zinc-500">{reg.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">{reg.user.isInternational ? (reg.user.country || "—") : (reg.user.collageId || "-")}</td>
                                    <td className="px-6 py-4">{reg.event.name}</td>
                                    <td className="px-6 py-4">{reg.user.phone || "-"}</td>
                                    <td className="px-6 py-4">
                                        {format(new Date(reg.createdAt), "MMM d, yyyy HH:mm")}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        No registrations found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedRegistration && (
                <RegistrationModal
                    registration={selectedRegistration}
                    onClose={() => setSelectedRegistration(null)}
                />
            )}
        </>
    );
}

function RegistrationModal({ registration, onClose }: { registration: Registration; onClose: () => void }) {
    if (!registration) return null;
    const { user, event } = registration;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Registration Details</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Event Info */}
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Event Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-zinc-500">Event Name</label>
                                <p className="text-white font-medium">{event.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500">Registration Date</label>
                                <p className="text-white font-medium">{format(new Date(registration.createdAt), "PPP p")}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Participant Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <label className="text-xs text-zinc-500">Full Name</label>
                                <p className="text-white font-medium text-lg">{user.name || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500">Email Address</label>
                                <p className="text-white font-medium">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500">Phone Number</label>
                                <p className="text-white font-medium">{user.phone || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500">Location</label>
                                <p className="text-white font-medium">
                                    {user.isInternational ? (user.country || "N/A") : [user.city, user.state].filter(Boolean).join(", ") || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Academic / Location Info */}
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{user.isInternational ? "Details" : "Academic Details"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                            {user.isInternational ? (
                                <>
                                    <div>
                                        <label className="text-xs text-zinc-500">Country</label>
                                        <p className="text-white font-medium">{user.country || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500">Type</label>
                                        <p className="text-white font-medium">International Participant</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-xs text-zinc-500">College / University</label>
                                        <p className="text-white font-medium">{user.collage || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500">College ID</label>
                                        <p className="text-white font-medium">{user.collageId || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500">Branch</label>
                                        <p className="text-white font-medium">{user.branch || "N/A"}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500">Year of Study</label>
                                        <p className="text-white font-medium">{user.year ? `${user.year} Year` : "N/A"}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
