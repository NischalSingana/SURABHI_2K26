"use client";

import { useEffect, useState } from "react";
import { getEvaluations } from "@/actions/evaluation.action";
import Loader from "@/components/ui/Loader";
import { FiChevronDown, FiChevronUp, FiAward, FiUsers, FiX, FiCheckCircle } from "react-icons/fi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Evaluation {
    id: string;
    score: number;
    remarks: string | null;
    participant: {
        id: string;
        name: string | null;
        email: string;
        collageId: string | null;
    };
    judge: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface GroupRegistration {
    user: {
        id: string;
        name: string | null;
    };
    groupName: string | null;
    members: any;
}

interface EventData {
    id: string;
    name: string;
    isGroupEvent: boolean;
    Category: { name: string };
    evaluations: Evaluation[];
    groupRegistrations: GroupRegistration[];
}

interface ProcessedEntry {
    id: string; // User ID or Group Leader ID
    type: "INDIVIDUAL" | "GROUP";
    name: string;
    subtitle: string | null;
    score: number | string; // Average or specific score
    evaluationsCount: number; // Number of evaluations (1 for individual, N for group)
    members?: any[]; // For groups
    individualEvaluations?: Evaluation[]; // For deeper view
}

export default function AdminEvaluationsPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [selectedTeam, setSelectedTeam] = useState<ProcessedEntry | null>(null);

    useEffect(() => {
        loadEvaluations();
    }, []);

    const loadEvaluations = async () => {
        const res = await getEvaluations();
        if (res.success) {
            setEvents(res.data || []);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    const toggleEvent = (id: string) => {
        const newSet = new Set(expandedEvents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedEvents(newSet);
    };

    const processEventData = (event: EventData): ProcessedEntry[] => {
        if (!event.isGroupEvent) {
            // Simple mapping for individual events
            return event.evaluations.map(ev => ({
                id: ev.participant.id,
                type: "INDIVIDUAL" as const,
                name: ev.participant.name || "Unknown",
                subtitle: ev.participant.collageId,
                score: ev.score,
                evaluationsCount: 1,
                individualEvaluations: [ev]
            })).sort((a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));
        }

        // Group Event Logic
        const entries: ProcessedEntry[] = [];
        const processedUserIds = new Set<string>();

        // 1. Map Group Registrations
        event.groupRegistrations.forEach(reg => {
            // Identify all member IDs
            const memberIds = new Set<string>();
            memberIds.add(reg.user.id); // Leader

            let membersList: any[] = [];
            try {
                if (typeof reg.members === 'string') {
                    membersList = JSON.parse(reg.members);
                } else {
                    membersList = reg.members;
                }
                // Handle nested 'members' object logic if consistent with judge view
                if (!Array.isArray(membersList) && membersList && typeof membersList === 'object' && 'members' in membersList) {
                    // @ts-ignore
                    membersList = membersList.members;
                }
            } catch (e) { console.error(e); }

            if (Array.isArray(membersList)) {
                membersList.forEach((m: any) => { if (m.userId) memberIds.add(m.userId); });
            }

            // Collect all evaluations for this team
            const teamEvaluations = event.evaluations.filter(ev => memberIds.has(ev.participant.id));

            if (teamEvaluations.length > 0) {
                const totalScore = teamEvaluations.reduce((sum, ev) => sum + ev.score, 0);
                const avgScore = parseFloat((totalScore / teamEvaluations.length).toFixed(2));

                entries.push({
                    id: reg.user.id,
                    type: "GROUP" as const,
                    name: reg.groupName || `Team ${reg.user.name}`,
                    subtitle: `Leader: ${reg.user.name}`,
                    score: avgScore,
                    evaluationsCount: teamEvaluations.length,
                    members: membersList,
                    individualEvaluations: teamEvaluations
                });

                // Mark these users as processed so we don't double count if logic is loose
                memberIds.forEach(id => processedUserIds.add(id));
            }
        });

        // 2. Handle any stragglers (unlikely if data integrity is good, but safe to keep)
        // If there are evaluations for users NOT in a group registration (shouldn't happen for group event usually)
        event.evaluations.forEach(ev => {
            if (!processedUserIds.has(ev.participant.id)) {
                entries.push({
                    id: ev.participant.id,
                    type: "INDIVIDUAL" as const, // Treat as individual if not matched to a group
                    name: ev.participant.name || "Unknown",
                    subtitle: ev.participant.collageId,
                    score: ev.score,
                    evaluationsCount: 1,
                    individualEvaluations: [ev]
                });
            }
        });

        // Sort by Score Descending
        return entries.sort((a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Evaluation Results</h1>
                    <p className="text-gray-400">View scores and rankings for all events</p>
                </header>

                {events.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <FiAward className="mx-auto text-4xl text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">No evaluations found</h3>
                        <p className="text-gray-500">Judges haven't submitted any scores yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event) => {
                            const processedEntries = processEventData(event);

                            return (
                                <motion.div
                                    key={event.id}
                                    layout
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                                >
                                    <div
                                        onClick={() => toggleEvent(event.id)}
                                        className="p-6 cursor-pointer hover:bg-zinc-800/50 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <h2 className="text-xl font-bold flex items-center gap-3">
                                                {event.name}
                                                <span className="text-xs font-normal px-2 py-1 bg-zinc-800 rounded-full text-gray-400 border border-zinc-700">
                                                    {event.Category.name}
                                                </span>
                                                {event.isGroupEvent && (
                                                    <span className="text-xs font-normal px-2 py-1 bg-red-900/30 text-red-300 rounded-full border border-red-500/30">
                                                        Group Event
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {processedEntries.length} {event.isGroupEvent ? "Teams" : "Participants"} Ranked
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button className="text-gray-400 hover:text-white transition-colors">
                                                {expandedEvents.has(event.id) ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedEvents.has(event.id) && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 border-t border-zinc-800 bg-black/20">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="text-gray-400 text-sm border-b border-zinc-800">
                                                                    <th className="pb-3 pl-4 font-medium">Rank</th>
                                                                    <th className="pb-3 font-medium">Participant / Team</th>
                                                                    <th className="pb-3 font-medium">Score</th>
                                                                    {event.isGroupEvent && <th className="pb-3 font-medium">Evaluations</th>}
                                                                    <th className="pb-3 font-medium">Details</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-sm">
                                                                {processedEntries.map((entry, index) => (
                                                                    <tr key={index} className="border-b border-zinc-800/50 hover:bg-white/5">
                                                                        <td className="py-4 pl-4 font-mono text-gray-500">
                                                                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                                                        </td>
                                                                        <td className="py-4">
                                                                            <div className="font-medium text-white">{entry.name}</div>
                                                                            <div className="text-xs text-gray-500">{entry.subtitle}</div>
                                                                        </td>
                                                                        <td className="py-4 font-bold text-lg text-red-500">
                                                                            {entry.score}
                                                                            <span className="text-xs text-gray-600 font-normal ml-1">/10</span>
                                                                        </td>
                                                                        {event.isGroupEvent && (
                                                                            <td className="py-4 text-gray-400">
                                                                                {entry.evaluationsCount} Members Evaluated
                                                                            </td>
                                                                        )}
                                                                        <td className="py-4">
                                                                            {entry.type === "GROUP" ? (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setSelectedTeam(entry); }}
                                                                                    className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                                                                                >
                                                                                    <FiUsers /> View Members
                                                                                </button>
                                                                            ) : (
                                                                                <div className="text-xs text-gray-500">
                                                                                    <span className="block text-gray-400">{entry.individualEvaluations?.[0]?.remarks || "-"}</span>
                                                                                    <span className="block mt-0.5">Judge: {entry.individualEvaluations?.[0]?.judge.name}</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Team Details Modal */}
            <AnimatePresence>
                {selectedTeam && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedTeam(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">{selectedTeam.name}</h3>
                                    <p className="text-gray-400 text-sm">Team Average Score: <span className="text-red-500 font-bold">{selectedTeam.score}/10</span></p>
                                </div>
                                <button onClick={() => setSelectedTeam(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Member Evaluations</h4>
                                <div className="space-y-3">
                                    {selectedTeam.individualEvaluations?.map((ev, idx) => (
                                        <div key={idx} className="bg-black/40 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-white">{ev.participant.name}</p>
                                                <p className="text-xs text-gray-500">{ev.participant.collageId || "No ID"}</p>
                                                {ev.remarks && <p className="text-xs text-gray-400 mt-2 italic">"{ev.remarks}"</p>}
                                                <p className="text-[10px] text-gray-600 mt-1">Judge: {ev.judge.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xl font-bold text-green-500">{ev.score}</span>
                                                <span className="text-xs text-gray-600">/10</span>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedTeam.individualEvaluations?.length === 0 && (
                                        <p className="text-gray-500 text-sm italic">No evaluations found for this team.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
