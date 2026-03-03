"use client";

import { useEffect, useState } from "react";
import { getEventResults } from "@/actions/results.action";
import Loader from "@/components/ui/Loader";
import { FiFilter, FiUser, FiUsers, FiLock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

import { useSearchParams } from "next/navigation";

interface EventMeta {
    name?: string | null;
    slug?: string | null;
    Category?: { name?: string | null } | null;
}

interface ParticipantResult {
    id: string;
    name: string;
    type: "GROUP" | "INDIVIDUAL";
    collageId: string | null;
    score: number;
    isEvaluated: boolean;
    remarks: string | null;
    judgeScores?: Array<{
        judgeId: string;
        judgeName: string | null;
        score: number;
        remarks: string | null;
    }>;
    criteriaBreakdown?: Array<{
        key: string;
        label: string;
        max: number;
        score: number;
    }> | null;
}

function normalizeText(value?: string | null): string {
    return (value || "").trim().toLowerCase();
}

function isCinecarnicalCategory(categoryName?: string): boolean {
    const category = normalizeText(categoryName);
    return (
        category.includes("cinecarnical") ||
        category.includes("cine carnival") ||
        category.includes("cinecarnival")
    );
}

function getMaxScorePerJudge(categoryName?: string, eventName?: string): number {
    const category = normalizeText(categoryName);
    const event = normalizeText(eventName);

    if (category.includes("natyaka")) {
        if (event.includes("mono") && event.includes("action")) return 50;
        if (event.includes("skit")) return 60;
        return 10;
    }

    if (isCinecarnicalCategory(categoryName)) {
        if (event.includes("short") && event.includes("film")) return 100;
        if (event.includes("cover") && event.includes("song")) return 100;
        return 10;
    }

    return 10;
}

export default function ResultsPage() {
    const searchParams = useSearchParams();
    const selectedEvent = searchParams.get("event") || "";
    const [eventMeta, setEventMeta] = useState<EventMeta | null>(null);
    const [results, setResults] = useState<ParticipantResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const { data: session } = useSession();
    const [isPublished, setIsPublished] = useState(false);
    const maxScorePerJudge = getMaxScorePerJudge(eventMeta?.Category?.name || "", eventMeta?.name || "");

    const loadEventResults = async (eventSlug: string) => {
        if (!eventSlug) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadingResults(true);
        const res = await getEventResults(eventSlug);
        if (res.success) {
            setIsPublished(res.data?.isPublished ?? false);
            setEventMeta({
                name: res.data?.event?.name,
                slug: res.data?.event?.slug,
                Category: res.data?.event?.Category ? { name: res.data.event.Category.name } : null
            });
            const evaluated: ParticipantResult[] = (res.data?.participants || [])
                .filter((p: any) => p.isEvaluated && p.score > 0)
                .map((p: any) => ({
                    id: p.id,
                    name: p.name || "Unknown",
                    type: p.type as "GROUP" | "INDIVIDUAL",
                    collageId: p.collageId,
                    score: p.score,
                    isEvaluated: p.isEvaluated,
                    remarks: p.remarks || null,
                    judgeScores: Array.isArray(p.judgeScores) ? p.judgeScores : [],
                    criteriaBreakdown: Array.isArray(p.criteriaBreakdown) ? p.criteriaBreakdown : null,
                }));
            setResults(evaluated);
        } else {
            toast.error(res.error);
        }
        setLoadingResults(false);
        setLoading(false);
    };

    const getRankInfo = (index: number, allResults: ParticipantResult[]) => {
        let rank = 1;
        let isDraw = false;

        if (index > 0) {
            const prevScore = allResults[index - 1].score;
            const currScore = allResults[index].score;
            if (prevScore === currScore) {
                isDraw = true;
                let i = index - 1;
                while (i >= 0 && allResults[i].score === currScore) {
                    i--;
                }
                rank = i + 2;
            } else {
                rank = index + 1;
            }
        } else {
            rank = 1;
        }

        return { rank, isDraw };
    };



    useEffect(() => {
        loadEventResults(selectedEvent);
    }, [searchParams]);

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 font-[family-name:var(--font-Schibsted_Grotesk)] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-gray-500">
                        Event Results
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        {eventMeta?.name ? (
                            <>
                                Showing results for <span className="text-white font-semibold">{eventMeta.name}</span>
                                {eventMeta.Category?.name ? (
                                    <> in <span className="text-white font-semibold">{eventMeta.Category.name}</span></>
                                ) : null}
                                .
                            </>
                        ) : (
                            "Results are available per event."
                        )}
                    </p>
                </div>

                {/* Results Display */}
                <div className="min-h-[400px]">
                    {loadingResults ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-400">Crunching the numbers...</p>
                        </div>
                    ) : selectedEvent && results.length > 0 ? (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {results.map((result, index) => {
                                const { rank, isDraw } = getRankInfo(index, results);
                                const isUser = session?.user?.id === result.id; // Not foolproof for group leader ID vs user ID, but acceptable for now
                                // Note: result.id is Leader ID for groups in my getEventResults implementation logic (userId)
                                const judgeCount = result.judgeScores?.length || 0;
                                const totalScore = judgeCount > 0
                                    ? result.judgeScores!.reduce((sum, j) => sum + (j.score || 0), 0)
                                    : result.score;
                                const totalMax = maxScorePerJudge * (judgeCount || 1);

                                return (
                                    <motion.div
                                        key={result.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative rounded-xl"
                                    >
                                        <div className={`relative flex flex-col gap-4 p-4 sm:p-6 rounded-xl border transition-all hover:scale-[1.01] ${isUser ? 'bg-zinc-900 border-red-500/50 shadow-lg' : 'bg-zinc-900/50 border-white/10'}`}>
                                            {/* Main Row */}
                                            <div className="flex items-center gap-4 sm:gap-6">
                                                {/* Rank */}
                                                <div className="flex-shrink-0 w-16 h-16 flex flex-col items-center justify-center text-center">
                                                    <span className="text-3xl sm:text-4xl font-black text-white">
                                                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                                                    </span>
                                                    {isDraw && (
                                                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 mt-1">
                                                            (Draw)
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl sm:text-2xl font-bold truncate mb-1 text-white">
                                                        {result.name}
                                                        {isUser && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full align-middle">YOU</span>}
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-gray-400 flex items-center gap-2">
                                                        {result.type === 'GROUP' ? <FiUsers /> : <FiUser />}
                                                        {result.collageId || "No ID"}
                                                    </p>
                                                </div>

                                                {/* Score */}
                                                <div className="flex-shrink-0 text-right">
                                                    <div className="text-2xl sm:text-4xl font-black text-white">
                                                        {parseFloat(totalScore.toFixed(2))}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-400 uppercase font-medium tracking-wider">
                                                        Total Score
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                                        /{totalMax}
                                                    </div>
                                                    {!!result.judgeScores?.length && (
                                                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                                            Avg of {result.judgeScores.length} judge{result.judgeScores.length === 1 ? "" : "s"}: {result.score}/{maxScorePerJudge}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Per-judge breakdown */}
                                            {!!result.judgeScores?.length && (
                                                <div className="pt-4 border-t border-white/10">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const next = new Set(expandedIds);
                                                            if (next.has(result.id)) next.delete(result.id);
                                                            else next.add(result.id);
                                                            setExpandedIds(next);
                                                        }}
                                                        className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
                                                    >
                                                        {expandedIds.has(result.id) ? "Hide judge scores" : "Show judge scores"}
                                                    </button>

                                                    <AnimatePresence>
                                                        {expandedIds.has(result.id) && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {result.judgeScores
                                                                        .slice()
                                                                        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                                                                        .map((j) => (
                                                                            <div
                                                                                key={j.judgeId}
                                                                                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between gap-3"
                                                                            >
                                                                                <div className="min-w-0">
                                                                                    <div className="text-xs text-gray-400 truncate">
                                                                                        {j.judgeName || "Judge"}
                                                                                    </div>
                                                                                    {j.remarks && (
                                                                                        <div className="text-[11px] text-gray-500 truncate">
                                                                                            {j.remarks}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-sm font-bold text-white">
                                                                                    {j.score}/{maxScorePerJudge}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}

                                            {/* Criteria-wise breakdown */}
                                            {!!result.criteriaBreakdown?.length && (
                                                <div className="pt-4 border-t border-white/10">
                                                    <p className="text-sm text-gray-300 font-medium mb-2">Evaluation Criteria</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {result.criteriaBreakdown.map((c) => (
                                                            <div
                                                                key={c.key}
                                                                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between gap-3"
                                                            >
                                                                <div className="text-xs text-gray-300">{c.label}</div>
                                                                <div className="text-sm font-bold text-white">
                                                                    {c.score}/{c.max}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-400">
                                                        Total from criteria:{" "}
                                                        <span className="text-white font-semibold">
                                                            {parseFloat(
                                                                result.criteriaBreakdown
                                                                    .reduce((sum, c) => sum + c.score, 0)
                                                                    .toFixed(2)
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Remarks */}
                                            {result.remarks && (
                                                <div className="pt-4 border-t border-white/10">
                                                    <p className="text-sm text-gray-400 mb-1 font-medium">Remarks:</p>
                                                    <p className="text-sm text-gray-300 italic">{result.remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : selectedEvent ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 max-w-2xl mx-auto">
                            {isPublished ? (
                                <>
                                    <FiFilter className="mx-auto text-6xl text-gray-600 mb-4" />
                                    <h3 className="text-2xl font-bold text-gray-400 mb-2">No Evaluations Yet</h3>
                                    <p className="text-gray-500">Evaluations for this event have not been submitted.</p>
                                </>
                            ) : (
                                <>
                                    <FiLock className="mx-auto text-6xl text-gray-600 mb-4" />
                                    <h3 className="text-2xl font-bold text-gray-400 mb-2">Results Not Released</h3>
                                    <p className="text-gray-500">Evaluations are yet to be released by the administration.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <FiFilter className="text-6xl text-gray-600 mb-6" />
                            <p className="text-xl text-gray-400 font-medium">Open results from a specific competition to view them.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

