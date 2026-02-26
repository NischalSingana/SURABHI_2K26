"use client";

import { useEffect, useState } from "react";
import {
    getRegistrationStatsByCollege,
    getCategoryWiseAnalytics,
} from "@/actions/admin/registration-analytics.action";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

/**
 * Helper function to check if a user is from KL University
 */
function isKLUniversity(user: {
    email?: string | null;
    collage?: string | null;
}): boolean {
    if (!user) return false;
    if (user.email?.toLowerCase().endsWith("@kluniversity.in")) return true;
    const collage = (user.collage || "").toLowerCase();
    return (
        collage.includes("kl university") ||
        collage.includes("kl") ||
        collage.includes("koneru") ||
        collage.includes("klef")
    );
}

interface CollegeStats {
    kl: number;
    other: number;
    total: number;
}

interface TeamStats {
    teams: number;
    members: number;
}

interface GenderStats {
    male: number;
    female: number;
}

interface CompetitionAnalytics {
    id: string;
    name: string;
    isGroupEvent: boolean;
    individual: {
        kl: number;
        other: number;
        total: number;
        gender?: {
            kl: GenderStats;
            other: GenderStats;
            total: GenderStats;
        };
        registrations: any[];
    };
    team: {
        kl: TeamStats & { gender?: GenderStats };
        other: TeamStats & { gender?: GenderStats };
        total: TeamStats & { gender?: GenderStats };
        registrations: any[];
    };
    overall: {
        kl: {
            registrations: number;
            participants: number;
            gender?: GenderStats;
        };
        other: {
            registrations: number;
            participants: number;
            gender?: GenderStats;
        };
        total: {
            registrations: number;
            participants: number;
            gender?: GenderStats;
        };
    };
}

interface CategoryAnalytics {
    id: string;
    name: string;
    individual: {
        kl: number;
        other: number;
        total: number;
        gender?: {
            kl: GenderStats;
            other: GenderStats;
            total: GenderStats;
        };
    };
    team: {
        kl: TeamStats & { gender?: GenderStats };
        other: TeamStats & { gender?: GenderStats };
        total: TeamStats & { gender?: GenderStats };
    };
    overall: {
        kl: {
            registrations: number;
            participants: number;
            gender?: GenderStats;
        };
        other: {
            registrations: number;
            participants: number;
            gender?: GenderStats;
        };
        total: {
            registrations: number;
            participants: number;
            gender?: GenderStats;
        };
    };
    competitions: CompetitionAnalytics[];
}

