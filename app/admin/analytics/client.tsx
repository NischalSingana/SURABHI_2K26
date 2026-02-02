"use client";

import { useEffect, useState } from "react";
import {
    getUserStats,
    getEventStats,
    getAccommodationStats,
    getDetailedEventRegistrations,
} from "@/actions/admin/analytics.action";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function AnalyticsPage() {
    const [userStats, setUserStats] = useState<any>(null);
    const [eventStats, setEventStats] = useState<any>(null);
    const [accommodationStats, setAccommodationStats] = useState<any>(null);
    const [detailedEvents, setDetailedEvents] = useState<any[]>([]);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);

        const [userResult, eventResult, accommodationResult, detailedResult] = await Promise.all([
            getUserStats(),
            getEventStats(),
            getAccommodationStats(),
            getDetailedEventRegistrations(),
        ]);

        if (userResult.success) {
            setUserStats(userResult.stats);
        } else {
            toast.error("Failed to load user stats");
        }

        if (eventResult.success) {
            setEventStats(eventResult.stats);
        } else {
            toast.error("Failed to load event stats");
        }

        if (accommodationResult.success) {
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
    };

    const downloadEventRegistrations = (event: any) => {
        try {
            // Prepare Individual Registrations Data
            const individualData: any[] = [];
            event.individualRegistrations.forEach((reg: any) => {
                individualData.push({
                    "Name": reg.user.name || "",
                    "Email": reg.user.email || "",
                    "Phone": reg.user.phone || "",
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
            const groupData: any[] = [];
            event.groupRegistrations.forEach((reg: any) => {
                const members = reg.members || {};
                const memberList = Object.values(members).map((m: any) => m.name).filter(Boolean);
                
                groupData.push({
                    "Group Name": reg.groupName || "",
                    "Leader": reg.user.name || "",
                    "Email": reg.user.email || "",
                    "Phone": reg.user.phone || "",
                    "Gender": reg.user.gender || "",
                    "Team Size": memberList.length,
                    "Members": memberList.join(", "),
                    "Mentor": reg.mentorName || "—",
                    "Mentor Phone": reg.mentorPhone || "—",
                    "College": reg.user.collage || "",
                    "College ID": reg.user.collageId || "",
                    "City": reg.user.city || "",
                    "State": reg.user.state || "",
                    "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
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
                    { wch: 20 }, // Name
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
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

                XLSX.utils.book_append_sheet(wb, ws1, "Individual");
            }

            // Add Group Registrations sheet
            if (groupData.length > 0) {
                const ws2 = XLSX.utils.json_to_sheet(groupData);
                
                // Set column widths
                ws2['!cols'] = [
                    { wch: 25 }, // Group Name
                    { wch: 20 }, // Leader
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
                    { wch: 10 }, // Gender
                    { wch: 12 }, // Team Size
                    { wch: 45 }, // Members
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
            const individualData: any[] = [];
            detailedEvents.forEach(event => {
                event.individualRegistrations.forEach((reg: any) => {
                    individualData.push({
                        "Event": event.name,
                        "Category": event.category,
                        "Name": reg.user.name || "",
                        "Email": reg.user.email || "",
                        "Phone": reg.user.phone || "",
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
            const groupData: any[] = [];
            detailedEvents.forEach(event => {
                event.groupRegistrations.forEach((reg: any) => {
                    const members = reg.members || {};
                    const memberList = Object.values(members).map((m: any) => m.name).filter(Boolean);
                    
                    groupData.push({
                        "Event": event.name,
                        "Category": event.category,
                        "Group Name": reg.groupName || "",
                        "Leader": reg.user.name || "",
                        "Email": reg.user.email || "",
                        "Phone": reg.user.phone || "",
                        "Gender": reg.user.gender || "",
                        "Team Size": memberList.length,
                        "Members": memberList.join(", "),
                        "Mentor": reg.mentorName || "—",
                        "Mentor Phone": reg.mentorPhone || "—",
                        "College": reg.user.collage || "",
                        "College ID": reg.user.collageId || "",
                        "City": reg.user.city || "",
                        "State": reg.user.state || "",
                        "Country": reg.user.isInternational ? (reg.user.country || "") : "India",
                    });
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
                    { wch: 20 }, // Leader
                    { wch: 28 }, // Email
                    { wch: 15 }, // Phone
                    { wch: 10 }, // Gender
                    { wch: 12 }, // Team Size
                    { wch: 45 }, // Members
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
                    onClick={loadStats}
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

                {/* Payment Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Payment Approved</p>
                        <p className="text-2xl font-bold text-green-400 mt-2">{userStats?.paymentApproved || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Payment Pending</p>
                        <p className="text-2xl font-bold text-orange-400 mt-2">{userStats?.paymentPending || 0}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <p className="text-gray-400 text-sm">Payment Rejected</p>
                        <p className="text-2xl font-bold text-red-400 mt-2">{userStats?.paymentRejected || 0}</p>
                    </div>
                </div>
            </div>

            {/* Event Statistics */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Competition Statistics</h2>
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
                                {eventStats.categories.map((cat: any, index: number) => (
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
                                ?.filter((event: any) => event.count > 0)
                                .sort((a: any, b: any) => b.count - a.count)
                                .slice(0, 5)
                                .map((event: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm truncate flex-1">{event.name}</span>
                                        <span className="text-white font-medium ml-2">{event.count}</span>
                                    </div>
                                ))}
                            {(!eventStats?.registrations ||
                                eventStats.registrations.filter((e: any) => e.count > 0).length === 0) && (
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
                                                                {event.individualRegistrations.map((reg: any) => (
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
                                                                {event.groupRegistrations.map((reg: any) => {
                                                                    const members = reg.members || {};
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
