"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
    FiLogOut, FiUser, FiStar, FiMessageSquare,
    FiUsers, FiCalendar, FiChevronRight, FiCheckCircle, FiLoader, FiFilter, FiSearch, FiChevronDown
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";

interface Participant {
    id: string;
    name: string | null;
    email: string;
    collageId: string | null;
    image: string | null;
}

interface Evaluation {
    id: string;
    score: number;
    remarks: string | null;
    participantId: string;
}

interface Event {
    id: string;
    name: string;
    description: string;
    venue: string;
    startTime: string;
    endTime: string | null;
    isGroupEvent: boolean;
    registeredStudents: Participant[];
    groupRegistrations: { user: Participant; groupName: string | null; members: any }[];
    evaluations: Evaluation[];
}

export default function JudgeDashboard() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [evaluatingParticipant, setEvaluatingParticipant] = useState<Participant | null>(null);
    const [score, setScore] = useState<number | "">("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/judge/login");
        } else if (session?.user?.role !== "JUDGE") {
            // If logged in but not a judge, redirect home or show error
            // Ideally this protection is also on the route or layout
        } else {
            fetchJudgeData();
        }
    }, [session, isPending, router]);

    const fetchJudgeData = async () => {
        try {
            const res = await fetch("/api/judge/data");
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events);
                setCategoryName(data.categoryName);
            } else {
                toast.error("Failed to load dashboard data");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluationSubmit = async () => {
        if (!selectedEvent || !evaluatingParticipant) return;
        if (score === "" || Number(score) < 0 || Number(score) > 10) {
            toast.error("Please enter a valid score (0-10)");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/judge/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: selectedEvent.id,
                    participantId: evaluatingParticipant.id,
                    score: Number(score),
                    remarks
                })
            });

            if (res.ok) {
                toast.success("Evaluation submitted successfully");
                setEvaluatingParticipant(null);
                setScore("");
                setRemarks("");
                fetchJudgeData(); // Refresh data to update local state
            } else {
                const err = await res.json();
                toast.error(err.error || "Submission failed");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to find existing evaluation for a participant
    const getEvaluation = (eventId: string, participantId: string) => {
        return events.find(e => e.id === eventId)?.evaluations.find(ev => ev.participantId === participantId);
    };

    // Helper to safely parse dates
    const formatDate = (dateValue: any): string => {
        try {
            const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
            if (date && !isNaN(date.getTime())) {
                return date.toLocaleString();
            }
            return 'Invalid Date';
        } catch {
            return 'Invalid Date';
        }
    };

    const formatDateShort = (dateValue: any): string => {
        try {
            const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
            if (date && !isNaN(date.getTime())) {
                return date.toLocaleDateString();
            }
            return 'Invalid Date';
        } catch {
            return 'Invalid Date';
        }
    };

    interface ParticipantDisplay {
        id: string;
        type: "INDIVIDUAL" | "GROUP";
        displayName: string | null;
        subtitle: string | null;
        members?: any[];
        isEvaluated: boolean;
        score?: number;
        remarks?: string | null;
        actualUserId?: string; // The real user ID for evaluation
    }

    const getDisplayParticipants = (event: Event): ParticipantDisplay[] => {
        const list: ParticipantDisplay[] = [];
        const groupMemberIds = new Set<string>(); // Track all users who are part of groups

        // 1. Process Group Registrations FIRST
        event.groupRegistrations.forEach((reg, index) => {
            // Add group leader to the set
            groupMemberIds.add(reg.user.id);

            const evaluation = getEvaluation(event.id, reg.user.id);
            // Parse members if it's a string, though it should be JSON object from Prisma
            let membersList = [];
            try {
                if (typeof reg.members === 'string') {
                    membersList = JSON.parse(reg.members);
                } else {
                    membersList = reg.members; // Already object/array
                }
                // If nested in 'members' key (common in some form builders)
                if (!Array.isArray(membersList) && membersList && typeof membersList === 'object' && 'members' in membersList) {
                    // @ts-ignore
                    membersList = membersList.members;
                }
            } catch (e) {
                console.error("Error parsing members", e);
            }

            // Add all team member IDs to the set (if they have userId field)
            if (Array.isArray(membersList)) {
                membersList.forEach((member: any) => {
                    if (member.userId) {
                        groupMemberIds.add(member.userId);
                    }
                });
            }

            list.push({
                id: `group-${reg.user.id}-${index}`,
                type: "GROUP",
                displayName: reg.groupName || `Team ${reg.user.name}`,
                subtitle: `Leader: ${reg.user.name}`,
                members: Array.isArray(membersList) ? membersList : [],
                isEvaluated: !!evaluation,
                score: evaluation?.score,
                remarks: evaluation?.remarks,
                actualUserId: reg.user.id // For evaluation purposes
            });
        });

        // 2. Process Individual Registrants (excluding group members)
        event.registeredStudents.forEach(user => {
            // Skip if this user is part of any group (leader or member)
            if (groupMemberIds.has(user.id)) return;

            const evaluation = getEvaluation(event.id, user.id);
            list.push({
                id: `individual-${user.id}`,
                type: "INDIVIDUAL",
                displayName: user.name || "Unknown User",
                subtitle: user.collageId || "No ID",
                members: undefined,
                isEvaluated: !!evaluation,
                score: evaluation?.score,
                remarks: evaluation?.remarks,
                actualUserId: user.id // For evaluation purposes
            });
        });

        // Sort alphabetically by display name
        list.sort((a, b) => {
            const nameA = (a.displayName || "").toLowerCase();
            const nameB = (b.displayName || "").toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return list.filter(p => {
                const matchesName = (p.displayName || "").toLowerCase().includes(query);
                const matchesSubtitle = (p.subtitle || "").toLowerCase().includes(query);
                const matchesMembers = p.members?.some((m: any) =>
                    (m.name || m || "").toLowerCase().includes(query)
                );
                return matchesName || matchesSubtitle || matchesMembers;
            });
        }

        return list;
    };

    if (loading || isPending) return <Loader />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-[family-name:var(--font-Schibsted_Grotesk)]">
            {/* Header */}
            <header className="bg-[#111] border-b border-white/10 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <FiStar className="text-white text-sm sm:text-base" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-base sm:text-lg">Judge Panel</h1>
                            <p className="text-xs text-gray-400">{categoryName} Category</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                            <FiUser />
                            <span>{session?.user?.name}</span>
                        </div>
                        <button
                            onClick={() => {
                                signOut();
                                router.push("/judge/login");
                            }}
                            className="p-1.5 sm:p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <FiLogOut size={18} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {selectedEvent ? (
                    // EVENT DETAIL VIEW
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <FiChevronRight className="rotate-180" /> Back to Dashboard
                        </button>

                        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{selectedEvent.name}</h2>
                            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">{selectedEvent.description}</p>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-sm">
                                <div className="bg-[#161616] p-3 sm:p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"><FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Event Date</p>
                                    <p className="font-medium text-xs sm:text-sm">
                                        {formatDateShort(selectedEvent.startTime)}
                                        {selectedEvent.endTime && selectedEvent.endTime !== selectedEvent.startTime && (
                                            <span className="text-gray-500"> - {formatDateShort(selectedEvent.endTime)}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="bg-[#161616] p-3 sm:p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"><FiFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Venue</p>
                                    <p className="font-medium text-xs sm:text-sm truncate" title={selectedEvent.venue}>{selectedEvent.venue}</p>
                                </div>
                                <div className="bg-[#161616] p-3 sm:p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"><FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Participants</p>
                                    <p className="font-medium text-xs sm:text-sm">{getDisplayParticipants(selectedEvent).length} {selectedEvent.isGroupEvent ? "Teams" : "Entries"}</p>
                                </div>
                                <div className="bg-[#161616] p-3 sm:p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"><FiCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Status</p>
                                    <p className="font-medium text-xs sm:text-sm">
                                        {getDisplayParticipants(selectedEvent).filter(p => p.isEvaluated).length} / {getDisplayParticipants(selectedEvent).length} Evaluated
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4 sm:mb-6">
                            <div className="relative">
                                <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder={`Search ${selectedEvent.isGroupEvent ? 'teams' : 'participants'}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#161616] border border-white/10 rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {getDisplayParticipants(selectedEvent).map((participant, index) => (
                                <motion.div
                                    key={participant.id}
                                    layout
                                    className={`bg-[#161616] border ${participant.isEvaluated ? 'border-green-500/20' : 'border-white/10'} rounded-xl overflow-hidden hover:border-white/20 transition-all`}
                                >
                                    {/* Group/Individual Header - Rectangular Component */}
                                    <div className={`p-4 sm:p-5 ${participant.type === 'GROUP' ? 'bg-gradient-to-r from-red-950/30 to-red-900/10 border-l-4 border-red-500' : 'bg-gradient-to-r from-blue-950/30 to-blue-900/10 border-l-4 border-blue-500'}`}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${participant.type === 'GROUP' ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'} flex items-center justify-center text-sm sm:text-base font-bold shrink-0 shadow-lg`}>
                                                    {participant.displayName?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden flex-1">
                                                    <h3 className="font-bold truncate text-base sm:text-lg" title={participant.displayName || ""}>
                                                        {participant.displayName}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                                                        {participant.subtitle}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="shrink-0">
                                                {participant.isEvaluated ? (
                                                    <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium border border-green-500/30">
                                                        <FiCheckCircle size={14} /> {participant.score}/10
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1.5 rounded-full font-medium border border-yellow-500/30">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Members Dropdown (Only for Groups) */}
                                    {participant.type === "GROUP" && participant.members && participant.members.length > 0 && (
                                        <div className="border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    const newExpanded = new Set(expandedTeams);
                                                    if (newExpanded.has(participant.id)) {
                                                        newExpanded.delete(participant.id);
                                                    } else {
                                                        newExpanded.add(participant.id);
                                                    }
                                                    setExpandedTeams(newExpanded);
                                                }}
                                                className="w-full flex items-center justify-between px-4 sm:px-5 py-3 bg-black/20 hover:bg-black/30 transition-colors"
                                            >
                                                <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                                                    <FiUsers className="w-4 h-4" />
                                                    {participant.members.length + 1} Team Members
                                                </span>
                                                <FiChevronDown
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedTeams.has(participant.id) ? 'rotate-180' : ''}`}
                                                />
                                            </button>

                                            <AnimatePresence>
                                                {expandedTeams.has(participant.id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 sm:px-5 py-3 bg-black/10">
                                                            <div className="space-y-2">
                                                                {/* Team Leader with Evaluate Button */}
                                                                <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/20">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <span className="text-[10px] bg-red-600/30 text-red-300 px-2 py-0.5 rounded font-bold uppercase">Leader</span>
                                                                            <span className="text-white font-medium text-sm">{participant.subtitle?.replace('Leader: ', '')}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEvaluatingParticipant({
                                                                                id: participant.actualUserId || participant.id,
                                                                                name: participant.subtitle?.replace('Leader: ', '') || participant.displayName,
                                                                                email: "",
                                                                                collageId: null,
                                                                                image: null
                                                                            });
                                                                            const scoreVal = participant.score;
                                                                            setScore(scoreVal !== undefined && scoreVal !== null ? scoreVal : "");
                                                                            setRemarks(participant.remarks || "");
                                                                        }}
                                                                        className="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-xs font-semibold transition-all"
                                                                    >
                                                                        {participant.isEvaluated ? "Edit Evaluation" : "Evaluate"}
                                                                    </button>
                                                                </div>

                                                                {/* Other Members with Evaluate Buttons */}
                                                                {participant.members.map((m: any, idx: number) => (
                                                                    <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-gray-300 text-sm font-medium">{m.name || m}</span>
                                                                            {m.rollNo && <span className="text-gray-500 text-xs">{m.rollNo}</span>}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => {
                                                                                setEvaluatingParticipant({
                                                                                    id: m.userId || `member-${idx}`,
                                                                                    name: m.name || m,
                                                                                    email: m.email || "",
                                                                                    collageId: m.rollNo || null,
                                                                                    image: null
                                                                                });
                                                                                setScore("");
                                                                                setRemarks("");
                                                                            }}
                                                                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-xs font-semibold transition-all"
                                                                        >
                                                                            Evaluate
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Evaluate Button - Only for Individual Events */}
                                    {participant.type !== "GROUP" && (
                                        <div className="p-4 sm:p-5 border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    setEvaluatingParticipant({
                                                        id: participant.actualUserId || participant.id,
                                                        name: participant.displayName,
                                                        email: "", // Not needed for display
                                                        collageId: null,
                                                        image: null
                                                    });
                                                    const scoreVal = participant.score;
                                                    setScore(scoreVal !== undefined && scoreVal !== null ? scoreVal : "");
                                                    setRemarks(participant.remarks || "");
                                                }}
                                                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-sm sm:text-base font-semibold transition-all shadow-lg hover:shadow-red-500/20"
                                            >
                                                {participant.isEvaluated ? "Edit Evaluation" : "Evaluate"}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    // DASHBOARD GRID VIEW
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {events.map((event) => (
                            <motion.div
                                key={event.id}
                                layoutId={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className="bg-[#111] border border-white/10 rounded-2xl p-4 sm:p-5 md:p-6 cursor-pointer hover:border-red-500/30 hover:bg-[#161616] transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2 sm:mb-3">
                                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-red-400 transition-colors line-clamp-2 flex-1">{event.name}</h3>
                                    {event.isGroupEvent && (
                                        <span className="text-[10px] bg-red-900/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                            Group
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{event.description}</p>

                                <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><FiUsers /> {event.isGroupEvent ? "Teams" : "Participants"}</span>
                                        <span className="text-white font-mono">{getDisplayParticipants(event).length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><FiCheckCircle /> Evaluated</span>
                                        <span className="text-white font-mono">{event.evaluations.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2"><FiCalendar /> Date</span>
                                        <span className="text-white font-mono">{formatDateShort(event.startTime)}</span>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-red-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Start Evaluation <FiChevronRight />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Evaluation Modal */}
            <AnimatePresence>
                {evaluatingParticipant && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
                        onClick={() => setEvaluatingParticipant(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl sm:text-2xl font-bold mb-1">Evaluate {evaluatingParticipant.name}</h3>
                            <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">{selectedEvent?.name}</p>

                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Score (out of 10)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={score}
                                            onChange={(e) => setScore(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-base sm:text-lg focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="0.0"
                                        />
                                        <FiStar className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Remarks (Optional)</label>
                                    <div className="relative">
                                        <textarea
                                            rows={3}
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-red-500 transition-colors resize-none"
                                            placeholder="Great performance, but..."
                                        />
                                        <FiMessageSquare className="absolute right-4 top-4 text-gray-600" />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setEvaluatingParticipant(null)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEvaluationSubmit}
                                        disabled={submitting}
                                        className="flex-1 py-3 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0"
                                    >
                                        {submitting ? <FiLoader className="animate-spin" /> : "Submit Evaluation"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
