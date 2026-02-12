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
        <div className="min-h-screen bg-[#030303] text-white relative">
            {/* Background gradient overlay */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0a0303] via-[#1a0505] to-[#0a0303] opacity-50" />
            
            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 sm:mb-12">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-1 h-12 bg-gradient-to-b from-red-600 to-red-800 rounded-full" />
                            <div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
                                    Registration Analytics
                                </h1>
                                <p className="text-zinc-400 text-sm sm:text-base">
                                    Comprehensive registration analysis for higher officials
                                </p>
                            </div>
                        </div>
                    </div>

                {/* Overall Statistics */}
                {collegeStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                        {/* Total Participants */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-blue-500/20 rounded-xl p-6 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Participants</h3>
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-4xl font-bold text-blue-400 mb-4">
                                    {collegeStats.overall.total.participants}
                                </p>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">KL University</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.overall.kl.participants}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">Other Colleges</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.overall.other.participants}
                                        </span>
                                    </div>
                                    {collegeStats.overall.total.gender && (
                                        <>
                                            <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Male</span>
                                                <span className="text-blue-300 font-semibold">
                                                    {collegeStats.overall.total.gender.male}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Female</span>
                                                <span className="text-pink-300 font-semibold">
                                                    {collegeStats.overall.total.gender.female}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Individual Competitions */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/5 hover:shadow-green-500/10 hover:border-green-500/30 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Individual Registrations</h3>
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-4xl font-bold text-green-400 mb-4">
                                    {collegeStats.individual.total}
                                </p>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">KL University</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.individual.kl}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">Other Colleges</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.individual.other}
                                        </span>
                                    </div>
                                    {collegeStats.individual.gender && (
                                        <>
                                            <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Male</span>
                                                <span className="text-green-300 font-semibold">
                                                    {collegeStats.individual.gender.total.male}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Female</span>
                                                <span className="text-pink-300 font-semibold">
                                                    {collegeStats.individual.gender.total.female}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Team Competitions */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-purple-500/20 rounded-xl p-6 shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Team Registrations</h3>
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-4xl font-bold text-purple-400 mb-4">
                                    {collegeStats.team.total.teams}
                                </p>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">KL Teams</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.team.kl.teams}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">Other Teams</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.team.other.teams}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-1.5 px-2 rounded-md bg-zinc-900/20">
                                        <span className="text-zinc-400">Total Members</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.team.total.members}
                                        </span>
                                    </div>
                                    {collegeStats.team.total.gender && (
                                        <>
                                            <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Male</span>
                                                <span className="text-purple-300 font-semibold">
                                                    {collegeStats.team.total.gender.male}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Female</span>
                                                <span className="text-pink-300 font-semibold">
                                                    {collegeStats.team.total.gender.female}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Total Registrations */}
                        <div className="relative group bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-red-500/20 rounded-xl p-6 shadow-lg shadow-red-500/5 hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Registrations</h3>
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-4xl font-bold text-red-400 mb-4">
                                    {collegeStats.overall.total.registrations}
                                </p>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">KL University</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.overall.kl.registrations}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/30">
                                        <span className="text-zinc-400">Other Colleges</span>
                                        <span className="text-white font-semibold">
                                            {collegeStats.overall.other.registrations}
                                        </span>
                                    </div>
                                    {collegeStats.overall.total.gender && (
                                        <>
                                            <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Male</span>
                                                <span className="text-red-300 font-semibold">
                                                    {collegeStats.overall.total.gender.male}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 px-2 rounded-md bg-zinc-900/20">
                                                <span className="text-zinc-400">Female</span>
                                                <span className="text-pink-300 font-semibold">
                                                    {collegeStats.overall.total.gender.female}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Category-wise Breakdown */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-red-800 rounded-full" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Category-wise Analytics</h2>
                    </div>
                    <div className="space-y-3">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-gradient-to-br from-[#0a0a0f] via-[#14141a] to-[#0a0a0f] border border-zinc-800/50 rounded-xl overflow-hidden shadow-lg hover:border-red-500/30 transition-all duration-300"
                            >
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
                                    className="w-full p-5 text-left hover:bg-zinc-900/30 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg sm:text-xl font-bold text-white">{category.name}</h3>
                                            <span className="text-xs px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-300 font-medium">
                                                {category.competitions.length} Competition{category.competitions.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex gap-6 text-sm text-zinc-400">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                {category.overall.total.registrations} registrations
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                {category.overall.total.participants} participants
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center transition-all duration-300 group-hover:bg-red-500/10 ${
                                        expandedCategory === category.id ? "bg-red-500/20" : ""
                                    }`}>
                                        <svg
                                            className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${
                                                expandedCategory === category.id ? "rotate-180 text-red-400" : "group-hover:text-red-400"
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
                                </button>

                                {expandedCategory === category.id && (
                                    <div className="p-5 sm:p-6 border-t border-zinc-800/50 bg-gradient-to-br from-zinc-900/30 to-zinc-950/30">
                                        <div className="space-y-6">
                                            {/* Category Statistics Summary */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                                {/* Individual Registrations Stats */}
                                                {category.individual.total > 0 && (
                                                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-4">
                                                        <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                                            <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                                                            Individual Registrations
                                                        </h4>
                                                        <div className="space-y-2.5">
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/30">
                                                                <span className="text-zinc-400">KL University</span>
                                                                <span className="text-white font-semibold">
                                                                    {category.individual.kl}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/30">
                                                                <span className="text-zinc-400">Other Colleges</span>
                                                                <span className="text-white font-semibold">
                                                                    {category.individual.other}
                                                                </span>
                                                            </div>
                                                            {category.individual.gender && (
                                                                <>
                                                                    <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-2 px-3 rounded-md bg-zinc-800/20">
                                                                        <span className="text-zinc-400">Male</span>
                                                                        <span className="text-green-300 font-semibold">
                                                                            {category.individual.gender.total.male}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/20">
                                                                        <span className="text-zinc-400">Female</span>
                                                                        <span className="text-pink-300 font-semibold">
                                                                            {category.individual.gender.total.female}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-700/50 py-2 px-3 rounded-md bg-red-500/5 border-red-500/20">
                                                                <span className="text-zinc-300 font-medium">Total</span>
                                                                <span className="text-white font-bold text-lg">
                                                                    {category.individual.total}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Team Registrations Stats */}
                                                {category.team.total.teams > 0 && (
                                                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-4">
                                                        <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                                            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                                            Team Registrations
                                                        </h4>
                                                        <div className="space-y-2.5">
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/30">
                                                                <span className="text-zinc-400">KL Teams</span>
                                                                <span className="text-white font-semibold">
                                                                    {category.team.kl.teams}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/30">
                                                                <span className="text-zinc-400">KL Members</span>
                                                                <span className="text-white font-semibold">
                                                                    {category.team.kl.members}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/30">
                                                                <span className="text-zinc-400">Other Teams</span>
                                                                <span className="text-white font-semibold">
                                                                    {category.team.other.teams}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/30">
                                                                <span className="text-zinc-400">Other Members</span>
                                                                <span className="text-white font-semibold">
                                                                    {category.team.other.members}
                                                                </span>
                                                            </div>
                                                            {category.team.total.gender && (
                                                                <>
                                                                    <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-800/50 py-2 px-3 rounded-md bg-zinc-800/20">
                                                                        <span className="text-zinc-400">Male</span>
                                                                        <span className="text-purple-300 font-semibold">
                                                                            {category.team.total.gender.male}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center py-2 px-3 rounded-md bg-zinc-800/20">
                                                                        <span className="text-zinc-400">Female</span>
                                                                        <span className="text-pink-300 font-semibold">
                                                                            {category.team.total.gender.female}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                            <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-700/50 py-2 px-3 rounded-md bg-purple-500/5 border-purple-500/20">
                                                                <span className="text-zinc-300 font-medium">Total Teams</span>
                                                                <span className="text-white font-bold text-lg">
                                                                    {category.team.total.teams}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2 px-3 rounded-md bg-purple-500/5 border-purple-500/20">
                                                                <span className="text-zinc-300 font-medium">Total Members</span>
                                                                <span className="text-white font-bold text-lg">
                                                                    {category.team.total.members}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Overall Summary */}
                                                <div className="md:col-span-2">
                                                    <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                                                        Overall Summary
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4 shadow-lg shadow-red-500/5">
                                                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                                                KL University
                                                            </div>
                                                            <div className="text-2xl font-bold text-white mb-1">
                                                                {category.overall.kl.registrations}
                                                            </div>
                                                            <div className="text-sm text-zinc-400 mb-2">
                                                                registrations • {category.overall.kl.participants} participants
                                                            </div>
                                                            {category.overall.kl.gender && (
                                                                <div className="flex gap-4 text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50">
                                                                    <span>M: <span className="text-red-300 font-semibold">{category.overall.kl.gender.male}</span></span>
                                                                    <span>F: <span className="text-pink-300 font-semibold">{category.overall.kl.gender.female}</span></span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4 shadow-lg shadow-blue-500/5">
                                                            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                                                                Other Colleges
                                                            </div>
                                                            <div className="text-2xl font-bold text-white mb-1">
                                                                {category.overall.other.registrations}
                                                            </div>
                                                            <div className="text-sm text-zinc-400 mb-2">
                                                                registrations • {category.overall.other.participants} participants
                                                            </div>
                                                            {category.overall.other.gender && (
                                                                <div className="flex gap-4 text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50">
                                                                    <span>M: <span className="text-blue-300 font-semibold">{category.overall.other.gender.male}</span></span>
                                                                    <span>F: <span className="text-pink-300 font-semibold">{category.overall.other.gender.female}</span></span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Competitions within Category */}
                                            {category.competitions.length > 0 && (
                                                <div className="mt-6 pt-6 border-t border-zinc-800/50">
                                                    <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                                                        Competitions in {category.name}
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {category.competitions.map((competition) => (
                                                            <div
                                                                key={competition.id}
                                                                className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg overflow-hidden"
                                                            >
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
                                                                    className="w-full p-4 text-left hover:bg-zinc-800/30 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-1">
                                                                            <h5 className="text-base font-bold text-white">{competition.name}</h5>
                                                                            {competition.isGroupEvent && (
                                                                                <span className="text-xs px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-md text-purple-300 font-medium">
                                                                                    Team Event
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex gap-4 text-xs text-zinc-400">
                                                                            <span>{competition.overall.total.registrations} registrations</span>
                                                                            <span>{competition.overall.total.participants} participants</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center transition-all duration-300 ${
                                                                        expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id ? "bg-amber-500/20" : ""
                                                                    }`}>
                                                                        <svg
                                                                            className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                                                                                expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id ? "rotate-180 text-amber-400" : ""
                                                                            }`}
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </button>

                                                                {expandedCompetition.categoryId === category.id && expandedCompetition.competitionId === competition.id && (
                                                                    <div className="p-4 border-t border-zinc-800/50 bg-zinc-950/30">
                                                                        <div className="space-y-4">
                                                                            {/* Competition Statistics */}
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                                <div className="bg-zinc-800/30 rounded-lg p-3">
                                                                                    <div className="text-xs text-zinc-400 mb-1">Individual</div>
                                                                                    <div className="text-lg font-bold text-white">{competition.individual.total}</div>
                                                                                    <div className="text-xs text-zinc-500 mt-1">KL: {competition.individual.kl} | Other: {competition.individual.other}</div>
                                                                                </div>
                                                                                {competition.team.total.teams > 0 && (
                                                                                    <div className="bg-zinc-800/30 rounded-lg p-3">
                                                                                        <div className="text-xs text-zinc-400 mb-1">Teams</div>
                                                                                        <div className="text-lg font-bold text-white">{competition.team.total.teams}</div>
                                                                                        <div className="text-xs text-zinc-500 mt-1">{competition.team.total.members} members</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Individual Registration Details */}
                                                                            {competition.individual.registrations && competition.individual.registrations.length > 0 && (
                                                                                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                                                                    <h5 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                                                                                        <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                                                                                        Individual Registration Details
                                                                                    </h5>
                                                                                    <div className="flex gap-3 mb-4">
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                setExpandedCollege(
                                                                                                    expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "kl"
                                                                                                        ? { categoryId: "", competitionId: "", college: null }
                                                                                                        : { categoryId: category.id, competitionId: competition.id, college: "kl" }
                                                                                                )
                                                                                            }
                                                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                                                                                expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "kl"
                                                                                                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20 border border-red-500/30"
                                                                                                    : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700/50"
                                                                                            }`}
                                                                                        >
                                                                                            KL University ({competition.individual.kl})
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                setExpandedCollege(
                                                                                                    expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "other"
                                                                                                        ? { categoryId: "", competitionId: "", college: null }
                                                                                                        : { categoryId: category.id, competitionId: competition.id, college: "other" }
                                                                                                )
                                                                                            }
                                                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                                                                                expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "other"
                                                                                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
                                                                                                    : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700/50"
                                                                                            }`}
                                                                                        >
                                                                                            Other Colleges ({competition.individual.other})
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Show table only when a college is selected */}
                                                                                    {expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college && (
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

                                                                            {/* Team Registration Details */}
                                                                            {competition.team.registrations && competition.team.registrations.length > 0 && (
                                                                                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                                                                    <h5 className="text-xs font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                                                                                        <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                                                                                        Team Registration Details
                                                                                    </h5>
                                                                                    <div className="flex gap-3 mb-4">
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                setExpandedCollege(
                                                                                                    expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "kl"
                                                                                                        ? { categoryId: "", competitionId: "", college: null }
                                                                                                        : { categoryId: category.id, competitionId: competition.id, college: "kl" }
                                                                                                )
                                                                                            }
                                                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                                                                                expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "kl"
                                                                                                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20 border border-red-500/30"
                                                                                                    : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700/50"
                                                                                            }`}
                                                                                        >
                                                                                            KL Teams ({competition.team.kl.teams})
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                setExpandedCollege(
                                                                                                    expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "other"
                                                                                                        ? { categoryId: "", competitionId: "", college: null }
                                                                                                        : { categoryId: category.id, competitionId: competition.id, college: "other" }
                                                                                                )
                                                                                            }
                                                                                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                                                                                expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college === "other"
                                                                                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
                                                                                                    : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 border border-zinc-700/50"
                                                                                            }`}
                                                                                        >
                                                                                            Other Teams ({competition.team.other.teams})
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Show teams only when a college is selected */}
                                                                                    {expandedCollege.categoryId === category.id && expandedCollege.competitionId === competition.id && expandedCollege.college && (
                                                        <div className="space-y-4">
                                                            {competition.team.registrations
                                                                .filter((reg: any) => {
                                                                    const isKL = isKLUniversity(reg.user);
                                                                    return expandedCollege.college === "kl" ? isKL : !isKL;
                                                                })
                                                                .map((reg: any) => {
                                                                    const members = reg.members as Record<string, any> | null;
                                                                    const memberList = members ? Object.values(members) : [];
                                                                    return (
                                                                        <div key={reg.id} className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-5 shadow-lg">
                                                                            <div className="mb-4 pb-4 border-b border-zinc-800/50">
                                                                                <div className="font-bold text-lg text-white mb-2 flex items-center gap-2">
                                                                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                                                    {reg.groupName || "Unnamed Team"}
                                                                                </div>
                                                                                <div className="text-sm text-zinc-400 space-y-1">
                                                                                    <div>Leader: <span className="text-white font-medium">{reg.user.name || "N/A"}</span> ({reg.user.email})</div>
                                                                                    <div>College: <span className="text-white font-medium">{reg.user.collage || "N/A"}</span> | Phone: <span className="text-white font-medium">{reg.user.phone || "N/A"}</span></div>
                                                                                </div>
                                                                            </div>
                                                                            {memberList.length > 0 && (
                                                                                <div className="mt-4">
                                                                                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Team Members</div>
                                                                                    <div className="overflow-x-auto rounded-lg border border-zinc-800/50 bg-zinc-900/30">
                                                                                        <table className="w-full text-xs">
                                                                                            <thead className="bg-zinc-800/50 border-b border-zinc-800/50">
                                                                                                <tr>
                                                                                                    <th className="px-3 py-2 text-left text-zinc-400 font-semibold uppercase tracking-wider">Name</th>
                                                                                                    <th className="px-3 py-2 text-left text-zinc-400 font-semibold uppercase tracking-wider">College ID</th>
                                                                                                    <th className="px-3 py-2 text-left text-zinc-400 font-semibold uppercase tracking-wider">Branch</th>
                                                                                                    <th className="px-3 py-2 text-left text-zinc-400 font-semibold uppercase tracking-wider">Year</th>
                                                                                                    <th className="px-3 py-2 text-left text-zinc-400 font-semibold uppercase tracking-wider">Gender</th>
                                                                                                    <th className="px-3 py-2 text-left text-zinc-400 font-semibold uppercase tracking-wider">Phone</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody className="divide-y divide-zinc-800/50">
                                                                                                {memberList.map((member: any, idx: number) => (
                                                                                                    <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                                                                                                        <td className="px-3 py-2 text-white font-medium">{member.name || "N/A"}</td>
                                                                                                        <td className="px-3 py-2 text-zinc-300">{member.collageId || "N/A"}</td>
                                                                                                        <td className="px-3 py-2 text-zinc-300">{member.branch || "N/A"}</td>
                                                                                                        <td className="px-3 py-2 text-zinc-300">{member.year || "N/A"}</td>
                                                                                                        <td className="px-3 py-2">
                                                                                                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                                                                                                member.gender?.toUpperCase() === "MALE" 
                                                                                                                    ? "bg-blue-500/20 text-blue-300" 
                                                                                                                    : member.gender?.toUpperCase() === "FEMALE"
                                                                                                                    ? "bg-pink-500/20 text-pink-300"
                                                                                                                    : "bg-zinc-800/50 text-zinc-400"
                                                                                                            }`}>
                                                                                                                {member.gender || "N/A"}
                                                                                                            </span>
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2 text-zinc-300">{member.phone || "N/A"}</td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </div>
                                                                            )}
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
