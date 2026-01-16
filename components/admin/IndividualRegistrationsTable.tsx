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
    };
    event: {
        name: string;
        date: string;
    };
    createdAt: string;
}

export default function IndividualRegistrationsTable() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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

    const filtered = registrations.filter((reg) =>
        reg.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        reg.user.collageId?.toLowerCase().includes(search.toLowerCase()) ||
        reg.event.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="w-full">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by Name, ID, or Event..."
                    className="w-full max-w-md p-2 rounded bg-zinc-800 text-white border border-zinc-700"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-900 text-zinc-200 uppercase">
                        <tr>
                            <th className="px-6 py-3">Student</th>
                            <th className="px-6 py-3">College ID</th>
                            <th className="px-6 py-3">Event</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Registered At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 bg-black">
                        {filtered.map((reg) => (
                            <tr key={reg.id} className="hover:bg-zinc-900/50">
                                <td className="px-6 py-4 font-medium text-white">
                                    {reg.user.name || "N/A"}
                                    <div className="text-xs text-zinc-500">{reg.user.email}</div>
                                </td>
                                <td className="px-6 py-4">{reg.user.collageId || "-"}</td>
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
    );
}
