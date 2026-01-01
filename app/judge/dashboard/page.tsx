"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
    FiLogOut, FiUser, FiStar, FiMessageSquare,
    FiUsers, FiCalendar, FiChevronRight, FiCheckCircle, FiLoader, FiFilter
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

    interface ParticipantDisplay {
        id: string;
        type: "INDIVIDUAL" | "GROUP";
        displayName: string | null;
        subtitle: string | null;
        members?: any[];
        isEvaluated: boolean;
        score?: number;
        remarks?: string | null;
    }

    const getDisplayParticipants = (event: Event): ParticipantDisplay[] => {
        const list: ParticipantDisplay[] = [];

        // 1. Individual Registrants
        event.registeredStudents.forEach(user => {
            const evaluation = getEvaluation(event.id, user.id);
            list.push({
                id: user.id,
                type: "INDIVIDUAL",
                displayName: user.name || "Unknown User",
                subtitle: user.collageId || "No ID",
                isEvaluated: !!evaluation,
                score: evaluation?.score,
                remarks: evaluation?.remarks
            });
        });

        // 2. Group Registrations
        event.groupRegistrations.forEach(reg => {
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

            list.push({
                id: reg.user.id, // Leader ID used for evaluation key
                type: "GROUP",
                displayName: reg.groupName || `Team ${reg.user.name}`,
                subtitle: `Leader: ${reg.user.name}`,
                members: Array.isArray(membersList) ? membersList : [],
                isEvaluated: !!evaluation,
                score: evaluation?.score,
                remarks: evaluation?.remarks
            });
        });

        return list;
    };

    if (loading || isPending) return <Loader />;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-[family-name:var(--font-Schibsted_Grotesk)]">
            {/* Header */}
            <header className="bg-[#111] border-b border-white/10 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <FiStar className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Judge Panel</h1>
                            <p className="text-xs text-gray-400">{categoryName} Category</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <FiUser />
                            <span>{session?.user?.name}</span>
                        </div>
                        <button
                            onClick={() => {
                                signOut();
                                router.push("/judge/login");
                            }}
                            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <FiLogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
                            <h2 className="text-3xl font-bold mb-4">{selectedEvent.name}</h2>
                            <p className="text-gray-400 mb-6">{selectedEvent.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                                <div className="bg-[#161616] p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-2"><FiCalendar /> Date & Time</p>
                                    <p className="font-medium">{new Date(selectedEvent.startTime).toLocaleString()}</p>
                                </div>
                                <div className="bg-[#161616] p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-2"><FiFilter /> Venue</p>
                                    <p className="font-medium">{selectedEvent.venue}</p>
                                </div>
                                <div className="bg-[#161616] p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-2"><FiUsers /> Participants</p>
                                    <p className="font-medium">{getDisplayParticipants(selectedEvent).length} {selectedEvent.isGroupEvent ? "Teams" : "Entries"}</p>
                                </div>
                                <div className="bg-[#161616] p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-500 mb-1 flex items-center gap-2"><FiCheckCircle /> Status</p>
                                    <p className="font-medium">
                                        {getDisplayParticipants(selectedEvent).filter(p => p.isEvaluated).length} / {getDisplayParticipants(selectedEvent).length} Evaluated
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getDisplayParticipants(selectedEvent).map((participant) => (
                                <motion.div
                                    key={participant.id}
                                    layout
                                    className={`bg-[#161616] border ${participant.isEvaluated ? 'border-green-500/20' : 'border-white/5'} rounded-xl p-5 hover:border-white/20 transition-all`}
                                >
                                    <div className="mb-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold shrink-0">
                                                {participant.displayName?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h3 className="font-semibold truncate" title={participant.displayName || ""}>{participant.displayName}</h3>
                                                <p className="text-xs text-gray-500 truncate">{participant.subtitle || ""}</p>
                                            </div>
                                        </div>

                                        {participant.type === "GROUP" && participant.members && (
                                            <div className="mb-3 bg-black/20 p-3 rounded-lg text-xs">
                                                <p className="text-gray-500 font-medium mb-1">Team Members:</p>
                                                <ul className="space-y-1 text-gray-400 max-h-24 overflow-y-auto">
                                                    {participant.members.map((m: any, idx: number) => (
                                                        <li key={idx} className="flex justify-between">
                                                            <span>{m.name || m}</span>
                                                            {m.rollNo && <span className="opacity-50">{m.rollNo}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {participant.isEvaluated && (
                                            <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                                <FiCheckCircle size={10} /> Graded: {participant.score}/10
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => {
                                            setEvaluatingParticipant({
                                                id: participant.id,
                                                name: participant.displayName,
                                                email: "", // Not needed for display
                                                collageId: null,
                                                image: null
                                            });
                                            const scoreVal = participant.score;
                                            setScore(scoreVal !== undefined && scoreVal !== null ? scoreVal : "");
                                            setRemarks(participant.remarks || "");
                                        }}
                                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/5"
                                    >
                                        {participant.isEvaluated ? "Edit Evaluation" : "Evaluate"}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    // DASHBOARD GRID VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <motion.div
                                key={event.id}
                                layoutId={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className="bg-[#111] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-red-500/30 hover:bg-[#161616] transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold group-hover:text-red-400 transition-colors line-clamp-1">{event.name}</h3>
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
                                        <span className="text-white font-mono">{new Date(event.startTime).toLocaleDateString()}</span>
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEvaluatingParticipant(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold mb-1">Evaluate {evaluatingParticipant.name}</h3>
                            <p className="text-gray-400 text-sm mb-6">{selectedEvent?.name}</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Score (out of 10)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={score}
                                            onChange={(e) => setScore(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-red-500 transition-colors"
                                            placeholder="0.0"
                                        />
                                        <FiStar className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Remarks (Optional)</label>
                                    <div className="relative">
                                        <textarea
                                            rows={3}
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
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
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
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
