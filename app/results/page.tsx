"use client";

import { useEffect, useState } from "react";
import { getCategories, getEventsByCategory, getEventResults } from "@/actions/results.action";
import Loader from "@/components/ui/Loader";
import { FiAward, FiChevronDown, FiSearch, FiCalendar, FiFilter, FiUser, FiUsers, FiLock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

import { useSearchParams } from "next/navigation";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface Event {
    id: string;
    name: string;
    slug: string;
    isGroupEvent: boolean;
}

interface ParticipantResult {
    id: string;
    name: string;
    type: "GROUP" | "INDIVIDUAL";
    collageId: string | null;
    score: number;
    isEvaluated: boolean;
}

export default function ResultsPage() {
    const searchParams = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedEvent, setSelectedEvent] = useState<string>("");
    const [results, setResults] = useState<ParticipantResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    const { data: session } = useSession();
    const [isPublished, setIsPublished] = useState(true);



    const loadCategories = async () => {
        const res = await getCategories();
        if (res.success) {
            setCategories(res.data || []);
        }
        setLoading(false);
    };

    const handleCategoryChange = async (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedEvent("");
        setResults([]);
        setIsPublished(true);
        setLoadingEvents(true);
        const res = await getEventsByCategory(categoryId);
        if (res.success) {
            setEvents(res.data || []);
        }
        setLoadingEvents(false);
    };

    const handleEventChange = async (eventSlug: string) => {
        setSelectedEvent(eventSlug);
        setLoadingResults(true);
        const res = await getEventResults(eventSlug);
        if (res.success) {
            setIsPublished(res.data?.isPublished ?? true);
            const evaluated: ParticipantResult[] = (res.data?.participants || [])
                .filter((p: any) => p.isEvaluated && p.score > 0)
                .map((p: any) => ({
                    id: p.id,
                    name: p.name || "Unknown",
                    type: p.type as "GROUP" | "INDIVIDUAL",
                    collageId: p.collageId,
                    score: p.score,
                    isEvaluated: p.isEvaluated
                }));
            setResults(evaluated);
        } else {
            toast.error(res.error);
        }
        setLoadingResults(false);
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



    // Initial Load
    useEffect(() => {
        loadCategories();
    }, []);

    // Check query params
    useEffect(() => {
        const catId = searchParams.get('category');
        const eventSlug = searchParams.get('event');

        if (catId) {
            setSelectedCategory(catId);

            const loadDeepLink = async () => {
                // We need to fetch events for this category
                // We can't rely on handleCategoryChange because we need to await it and then fetch results
                // And handleCategoryChange updates state which might not be immediate for next read?
                // Actually async state updates are batched but we can await the PROMISE of the fetch.

                // Fetch events
                setLoadingEvents(true);
                const eventsRes = await getEventsByCategory(catId);
                if (eventsRes.success) {
                    setEvents(eventsRes.data || []);
                    setLoadingEvents(false);

                    if (eventSlug) {
                        setSelectedEvent(eventSlug);
                        await handleEventChange(eventSlug);
                    }
                } else {
                    setLoadingEvents(false);
                }
            };
            loadDeepLink();
        }
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
                        Check out the top performers and final standings for all events at Surabhi 2026.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-12 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Select Category</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                                    value={selectedCategory}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                >
                                    <option value="">-- Choose Category --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Event Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Select Event</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={selectedEvent}
                                    onChange={(e) => handleEventChange(e.target.value)}
                                    disabled={!selectedCategory || loadingEvents}
                                >
                                    <option value="">{loadingEvents ? "Loading Events..." : "-- Choose Event --"}</option>
                                    {events.map(evt => (
                                        <option key={evt.id} value={evt.slug}>{evt.name}</option>
                                    ))}
                                </select>
                                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
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

                                return (
                                    <motion.div
                                        key={result.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`relative rounded-xl p-1 ${isUser ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-pulse' : ''} ${rank <= 3 && !isUser ? 'bg-gradient-to-r from-transparent via-white/5 to-transparent' : ''}`}
                                    >
                                        <div className={`relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl border transition-all hover:scale-[1.01] ${isUser ? 'bg-zinc-900 border-transparent shadow-2xl' : rank === 1 ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 border-yellow-500/50 text-yellow-500' : rank === 2 ? 'bg-gradient-to-r from-slate-400/20 to-slate-200/10 border-slate-400/50 text-slate-300' : rank === 3 ? 'bg-gradient-to-r from-orange-700/20 to-orange-600/10 border-orange-600/50 text-orange-400' : 'bg-zinc-900/50 border-white/10 text-gray-400'}`}>
                                            {/* Rank */}
                                            <div className="flex-shrink-0 w-16 h-16 flex flex-col items-center justify-center text-center">
                                                <span className="text-3xl sm:text-4xl font-black">
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
                                                <h3 className={`text-xl sm:text-2xl font-bold truncate mb-1 ${isUser ? 'text-white' : 'text-white'}`}>
                                                    {result.name}
                                                    {isUser && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full align-middle">YOU</span>}
                                                </h3>
                                                <p className="text-sm sm:text-base opacity-60 flex items-center gap-2">
                                                    {result.type === 'GROUP' ? <FiUsers /> : <FiUser />}
                                                    {result.collageId || "No ID"}
                                                </p>
                                            </div>

                                            {/* Score */}
                                            <div className="flex-shrink-0 text-right">
                                                <div className={`text-2xl sm:text-4xl font-black ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>
                                                    {result.score}
                                                </div>
                                                <div className="text-xs sm:text-sm opacity-40 uppercase font-medium tracking-wider">
                                                    Score
                                                </div>
                                            </div>
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
                            <p className="text-xl text-gray-400 font-medium">Select a category and event to view results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

