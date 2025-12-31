"use client";

import { useEffect, useState } from "react";
import {
    getUserStats,
    getEventStats,
    getAccommodationStats,
} from "@/actions/admin/analytics.action";
import { toast } from "sonner";

export default function AnalyticsPage() {
    const [userStats, setUserStats] = useState<any>(null);
    const [eventStats, setEventStats] = useState<any>(null);
    const [accommodationStats, setAccommodationStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);

        const [userResult, eventResult, accommodationResult] = await Promise.all([
            getUserStats(),
            getEventStats(),
            getAccommodationStats(),
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

        setLoading(false);
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
                <h2 className="text-xl font-semibold text-white mb-4">Event Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