export default function RegistrationAnalyticsClient() {
    const [collegeStats, setCollegeStats] = useState<any>(null);
    const [categories, setCategories] = useState<CategoryAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [expandedCompetition, setExpandedCompetition] = useState<{ categoryId: string; competitionId: string | null }>({
        categoryId: "",
        competitionId: null,
    });
    const [expandedCollege, setExpandedCollege] = useState<{ categoryId: string; competitionId: string; college: "kl" | "other" | null }>({
        categoryId: "",
        competitionId: "",
        college: null,
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);

        const [collegeResult, categoryResult] = await Promise.all([
            getRegistrationStatsByCollege(),
            getCategoryWiseAnalytics(),
        ]);

        if (collegeResult.success) {
            setCollegeStats(collegeResult.stats);
        } else {
            toast.error("Failed to load college statistics");
        }

        if (categoryResult.success && categoryResult.categories) {
            setCategories(categoryResult.categories);
        } else {
            toast.error("Failed to load category analytics");
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400 text-sm">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white relative overflow-x-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Enhanced Header Section */}
                    <div className="mb-8 sm:mb-12">
                        <div className="relative">
                            {/* Decorative elements */}
                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 via-red-500 to-transparent rounded-full opacity-60" />
                            <div className="absolute -left-2 top-8 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            
                            <div className="pl-6">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">Analytics Dashboard</span>
                                        </div>
                                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                                            Registration Analytics
                                        </h1>
                                        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl leading-relaxed">
                                            Comprehensive registration analysis and insights for higher officials. Track registrations by category, college, and demographics with detailed breakdowns.
                                        </p>
                                    </div>
                                    
                                </div>
                                
                                {/* Info badges */}
                                <div className="flex flex-wrap items-center gap-3 mt-6">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs text-zinc-300">Live Data</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm">
                                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-xs text-zinc-300">Real-time Updates</span>
                                    </div>
                                    {categories.length > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm">
                                            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="text-xs text-zinc-300">{categories.length} Categories</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                {/* Enhanced Overall Statistics */}
                {collegeStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-14">
                        {/* Total Participants - Enhanced */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-blue-500/20 rounded-2xl p-6 sm:p-7 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/15 hover:border-blue-500/40 transition-all duration-500 overflow-hidden">
                            {/* Animated gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {/* Shine effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Participants</h3>
                                        <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 mb-1 leading-tight bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                                            {collegeStats.overall.total.participants.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2.5 text-sm">
                                    {/* Other Colleges - HIGHLIGHTED FIRST */}
                                    <div className="relative flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600/20 via-blue-500/15 to-blue-600/20 border-2 border-blue-500/50 backdrop-blur-sm hover:border-blue-400/70 transition-all duration-200 shadow-lg shadow-blue-500/20 animate-pulse">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 rounded-xl" />
                                        <div className="relative flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" />
                                            <span className="text-white font-bold text-base">Other Colleges</span>
                                        </div>
                                        <span className="relative text-blue-200 font-extrabold text-xl">
                                            {collegeStats.overall.other.participants.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* KL University - Secondary */}
                                    <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border border-zinc-800/50 backdrop-blur-sm hover:border-red-500/30 transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-zinc-400 font-medium">KL University</span>
                                        </div>
                                        <span className="text-zinc-300 font-semibold text-sm">
                                            {collegeStats.overall.kl.participants.toLocaleString()}
                                        </span>
                                    </div>
                                    {collegeStats.overall.total.gender && (
                                        <>
                                            <div className="pt-3 mt-3 border-t border-zinc-800/50">
                                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                        <span className="text-zinc-300 text-xs font-medium">Male</span>
                                                    </div>
                                                    <span className="text-blue-300 font-bold">
                                                        {collegeStats.overall.total.gender.male.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                                                    <span className="text-zinc-300 text-xs font-medium">Female</span>
                                                </div>
                                                <span className="text-pink-300 font-bold">
                                                    {collegeStats.overall.total.gender.female.toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Individual Competitions - Enhanced */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-green-500/20 rounded-2xl p-6 sm:p-7 shadow-xl shadow-green-500/5 hover:shadow-2xl hover:shadow-green-500/15 hover:border-green-500/40 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Individual Registrations</h3>
                                        <p className="text-3xl sm:text-4xl font-extrabold text-green-400 mb-1 leading-tight bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                                            {collegeStats.individual.total.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/10 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2.5 text-sm">
                                    {/* Other Colleges - HIGHLIGHTED FIRST */}
                                    <div className="relative flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-green-600/20 via-green-500/15 to-green-600/20 border-2 border-green-500/50 backdrop-blur-sm hover:border-green-400/70 transition-all duration-200 shadow-lg shadow-green-500/20 animate-pulse">
                                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 rounded-xl" />
                                        <div className="relative flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
                                            <span className="text-white font-bold text-base">Other Colleges</span>
                                        </div>
                                        <span className="relative text-green-200 font-extrabold text-xl">
                                            {collegeStats.individual.other.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* KL University - Secondary */}
                                    <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border border-zinc-800/50 backdrop-blur-sm hover:border-red-500/30 transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-zinc-400 font-medium">KL University</span>
                                        </div>
                                        <span className="text-zinc-300 font-semibold text-sm">
                                            {collegeStats.individual.kl.toLocaleString()}
                                        </span>
                                    </div>
                                    {collegeStats.individual.gender && (
                                        <>
                                            <div className="pt-3 mt-3 border-t border-zinc-800/50">
                                                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-green-500/5 border border-green-500/10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                                        <span className="text-zinc-300 text-xs font-medium">Male</span>
                                                    </div>
                                                    <span className="text-green-300 font-bold">
                                                        {collegeStats.individual.gender.total.male.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                                                    <span className="text-zinc-300 text-xs font-medium">Female</span>
                                                </div>
                                                <span className="text-pink-300 font-bold">
                                                    {collegeStats.individual.gender.total.female.toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Team Competitions - Enhanced */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-purple-500/20 rounded-2xl p-6 sm:p-7 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/15 hover:border-purple-500/40 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Team Registrations</h3>
                                        <p className="text-3xl sm:text-4xl font-extrabold text-purple-400 mb-1 leading-tight bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                                            {collegeStats.team.total.teams.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">{collegeStats.team.total.members.toLocaleString()} total participants</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    {/* Other Colleges Teams - HIGHLIGHTED FIRST */}
                                    <div className="relative flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600/20 via-purple-500/15 to-purple-600/20 border-2 border-purple-500/50 backdrop-blur-sm hover:border-purple-400/70 transition-all duration-200 shadow-lg shadow-purple-500/20 animate-pulse">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 rounded-xl" />
                                        <div className="relative flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50 animate-pulse" />
                                            <span className="text-white font-bold text-base">Other College Teams</span>
                                        </div>
                                        <span className="relative text-purple-200 font-extrabold text-xl">
                                            {collegeStats.team.other.teams.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* KL University Teams - Secondary */}
                                    <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border border-zinc-800/50 backdrop-blur-sm hover:border-red-500/30 transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-zinc-400 font-medium">KL Teams</span>
                                        </div>
                                        <span className="text-zinc-300 font-semibold text-sm">
                                            {collegeStats.team.kl.teams.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-purple-500/30">
                                        <div className="relative flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600/20 via-purple-500/15 to-purple-600/20 border-2 border-purple-500/50 backdrop-blur-sm shadow-lg shadow-purple-500/20">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
                                                <span className="text-white font-bold text-sm">Participants (Other College)</span>
                                            </div>
                                            <span className="text-purple-200 font-extrabold text-xl">
                                                {collegeStats.team.other.members.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-gradient-to-r from-zinc-900/50 to-zinc-800/30 border border-zinc-800/50 backdrop-blur-sm hover:border-red-500/30 transition-all duration-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-zinc-400 font-medium text-sm">Participants (KL University)</span>
                                        </div>
                                        <span className="text-zinc-300 font-semibold text-sm">
                                            {collegeStats.team.kl.members.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="pt-2 mt-2 border-t border-zinc-800/50">
                                        <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                                            <span className="text-zinc-400 text-xs font-medium">Total Participants</span>
                                            <span className="text-zinc-300 font-semibold text-sm">
                                                {collegeStats.team.total.members.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {collegeStats.team.total.gender && (
                                        <>
                                            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                                                    <span className="text-zinc-300 text-xs font-medium">Male</span>
                                                </div>
                                                <span className="text-purple-300 font-bold">
                                                    {collegeStats.team.total.gender.male.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                                                    <span className="text-zinc-300 text-xs font-medium">Female</span>
                                                </div>
                                                <span className="text-pink-300 font-bold">
                                                    {collegeStats.team.total.gender.female.toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Category-wise Breakdown */}
                <div className="mb-10">
                    <div className="relative mb-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="relative">
                                <div className="w-1 h-10 bg-gradient-to-b from-red-600 via-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/20" />
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                                    Category-wise Analytics
                                </h2>
                                <p className="text-sm text-zinc-400 mt-1">Explore detailed registration statistics by category</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {categories.map((category, index) => (
                            <div
                                key={category.id}
                                className="group relative bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/40 transition-all duration-500"
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <button
                                    onClick={() => {
                                        const newExpanded = expandedCategory === category.id ? null : category.id;
                                        setExpandedCategory(newExpanded);
                                        if (!newExpanded) {
                                            setExpandedCompetition({ categoryId: "", competitionId: null });
                                            setExpandedCollege({ categoryId: "", competitionId: "", college: null });
                                        } else if (expandedCompetition.categoryId && expandedCompetition.categoryId !== category.id) {
                                            setExpandedCompetition({ categoryId: "", competitionId: null });
                                            setExpandedCollege({ categoryId: "", competitionId: "", college: null });
                                        }
                                    }}
                                    className="w-full p-6 sm:p-7 text-left hover:bg-zinc-900/20 transition-all duration-300 flex items-center justify-between relative z-10"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                                            <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">
                                                {category.name}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-semibold backdrop-blur-sm shadow-lg shadow-blue-500/10">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m3 6h-3m-2 0h-2m2 0v-2m0 2v2" />
                                                    </svg>
                                                    {category.competitions.length} Competition{category.competitions.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                                            <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-zinc-300 font-medium">
                                                    <span className="text-zinc-400 mr-1">Registrations:</span>
                                                    <span className="text-green-300">Individual: {category.individual.total.toLocaleString()}</span>
                                                    <span className="text-zinc-500 mx-1">•</span>
                                                    <span className="text-purple-300">Group: {category.team.total.teams.toLocaleString()}</span>
                                                    <span className="text-zinc-500 mx-1">•</span>
                                                    <span className="text-white font-bold">Total: {category.overall.total.registrations.toLocaleString()}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                <span className="text-zinc-300 font-medium">
                                                    <span className="text-zinc-400 mr-1">No. of Participants:</span>
                                                    <span className="text-green-300">Individual: {category.individual.total.toLocaleString()}</span>
                                                    <span className="text-zinc-500 mx-1">•</span>
                                                    <span className="text-purple-300">Group: {category.team.total.members.toLocaleString()}</span>
                                                    <span className="text-zinc-500 mx-1">•</span>
                                                    <span className="text-white font-bold">Total: {category.overall.total.participants.toLocaleString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`ml-4 flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/20 group-hover:border-red-500/30 group-hover:scale-110 shadow-lg ${
                                        expandedCategory === category.id ? "bg-red-500/30 border-red-500/40 scale-110" : ""
                                    }`}>
                                        <svg
                                            className={`w-5 h-5 transition-all duration-300 ${
                                                expandedCategory === category.id 
                                                    ? "rotate-180 text-red-400 scale-110" 
                                                    : "text-zinc-400 group-hover:text-red-400"
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </button>

                                {expandedCategory === category.id && (
                                    <div className="p-6 sm:p-8 border-t border-zinc-800/50 bg-gradient-to-br from-zinc-900/40 via-zinc-950/30 to-zinc-900/40 backdrop-blur-sm">
                                        <div className="space-y-8">
                                            {/* Category Statistics Summary - Enhanced */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                                {/* Individual Registrations Stats - Enhanced */}
                                                {category.individual.total > 0 && (
                                                    <div className="relative bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 border border-zinc-800/60 rounded-xl p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-green-500/30 transition-all duration-300 overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        <div className="relative z-10">
                                                            <div className="flex items-center justify-between mb-5">
                                                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2.5">
                                                                    <div className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-400 rounded-full shadow-lg shadow-green-500/20"></div>
                                                                    Individual Registrations
                                                                </h4>
                                                                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {/* Other Colleges - HIGHLIGHTED FIRST */}
                                                                <div className="relative flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-green-600/20 via-green-500/15 to-green-600/20 border-2 border-green-500/50 backdrop-blur-sm hover:border-green-400/70 transition-all duration-200 shadow-lg shadow-green-500/20 animate-pulse">
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 rounded-xl" />
                                                                    <div className="relative flex items-center gap-3">
                                                                        <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
                                                                        <span className="text-white font-bold text-base">Other Colleges</span>
                                                                    </div>
                                                                    <span className="relative text-green-200 font-extrabold text-xl">
                                                                        {category.individual.other.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                {/* KL University - Secondary */}
                                                                <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-gradient-to-r from-zinc-800/40 to-zinc-900/30 border border-zinc-700/50 hover:border-red-500/30 transition-all duration-200 backdrop-blur-sm">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                                                                        <span className="text-zinc-400 font-medium">KL University</span>
                                                                    </div>
                                                                    <span className="text-zinc-300 font-semibold text-sm">
                                                                        {category.individual.kl.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                {category.individual.gender && (
                                                                    <>
                                                                        <div className="pt-3 mt-3 border-t border-zinc-800/50 space-y-2">
                                                                            <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                                                                                    <span className="text-zinc-300 text-sm font-medium">Male</span>
                                                                                </div>
                                                                                <span className="text-green-300 font-bold text-base">
                                                                                    {category.individual.gender.total.male.toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
                                                                                    <span className="text-zinc-300 text-sm font-medium">Female</span>
                                                                                </div>
                                                                                <span className="text-pink-300 font-bold text-base">
                                                                                    {category.individual.gender.total.female.toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                                <div className="pt-3 mt-3 border-t border-zinc-700/50">
                                                                    <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-2 border-green-500/30 backdrop-blur-sm">
                                                                        <span className="text-zinc-200 font-bold text-sm uppercase tracking-wider">Total</span>
                                                                        <span className="text-white font-extrabold text-xl">
                                                                            {category.individual.total.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Team Registrations Stats - Enhanced */}
                                                {category.team.total.teams > 0 && (
                                                    <div className="relative bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 border border-zinc-800/60 rounded-xl p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-purple-500/30 transition-all duration-300 overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        <div className="relative z-10">
                                                            <div className="flex items-center justify-between mb-5">
                                                                <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2.5">
                                                                    <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/20"></div>
                                                                    Team Registrations
                                                                </h4>
                                                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {/* Other Colleges Teams - HIGHLIGHTED FIRST */}
                                                                <div className="relative flex flex-col py-4 px-4 rounded-xl bg-gradient-to-br from-purple-600/25 via-purple-500/20 to-purple-600/25 border-2 border-purple-500/60 backdrop-blur-sm shadow-xl shadow-purple-500/30 hover:border-purple-400/80 transition-all duration-200">
                                                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-transparent to-purple-500/15 rounded-xl" />
                                                                    <div className="relative flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-3 h-3 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50 animate-pulse" />
                                                                            <span className="text-white font-bold text-sm">Other College Teams</span>
                                                                        </div>
                                                                        <span className="text-purple-200 font-extrabold text-2xl">
                                                                            {category.team.other.teams.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative flex items-center justify-between pt-2 border-t border-purple-500/30">
                                                                        <span className="text-xs text-purple-200 font-semibold">Other Members</span>
                                                                        <span className="text-purple-100 font-extrabold text-xl">
                                                                            {category.team.other.members.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {/* KL University Teams - Secondary */}
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="flex flex-col py-2.5 px-3 rounded-lg bg-gradient-to-br from-zinc-800/40 to-zinc-900/30 border border-zinc-700/50 hover:border-red-500/30 transition-all duration-200 backdrop-blur-sm">
                                                                        <span className="text-xs text-zinc-400 mb-1">KL Teams</span>
                                                                        <span className="text-zinc-300 font-semibold text-base">
                                                                            {category.team.kl.teams.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col py-2.5 px-3 rounded-lg bg-gradient-to-br from-zinc-800/40 to-zinc-900/30 border border-zinc-700/50 hover:border-red-500/30 transition-all duration-200 backdrop-blur-sm">
                                                                        <span className="text-xs text-zinc-400 mb-1">KL Members</span>
                                                                        <span className="text-zinc-300 font-semibold text-base">
                                                                            {category.team.kl.members.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {category.team.total.gender && (
                                                                    <div className="pt-3 mt-3 border-t border-zinc-800/50 space-y-2">
                                                                        <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
                                                                                <span className="text-zinc-300 text-sm font-medium">Male</span>
                                                                            </div>
                                                                            <span className="text-purple-300 font-bold text-base">
                                                                                {category.team.total.gender.male.toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center py-2.5 px-4 rounded-lg bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
                                                                                <span className="text-zinc-300 text-sm font-medium">Female</span>
                                                                            </div>
                                                                            <span className="text-pink-300 font-bold text-base">
                                                                                {category.team.total.gender.female.toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="pt-3 mt-3 border-t border-zinc-700/50 grid grid-cols-2 gap-2">
                                                                    <div className="flex flex-col py-2.5 px-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/5 border-2 border-purple-500/30 backdrop-blur-sm">
                                                                        <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider mb-1">Total Teams</span>
                                                                        <span className="text-white font-extrabold text-xl">
                                                                            {category.team.total.teams.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col py-2.5 px-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/5 border-2 border-purple-500/30 backdrop-blur-sm">
                                                                        <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider mb-1">Total Members</span>
                                                                        <span className="text-white font-extrabold text-xl">
                                                                            {category.team.total.members.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Overall Summary - Enhanced */}
                                                <div className="md:col-span-2">
                                                    <div className="relative">
                                                        <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-5 flex items-center gap-3">
                                                            <div className="w-2 h-8 bg-gradient-to-b from-red-500 via-red-400 to-red-600 rounded-full shadow-lg shadow-red-500/30"></div>
                                                            Overall Summary
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                            {/* Other Colleges - HIGHLIGHTED FIRST */}
                                                            <div className="relative group bg-gradient-to-br from-blue-600/25 via-blue-500/20 to-blue-600/25 border-2 border-blue-500/60 rounded-xl p-5 sm:p-6 shadow-2xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:border-blue-400/80 transition-all duration-300 overflow-hidden animate-pulse">
                                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-100 transition-opacity duration-300" />
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="text-xs font-extrabold text-white uppercase tracking-widest flex items-center gap-2">
                                                                            <div className="w-3 h-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" />
                                                                            Other Colleges
                                                                        </div>
                                                                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent">
                                                                        {category.overall.other.registrations.toLocaleString()}
                                                                    </div>
                                                                    <div className="text-sm text-blue-100 mb-4 space-y-2 font-bold">
                                                                        <div>
                                                                            <span className="text-blue-200">Registrations:</span> Individual: {category.individual.other.toLocaleString()} • Group: {category.team.other.teams.toLocaleString()} • Total: {category.overall.other.registrations.toLocaleString()}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-blue-200">No. of Participants:</span> Individual: {category.individual.other.toLocaleString()} • Group: {category.team.other.members.toLocaleString()} • Total: {category.overall.other.participants.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                    {category.overall.other.gender && (
                                                                        <div className="pt-4 border-t border-blue-500/40 flex items-center gap-4">
                                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/30 border-2 border-blue-400/50 rounded-lg backdrop-blur-sm shadow-lg shadow-blue-500/20">
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-300 shadow-lg shadow-blue-300/50" />
                                                                                <span className="text-xs text-white">
                                                                                    <span className="text-blue-100 font-extrabold text-sm">{category.overall.other.gender.male.toLocaleString()}</span>
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/30 border-2 border-pink-400/50 rounded-lg backdrop-blur-sm shadow-lg shadow-pink-500/20">
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-pink-300 shadow-lg shadow-pink-300/50" />
                                                                                <span className="text-xs text-white">
                                                                                    <span className="text-pink-100 font-extrabold text-sm">{category.overall.other.gender.female.toLocaleString()}</span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* KL University - Secondary */}
                                                            <div className="relative group bg-gradient-to-br from-red-500/10 via-red-600/5 to-red-500/5 border border-red-500/20 rounded-xl p-5 sm:p-6 shadow-lg shadow-red-500/5 hover:shadow-xl hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 overflow-hidden">
                                                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                            KL University
                                                                        </div>
                                                                        <svg className="w-5 h-5 text-red-400/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-2xl sm:text-3xl font-bold text-zinc-300 mb-2">
                                                                        {category.overall.kl.registrations.toLocaleString()}
                                                                    </div>
                                                                    <div className="text-xs text-zinc-400 mb-4 space-y-2 font-medium">
                                                                        <div>
                                                                            <span className="text-zinc-500">Registrations:</span> Individual: {category.individual.kl.toLocaleString()} • Group: {category.team.kl.teams.toLocaleString()} • Total: {category.overall.kl.registrations.toLocaleString()}
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-zinc-500">No. of Participants:</span> Individual: {category.individual.kl.toLocaleString()} • Group: {category.team.kl.members.toLocaleString()} • Total: {category.overall.kl.participants.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                    {category.overall.kl.gender && (
                                                                        <div className="pt-3 border-t border-zinc-800/50 flex items-center gap-3">
                                                                            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/5 border border-blue-500/10 rounded-lg backdrop-blur-sm">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                                <span className="text-xs text-zinc-400">
                                                                                    <span className="text-blue-300 font-semibold">{category.overall.kl.gender.male.toLocaleString()}</span>
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 px-2 py-1 bg-pink-500/5 border border-pink-500/10 rounded-lg backdrop-blur-sm">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                                                                <span className="text-xs text-zinc-400">
                                                                                    <span className="text-pink-300 font-semibold">{category.overall.kl.gender.female.toLocaleString()}</span>
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                            {/* Competitions within Category - Enhanced */}
                            {category.competitions.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-zinc-800/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-base font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-3">
                                            <div className="w-2 h-6 bg-gradient-to-b from-amber-500 via-amber-400 to-amber-600 rounded-full shadow-lg shadow-amber-500/30"></div>
                                            Competitions in {category.name}
                                            <span className="ml-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-semibold">
                                                {category.competitions.length}
                                            </span>
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {category.competitions.map((competition) => (
                                            <div
                                                key={competition.id}
                                                className="group relative bg-gradient-to-br from-zinc-900/50 via-zinc-950/40 to-zinc-900/50 border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:border-amber-500/40 transition-all duration-300"
                                            >
                                                {/* Subtle glow effect */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                
                                                <button
                                                    onClick={() => {
                                                        const newExpanded = expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id
                                                            ? { categoryId: "", competitionId: null }
                                                            : { categoryId: category.id, competitionId: competition.id };
                                                        setExpandedCompetition(newExpanded);
                                                        if (!newExpanded.competitionId) {
                                                            setExpandedCollege({ categoryId: "", competitionId: "", college: null });
                                                        } else if (expandedCollege.competitionId && expandedCollege.competitionId !== competition.id) {
                                                            setExpandedCollege({ categoryId: "", competitionId: "", college: null });
                                                        }
                                                    }}
                                                    className="w-full p-5 text-left hover:bg-zinc-800/20 transition-all duration-300 flex items-start justify-between relative z-10"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors duration-300 mb-1.5 truncate">
                                                                    {competition.name}
                                                                </h5>
                                                                {competition.isGroupEvent && (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-semibold backdrop-blur-sm">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                        </svg>
                                                                        Team Event
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                <span className="text-xs text-zinc-300">
                                                                    <span className="text-zinc-400">Reg:</span> <span className="text-white font-bold">{competition.overall.total.registrations.toLocaleString()}</span>
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                <span className="text-xs text-zinc-300">
                                                                    <span className="text-zinc-400">Part:</span> <span className="text-white font-bold">{competition.overall.total.participants.toLocaleString()}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`ml-4 flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 border border-zinc-700/50 flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500/20 group-hover:border-amber-500/30 group-hover:scale-110 shadow-lg ${
                                                        expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id ? "bg-amber-500/30 border-amber-500/40 scale-110" : ""
                                                    }`}>
                                                        <svg
                                                            className={`w-4 h-4 transition-all duration-300 ${
                                                                expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id 
                                                                    ? "rotate-180 text-amber-400 scale-110" 
                                                                    : "text-zinc-400 group-hover:text-amber-400"
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </button>

                                                {expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id && (
                                                    <div className="p-5 sm:p-6 border-t-2 border-zinc-800/70 bg-gradient-to-br from-zinc-950/50 via-zinc-900/30 to-zinc-950/50 backdrop-blur-sm">
                                                        <div className="space-y-6">
                                                            {/* Competition Statistics - Enhanced with better visual hierarchy */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {/* Individual Card */}
                                                                {competition.individual.total > 0 ? (
                                                                    <div className="relative group bg-gradient-to-br from-zinc-800/50 to-zinc-900/40 border-2 border-zinc-700/60 rounded-xl p-5 hover:border-green-500/40 transition-all duration-300 overflow-hidden shadow-lg">
                                                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                        <div className="relative z-10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-md shadow-green-500/50" />
                                                                                    Individual
                                                                                </div>
                                                                                <svg className="w-5 h-5 text-green-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="text-3xl font-extrabold text-white mb-3">
                                                                                {competition.individual.total.toLocaleString()}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                                    competition.individual.other > 0 
                                                                                        ? "bg-blue-500/20 border border-blue-500/30 text-blue-300" 
                                                                                        : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-500"
                                                                                }`}>
                                                                                    Other: {competition.individual.other.toLocaleString()}
                                                                                </span>
                                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                                    competition.individual.kl > 0 
                                                                                        ? "bg-red-500/20 border border-red-500/30 text-red-300" 
                                                                                        : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-500"
                                                                                }`}>
                                                                                    KL: {competition.individual.kl.toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative bg-gradient-to-br from-zinc-800/30 to-zinc-900/20 border border-zinc-800/40 rounded-xl p-5 opacity-60">
                                                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                                            <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                                                            Individual
                                                                        </div>
                                                                        <div className="text-xl font-bold text-zinc-600">0</div>
                                                                        <div className="text-xs text-zinc-600 mt-2">No individual registrations</div>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Teams Card */}
                                                                {competition.team.total.teams > 0 ? (
                                                                    <div className="relative group bg-gradient-to-br from-zinc-800/50 to-zinc-900/40 border-2 border-zinc-700/60 rounded-xl p-5 hover:border-purple-500/40 transition-all duration-300 overflow-hidden shadow-lg">
                                                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                                        <div className="relative z-10">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                                                                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-md shadow-purple-500/50" />
                                                                                    Teams
                                                                                </div>
                                                                                <svg className="w-5 h-5 text-purple-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="text-3xl font-extrabold text-white mb-3">
                                                                                {competition.team.total.teams.toLocaleString()}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                                    competition.team.other.teams > 0 
                                                                                        ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" 
                                                                                        : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-500"
                                                                                }`}>
                                                                                    Other: {competition.team.other.teams.toLocaleString()}
                                                                                </span>
                                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                                    competition.team.kl.teams > 0 
                                                                                        ? "bg-red-500/20 border border-red-500/30 text-red-300" 
                                                                                        : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-500"
                                                                                }`}>
                                                                                    KL: {competition.team.kl.teams.toLocaleString()}
                                                                                </span>
                                                                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                                                                                    {competition.team.total.members.toLocaleString()} members
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative bg-gradient-to-br from-zinc-800/30 to-zinc-900/20 border border-zinc-800/40 rounded-xl p-5 opacity-60">
                                                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                                                            <div className="w-2 h-2 rounded-full bg-zinc-600" />
                                                                            Teams
                                                                        </div>
                                                                        <div className="text-xl font-bold text-zinc-600">0</div>
                                                                        <div className="text-xs text-zinc-600 mt-2">No team registrations</div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                                            {/* Individual Registration Details */}
                                                                            {competition.individual.registrations && competition.individual.registrations.length > 0 && (
                                                                                <div className="mt-8 pt-8 border-t-2 border-zinc-800/80">
                                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                                                                        <div>
                                                                                            <h5 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3 mb-1">
                                                                                                <div className="w-2.5 h-6 bg-gradient-to-b from-green-500 to-emerald-400 rounded-full shadow-lg shadow-green-500/40"></div>
                                                                                                Individual Registration Details
                                                                                            </h5>
                                                                                            <p className="text-xs text-zinc-400 ml-5">View detailed information for each registered participant</p>
                                                                                        </div>
                                                                                        <div className="text-xs text-zinc-300 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg backdrop-blur-sm font-semibold">
                                                                                            Total: <span className="text-green-300 font-bold">{competition.individual.registrations.length.toLocaleString()}</span> participants
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-3 mb-4">
                                                                                        {(() => {
                                                                                            const otherCount = competition.individual.other;
                                                                                            const klCount = competition.individual.kl;
                                                                                            const hasOtherData = otherCount > 0;
                                                                                            const hasKLData = klCount > 0;
                                                                                            const otherIsSelected = expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "other";
                                                                                            const klIsSelected = expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "kl";
                                                                                            
                                                                                            // Prioritize Other Colleges if it has data, otherwise prioritize KL if it has data
                                                                                            const otherIsPrimary = hasOtherData && (otherCount >= klCount || !hasKLData);
                                                                                            const klIsPrimary = hasKLData && !otherIsPrimary;
                                                                                            
                                                                                            return (
                                                                                                <>
                                                                                                    {/* Other Colleges Button - Highlighted only if it has data */}
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            setExpandedCollege(
                                                                                                                otherIsSelected
                                                                                                                    ? { categoryId: "", competitionId: "", college: null }
                                                                                                                    : { categoryId: category.id, competitionId: competition.id, college: "other" }
                                                                                                            )
                                                                                                        }
                                                                                                        disabled={!hasOtherData}
                                                                                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                                                                                            !hasOtherData
                                                                                                                ? "opacity-50 cursor-not-allowed bg-zinc-800/30 border-2 border-zinc-700/30 text-zinc-500"
                                                                                                                : otherIsSelected
                                                                                                                ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl shadow-green-500/30 border-2 border-green-400/50 scale-105"
                                                                                                                : otherIsPrimary
                                                                                                                ? "bg-gradient-to-r from-green-600/40 to-green-700/30 text-white border-2 border-green-500/60 hover:border-green-400/80 hover:bg-green-600/50 shadow-lg shadow-green-500/30"
                                                                                                                : "bg-gradient-to-r from-green-600/20 to-green-700/10 text-green-200 border-2 border-green-500/40 hover:border-green-400/60 hover:bg-green-600/30 shadow-md shadow-green-500/10"
                                                                                                        }`}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                                                                                                otherIsSelected ? "bg-white shadow-lg shadow-white/50" : hasOtherData ? "bg-green-300 shadow-md shadow-green-300/50" : "bg-zinc-500"
                                                                                                            }`} />
                                                                                                            <span>Other Colleges</span>
                                                                                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                                                                                                otherIsSelected
                                                                                                                    ? "bg-white/20 text-white"
                                                                                                                    : hasOtherData
                                                                                                                    ? "bg-white/15 text-green-100"
                                                                                                                    : "bg-zinc-900/50 text-zinc-500"
                                                                                                            }`}>
                                                                                                                {otherCount.toLocaleString()}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </button>
                                                                                                    {/* KL University Button */}
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            setExpandedCollege(
                                                                                                                klIsSelected
                                                                                                                    ? { categoryId: "", competitionId: "", college: null }
                                                                                                                    : { categoryId: category.id, competitionId: competition.id, college: "kl" }
                                                                                                            )
                                                                                                        }
                                                                                                        disabled={!hasKLData}
                                                                                                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                                                                                            !hasKLData
                                                                                                                ? "opacity-50 cursor-not-allowed bg-zinc-800/30 border-2 border-zinc-700/30 text-zinc-500"
                                                                                                                : klIsSelected
                                                                                                                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl shadow-red-500/30 border-2 border-red-400/50 scale-105"
                                                                                                                : klIsPrimary
                                                                                                                ? "bg-gradient-to-r from-red-600/40 to-red-700/30 text-white border-2 border-red-500/60 hover:border-red-400/80 hover:bg-red-600/50 shadow-lg shadow-red-500/30"
                                                                                                                : "bg-gradient-to-r from-red-600/20 to-red-700/10 text-red-200 border-2 border-red-500/40 hover:border-red-400/60 hover:bg-red-600/30 shadow-md shadow-red-500/10"
                                                                                                        }`}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                                                                                                klIsSelected ? "bg-white shadow-lg shadow-white/50" : hasKLData ? "bg-red-300 shadow-md shadow-red-300/50" : "bg-zinc-500"
                                                                                                            }`} />
                                                                                                            <span>KL University</span>
                                                                                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                                                                                                klIsSelected
                                                                                                                    ? "bg-white/20 text-white"
                                                                                                                    : hasKLData
                                                                                                                    ? "bg-white/15 text-red-100"
                                                                                                                    : "bg-zinc-900/50 text-zinc-500"
                                                                                                            }`}>
                                                                                                                {klCount.toLocaleString()}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </button>
                                                                                                </>
                                                                                            );
                                                                                        })()}
                                                                                    </div>

                                                                                    {/* Show table for current competition; when no toggle is selected, show all colleges */}
                                                                                    {expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && (
                                                        <div className="overflow-x-auto rounded-lg border border-zinc-800/50 bg-zinc-900/30">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-zinc-800/50 border-b border-zinc-800/50">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Name</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">College</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">College ID</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Branch</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Year</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gender</th>
                                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Phone</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-zinc-800/50">
                                                                    {competition.individual.registrations
                                                                        .filter((reg: any) => {
                                                                            const isKL = isKLUniversity(reg.user);
                                                                            if (!expandedCollege.college) return true;
                                                                            return expandedCollege.college === "kl" ? isKL : !isKL;
                                                                        })
                                                                        .map((reg: any) => (
                                                                            <tr key={reg.id} className="hover:bg-zinc-800/20 transition-colors">
                                                                                <td className="px-4 py-3 text-white font-medium">{reg.user.name || "N/A"}</td>
                                                                                <td className="px-4 py-3 text-zinc-300">{reg.user.email}</td>
                                                                                <td className="px-4 py-3 text-zinc-300">{reg.user.collage || "N/A"}</td>
                                                                                <td className="px-4 py-3 text-zinc-300">{reg.user.collageId || "N/A"}</td>
                                                                                <td className="px-4 py-3 text-zinc-300">{reg.user.branch || "N/A"}</td>
                                                                                <td className="px-4 py-3 text-zinc-300">{reg.user.year || "N/A"}</td>
                                                                                <td className="px-4 py-3">
                                                                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                                                        reg.user.gender?.toUpperCase() === "MALE" 
                                                                                            ? "bg-blue-500/20 text-blue-300" 
                                                                                            : reg.user.gender?.toUpperCase() === "FEMALE"
                                                                                            ? "bg-pink-500/20 text-pink-300"
                                                                                            : "bg-zinc-800/50 text-zinc-400"
                                                                                    }`}>
                                                                                        {reg.user.gender || "N/A"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-zinc-300">{reg.user.phone || "N/A"}</td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            )}

                                                                            {/* Team Registration Details - Enhanced */}
                                                                            {competition.team.registrations && competition.team.registrations.length > 0 && (
                                                                                <div className="mt-8 pt-8 border-t-2 border-zinc-800/80">
                                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                                                                        <div>
                                                                                            <h5 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3 mb-1">
                                                                                                <div className="w-2.5 h-6 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/40"></div>
                                                                                                Team Registration Details
                                                                                            </h5>
                                                                                            <p className="text-xs text-zinc-400 ml-5">View detailed information for each registered team</p>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="text-xs text-zinc-300 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg backdrop-blur-sm font-semibold">
                                                                                                Total: <span className="text-purple-300 font-bold">{competition.team.registrations.length.toLocaleString()}</span> teams
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-3 mb-5">
                                                                                        {/* Determine which button should be more prominent based on data */}
                                                                                        {(() => {
                                                                                            const otherTeamsCount = competition.team.other.teams;
                                                                                            const klTeamsCount = competition.team.kl.teams;
                                                                                            const hasOtherData = otherTeamsCount > 0;
                                                                                            const hasKLData = klTeamsCount > 0;
                                                                                            const otherIsSelected = expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "other";
                                                                                            const klIsSelected = expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "kl";
                                                                                            
                                                                                            // Prioritize Other College Teams if it has data, otherwise prioritize KL if it has data
                                                                                            const otherIsPrimary = hasOtherData && (otherTeamsCount >= klTeamsCount || !hasKLData);
                                                                                            const klIsPrimary = hasKLData && !otherIsPrimary;
                                                                                            
                                                                                            return (
                                                                                                <>
                                                                                                    {/* Other College Teams Button - Highlighted only if it has data */}
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            setExpandedCollege(
                                                                                                                otherIsSelected
                                                                                                                    ? { categoryId: "", competitionId: "", college: null }
                                                                                                                    : { categoryId: category.id, competitionId: competition.id, college: "other" }
                                                                                                            )
                                                                                                        }
                                                                                                        disabled={!hasOtherData}
                                                                                                        className={`group relative px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                                                                            !hasOtherData
                                                                                                                ? "opacity-50 cursor-not-allowed bg-zinc-800/30 border-2 border-zinc-700/30 text-zinc-500"
                                                                                                                : otherIsSelected
                                                                                                                ? "bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white shadow-2xl shadow-purple-500/40 border-2 border-purple-300/70 scale-105"
                                                                                                                : otherIsPrimary
                                                                                                                ? "bg-gradient-to-r from-purple-600/40 via-purple-500/30 to-purple-600/40 text-white border-2 border-purple-500/60 hover:border-purple-400/80 hover:bg-purple-600/50 shadow-lg shadow-purple-500/30"
                                                                                                                : "bg-gradient-to-r from-purple-600/20 via-purple-500/10 to-purple-600/20 text-purple-200 border-2 border-purple-500/40 hover:border-purple-400/60 hover:bg-purple-600/30 shadow-md shadow-purple-500/10"
                                                                                                        }`}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-3">
                                                                                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                                                                                                otherIsSelected ? "bg-white shadow-lg shadow-white/50" : hasOtherData ? "bg-purple-300 shadow-md shadow-purple-300/50" : "bg-zinc-500"
                                                                                                            }`} />
                                                                                                            <span>Other College Teams</span>
                                                                                                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                                                                                                otherIsSelected
                                                                                                                    ? "bg-white/20 text-white"
                                                                                                                    : hasOtherData
                                                                                                                    ? "bg-white/15 text-purple-100"
                                                                                                                    : "bg-zinc-900/50 text-zinc-500"
                                                                                                            }`}>
                                                                                                                {otherTeamsCount.toLocaleString()}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </button>
                                                                                                    {/* KL Teams Button */}
                                                                                                    <button
                                                                                                        onClick={() =>
                                                                                                            setExpandedCollege(
                                                                                                                klIsSelected
                                                                                                                    ? { categoryId: "", competitionId: "", college: null }
                                                                                                                    : { categoryId: category.id, competitionId: competition.id, college: "kl" }
                                                                                                            )
                                                                                                        }
                                                                                                        disabled={!hasKLData}
                                                                                                        className={`group relative px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                                                                            !hasKLData
                                                                                                                ? "opacity-50 cursor-not-allowed bg-zinc-800/30 border-2 border-zinc-700/30 text-zinc-500"
                                                                                                                : klIsSelected
                                                                                                                ? "bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white shadow-2xl shadow-red-500/40 border-2 border-red-300/70 scale-105"
                                                                                                                : klIsPrimary
                                                                                                                ? "bg-gradient-to-r from-red-600/40 via-red-500/30 to-red-600/40 text-white border-2 border-red-500/60 hover:border-red-400/80 hover:bg-red-600/50 shadow-lg shadow-red-500/30"
                                                                                                                : "bg-gradient-to-r from-red-600/20 via-red-500/10 to-red-600/20 text-red-200 border-2 border-red-500/40 hover:border-red-400/60 hover:bg-red-600/30 shadow-md shadow-red-500/10"
                                                                                                        }`}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-3">
                                                                                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                                                                                                klIsSelected ? "bg-white shadow-lg shadow-white/50" : hasKLData ? "bg-red-300 shadow-md shadow-red-300/50" : "bg-zinc-500"
                                                                                                            }`} />
                                                                                                            <span>KL Teams</span>
                                                                                                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                                                                                                klIsSelected
                                                                                                                    ? "bg-white/20 text-white"
                                                                                                                    : hasKLData
                                                                                                                    ? "bg-white/15 text-red-100"
                                                                                                                    : "bg-zinc-900/50 text-zinc-500"
                                                                                                            }`}>
                                                                                                                {klTeamsCount.toLocaleString()}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </button>
                                                                                                </>
                                                                                            );
                                                                                        })()}
                                                                                    </div>

                                                                                    {/* Enhanced Team List (defaults to all colleges if no toggle selected) */}
                                                                                    {expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && (
                                                                                        <div className="space-y-5">
                                                                                            {competition.team.registrations
                                                                                                .filter((reg: any) => {
                                                                                                    const isKL = isKLUniversity(reg.user);
                                                                                                    if (!expandedCollege.college) return true;
                                                                                                    return expandedCollege.college === "kl" ? isKL : !isKL;
                                                                                                })
                                                                                                                                .map((reg: any, teamIdx: number) => {
                                                                                                                                    const members = reg.members as Record<string, any> | null;
                                                                                                                                    const memberList = members ? Object.values(members) : [];
                                                                                                                                    const rd = reg.registrationDetails as Record<string, any> | null;
                                                                                                                                    const hasInGameId = rd?.teamLeadInGameId ?? memberList.some((m: any) => m.inGameId);
                                                                                                                                    const hasRiotId = rd?.teamLeadRiotId ?? memberList.some((m: any) => m.riotId);
                                                                                                                                    const hasInGameFields = hasInGameId || hasRiotId || memberList.some((m: any) => m.inGameName);
                                                                                                                                    return (
                                                                                                        <div 
                                                                                                            key={reg.id} 
                                                                                                            className="relative group/team bg-gradient-to-br from-zinc-900/60 via-zinc-950/50 to-zinc-900/60 border-2 border-zinc-800/60 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:border-purple-500/40 transition-all duration-300 overflow-hidden"
                                                                                                            style={{ animationDelay: `${teamIdx * 50}ms` }}
                                                                                                        >
                                                                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover/team:opacity-100 transition-opacity duration-300" />
                                                                                                            
                                                                                                            <div className="relative z-10">
                                                                                                                <div className="mb-5 pb-5 border-b-2 border-zinc-800/50">
                                                                                                                    <div className="flex items-start justify-between mb-3">
                                                                                                                        <div className="flex-1">
                                                                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                                                                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 animate-pulse" />
                                                                                                                                <h6 className="text-lg font-extrabold text-white group-hover/team:text-purple-300 transition-colors">
                                                                                                                                    {reg.groupName || "Unnamed Team"}
                                                                                                                                </h6>
                                                                                                                            </div>
                                                                                                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                                                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
                                                                                                                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                                                                                    </svg>
                                                                                                                                    <span className="text-zinc-300">
                                                                                                                                        <span className="text-zinc-400">Leader:</span> <span className="text-white font-bold">{reg.user.name || "N/A"}</span>
                                                                                                                                    </span>
                                                                                                                                </div>
                                                                                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
                                                                                                                                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                                                                                    </svg>
                                                                                                                                    <span className="text-zinc-300 text-xs">{reg.user.email}</span>
                                                                                                                                </div>
                                                                                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
                                                                                                                                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                                                                                    </svg>
                                                                                                                                    <span className="text-zinc-300 text-xs">
                                                                                                                                        <span className="text-zinc-400">College:</span> <span className="text-white font-semibold">{reg.user.collage || "N/A"}</span>
                                                                                                                                    </span>
                                                                                                                                </div>
                                                                                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg backdrop-blur-sm">
                                                                                                                                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                                                                                    </svg>
                                                                                                                                    <span className="text-zinc-300 text-xs font-mono">{reg.user.phone || "N/A"}</span>
                                                                                                                                </div>
                                                                                                                                {(() => {
                                                                                                                                    const rd = reg.registrationDetails as Record<string, any> | null;
                                                                                                                                    const ign = rd?.teamLeadInGameName;
                                                                                                                                    if (!ign) return null;
                                                                                                                                    const isFFBGMI = rd?.teamLeadInGameId;
                                                                                                                                    const isVal = rd?.teamLeadRiotId;
                                                                                                                                    return (
                                                                                                                                        <>
                                                                                                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg backdrop-blur-sm">
                                                                                                                                                <span className="text-amber-400 text-xs font-semibold">IGN:</span>
                                                                                                                                                <span className="text-white text-xs">{ign}</span>
                                                                                                                                            </div>
                                                                                                                                            {(isFFBGMI || isVal) && (
                                                                                                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg backdrop-blur-sm">
                                                                                                                                                    <span className="text-amber-400 text-xs font-semibold">{isVal ? "Riot ID:" : "In-game ID:"}</span>
                                                                                                                                                    <span className="text-white text-xs font-mono">{isVal ? rd.teamLeadRiotId : rd.teamLeadInGameId}</span>
                                                                                                                                                </div>
                                                                                                                                            )}
                                                                                                                                        </>
                                                                                                                                    );
                                                                                                                                })()}
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                                
                                                                                                                {memberList.length > 0 && (
                                                                                                                    <div className="mt-5">
                                                                                                                        <div className="flex items-center justify-between mb-4">
                                                                                                                            <h6 className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                                                                                                                                <div className="w-1.5 h-4 bg-gradient-to-b from-purple-500 to-purple-400 rounded-full"></div>
                                                                                                                                Team Members ({memberList.length})
                                                                                                                            </h6>
                                                                                                                        </div>
                                                                                                                        <div className="relative overflow-hidden rounded-xl border-2 border-zinc-800/60 bg-gradient-to-br from-zinc-950/60 via-zinc-900/40 to-zinc-950/60 backdrop-blur-sm shadow-xl">
                                                                                                                            <div className="overflow-x-auto">
                                                                                                                                <table className="w-full">
                                                                                                                                    <thead className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/60 border-b-2 border-zinc-800/70 sticky top-0 z-10">
                                                                                                                                        <tr>
                                                                                                                                            <th className="px-4 py-3 text-left text-xs font-extrabold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Name</th>
                                                                                                                                            <th className="px-4 py-3 text-left text-xs font-extrabold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Gender</th>
                                                                                                                                            <th className="px-4 py-3 text-left text-xs font-extrabold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Phone</th>
                                                                                                                                            {hasInGameFields && (
                                                                                                                                                <>
                                                                                                                                                    <th className="px-4 py-3 text-left text-xs font-extrabold text-zinc-300 uppercase tracking-widest whitespace-nowrap">In-game Name</th>
                                                                                                                                                    {hasInGameId && <th className="px-4 py-3 text-left text-xs font-extrabold text-zinc-300 uppercase tracking-widest whitespace-nowrap">In-game ID</th>}
                                                                                                                                                    {hasRiotId && <th className="px-4 py-3 text-left text-xs font-extrabold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Riot ID</th>}
                                                                                                                                                </>
                                                                                                                                            )}
                                                                                                                                        </tr>
                                                                                                                                    </thead>
                                                                                                                                    <tbody className="divide-y divide-zinc-800/50">
                                                                                                                                        {memberList.map((member: any, idx: number) => (
                                                                                                                                            <tr 
                                                                                                                                                key={idx} 
                                                                                                                                                className="group/member hover:bg-zinc-800/30 transition-all duration-200 border-b border-zinc-800/30"
                                                                                                                                                style={{ animationDelay: `${idx * 20}ms` }}
                                                                                                                                            >
                                                                                                                                                <td className="px-4 py-3 text-white font-semibold group-hover/member:text-white transition-colors">
                                                                                                                                                    {member.name || <span className="text-zinc-500 italic">N/A</span>}
                                                                                                                                                </td>
                                                                                                                                                <td className="px-4 py-3">
                                                                                                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                                                                                                                                                        member.gender?.toUpperCase() === "MALE" 
                                                                                                                                                            ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 text-blue-300 shadow-lg shadow-blue-500/10" 
                                                                                                                                                            : member.gender?.toUpperCase() === "FEMALE"
                                                                                                                                                            ? "bg-gradient-to-r from-pink-500/20 to-pink-600/10 border border-pink-500/30 text-pink-300 shadow-lg shadow-pink-500/10"
                                                                                                                                                            : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400"
                                                                                                                                                    }`}>
                                                                                                                                                        {member.gender ? (
                                                                                                                                                            <>
                                                                                                                                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                                                                                                                                    member.gender?.toUpperCase() === "MALE" ? "bg-blue-400" : "bg-pink-400"
                                                                                                                                                                }`} />
                                                                                                                                                                {member.gender}
                                                                                                                                                            </>
                                                                                                                                                        ) : (
                                                                                                                                                            "N/A"
                                                                                                                                                        )}
                                                                                                                                                    </span>
                                                                                                                                                </td>
                                                                                                                                                <td className="px-4 py-3 text-zinc-300 group-hover/member:text-white transition-colors font-mono text-xs">
                                                                                                                                                    {member.phone || <span className="text-zinc-500 italic">N/A</span>}
                                                                                                                                                </td>
                                                                                                                                                {hasInGameFields && (
                                                                                                                                                    <>
                                                                                                                                                        <td className="px-4 py-3 text-amber-300 group-hover/member:text-amber-200 transition-colors text-xs">
                                                                                                                                                            {member.inGameName || <span className="text-zinc-500 italic">-</span>}
                                                                                                                                                        </td>
                                                                                                                                                        {hasInGameId && (
                                                                                                                                                            <td className="px-4 py-3 text-zinc-300 group-hover/member:text-white transition-colors font-mono text-xs">
                                                                                                                                                                {member.inGameId || <span className="text-zinc-500 italic">-</span>}
                                                                                                                                                            </td>
                                                                                                                                                        )}
                                                                                                                                                        {hasRiotId && (
                                                                                                                                                            <td className="px-4 py-3 text-zinc-300 group-hover/member:text-white transition-colors font-mono text-xs">
                                                                                                                                                                {member.riotId || <span className="text-zinc-500 italic">-</span>}
                                                                                                                                                            </td>
                                                                                                                                                        )}
                                                                                                                                                    </>
                                                                                                                                                )}
                                                                                                                                            </tr>
                                                                                                                                        ))}
                                                                                                                                    </tbody>
                                                                                                                                </table>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
