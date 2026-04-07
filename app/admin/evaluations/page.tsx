/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { getEvaluations, toggleResultRelease } from "@/actions/evaluation.action";
import Loader from "@/components/ui/Loader";
import { FiChevronDown, FiChevronUp, FiAward, FiUsers, FiX, FiCheckCircle, FiGlobe, FiLock } from "react-icons/fi";
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
    isResultPublished: boolean;
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
    judgeScores?: Array<{
        judgeId: string;
        judgeName: string | null;
        score: number;
        remarks: string | null;
    }>;
}

export default function AdminEvaluationsPage() {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [selectedTeam, setSelectedTeam] = useState<ProcessedEntry | null>(null);

    const loadEvaluations = async () => {
        setTimeout(() => setLoading(true), 0);
        const res = await getEvaluations();
        if (res.success) {
            setEvents(res.data || []);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadEvaluations();
    }, []);

    const toggleEvent = (id: string) => {
        const newSet = new Set(expandedEvents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedEvents(newSet);
    };

    const handleToggleRelease = async (e: React.MouseEvent, eventId: string, currentStatus: boolean) => {
        e.stopPropagation();
        const res = await toggleResultRelease(eventId, !currentStatus);
        if (res.success) {
            toast.success(res.message);
            // Update local state
            setEvents(events.map(ev =>
                ev.id === eventId ? { ...ev, isResultPublished: !currentStatus } : ev
            ));
        } else {
            toast.error(res.error);
        }
    };

    const processEventData = (event: EventData): ProcessedEntry[] => {
        if (!event.isGroupEvent) {
            // Group evaluations by participant so multiple judges don't duplicate rows
            const byParticipant = new Map<string, Evaluation[]>();
            for (const ev of event.evaluations) {
                const pid = ev.participant.id;
                const list = byParticipant.get(pid) ?? [];
                list.push(ev);
                byParticipant.set(pid, list);
            }

            const entries = Array.from(byParticipant.entries()).map(([participantId, evals]) => {
                const total = evals.reduce((sum, e) => sum + e.score, 0);
                const avg = evals.length ? parseFloat((total / evals.length).toFixed(2)) : 0;
                const judgeScores = evals.map((e) => ({
                    judgeId: e.judge.id,
                    judgeName: e.judge.name,
                    score: parseFloat(e.score.toFixed(2)),
                    remarks: e.remarks ?? null,
                }));

                return {
                    id: participantId,
                    type: "INDIVIDUAL" as const,
                    name: evals[0]?.participant?.name || "Unknown",
                    subtitle: evals[0]?.participant?.collageId || null,
                    score: avg,
                    evaluationsCount: evals.length,
                    individualEvaluations: evals,
                    judgeScores,
                };
            });

            return entries.sort((a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));
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
                // Per-judge team score = avg across evaluated members; overall team score = avg of judge avgs
                const byJudge = new Map<string, { judgeId: string; judgeName: string | null; scores: number[]; remarks: string[] }>();
                for (const ev of teamEvaluations) {
                    const jid = ev.judge.id;
                    const jname = ev.judge.name ?? null;
                    const entry = byJudge.get(jid) ?? { judgeId: jid, judgeName: jname, scores: [], remarks: [] };
                    entry.scores.push(ev.score);
                    if (ev.remarks) entry.remarks.push(ev.remarks);
                    byJudge.set(jid, entry);
                }

                const judgeScores = Array.from(byJudge.values()).map((j) => {
                    const avg = j.scores.length ? j.scores.reduce((a, b) => a + b, 0) / j.scores.length : 0;
                    return {
                        judgeId: j.judgeId,
                        judgeName: j.judgeName,
                        score: parseFloat(avg.toFixed(2)),
                        remarks: j.remarks.length ? j.remarks.join(" | ") : null,
                    };
                });

                const avgScore = judgeScores.length
                    ? parseFloat((judgeScores.reduce((sum, j) => sum + j.score, 0) / judgeScores.length).toFixed(2))
                    : 0;

                entries.push({
                    id: reg.user.id,
                    type: "GROUP" as const,
                    name: reg.groupName || `Team ${reg.user.name}`,
                    subtitle: `Leader: ${reg.user.name}`,
                    score: avgScore,
                    evaluationsCount: teamEvaluations.length,
                    members: membersList,
                    individualEvaluations: teamEvaluations,
                    judgeScores,
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
                                            <button
                                                onClick={(e) => handleToggleRelease(e, event.id, event.isResultPublished)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${event.isResultPublished
                                                    ? "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                                                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                                                    }`}
                                            >
                                                {event.isResultPublished ? (
                                                    <>
                                                        <FiGlobe /> Released
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiLock /> Private
                                                    </>
                                                )}
                                            </button>
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
                                                                        <td className="py-4 pl-4 font-mono text-3xl text-gray-500">
                                                                            {(() => {
                                                                                // Calculate rank with draw logic
                                                                                // Since processedEntries is already sorted by score DESC
                                                                                let rank = 1;
                                                                                let isDraw = false;

                                                                                // Look back to find true rank
                                                                                if (index > 0) {
                                                                                    const prevScore = processedEntries[index - 1].score;
                                                                                    const currScore = entry.score;
                                                                                    // If scores equal, rank is same as previous (we need to find the rank of the first person with this score)
                                                                                    if (prevScore === currScore) {
                                                                                        isDraw = true;
                                                                                        // Recursive or simple loop to find start of this score group
                                                                                        let i = index - 1;
                                                                                        while (i >= 0 && processedEntries[i].score === currScore) {
                                                                                            i--;
                                                                                        }
                                                                                        // i is now the index BEFORE the group, so group starts at i + 1
                                                                                        rank = i + 2;
                                                                                    } else {
                                                                                        rank = index + 1;
                                                                                    }
                                                                                } else {
                                                                                    rank = 1;
                                                                                }

                                                                                // Display
                                                                                return (
                                                                                    <div className="flex flex-col items-center justify-center w-12 text-center">
                                                                                        <span>
                                                                                            {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                                                                                        </span>
                                                                                        {isDraw && <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-1">(Draw)</span>}
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </td>
                                                                        <td className="py-4">
                                                                            <div className="font-bold text-xl text-white">{entry.name}</div>
                                                                            <div className="text-base font-medium text-gray-400 mt-1">{entry.subtitle}</div>
                                                                        </td>
                                                                        <td className="py-4 font-bold text-3xl text-red-500">
                                                                            {entry.score}
                                                                            <span className="text-sm text-gray-600 font-normal ml-1">/10</span>
                                                                            {entry.judgeScores?.length ? (
                                                                                <div className="text-[10px] text-gray-500 font-normal mt-1">
                                                                                    Avg of {entry.judgeScores.length} judge{entry.judgeScores.length === 1 ? "" : "s"}
                                                                                </div>
                                                                            ) : null}
                                                                        </td>
                                                                        {event.isGroupEvent && (
                                                                            <td className="py-4 text-gray-400 text-base">
                                                                                {entry.evaluationsCount} Members Evaluated
                                                                            </td>
                                                                        )}
                                                                        <td className="py-4">
                                                                            {entry.type === "GROUP" ? (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setSelectedTeam(entry); }}
                                                                                    className="text-sm bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded flex items-center gap-2 transition-colors"
                                                                                >
                                                                                    <FiUsers /> View Members
                                                                                </button>
                                                                            ) : (
                                                                                <div className="text-sm text-gray-400 space-y-1">
                                                                                    {entry.judgeScores?.length ? (
                                                                                        <>
                                                                                            <div className="text-gray-300 font-medium">
                                                                                                Judges:
                                                                                            </div>
                                                                                            <div className="space-y-0.5">
                                                                                                {entry.judgeScores
                                                                                                    .slice()
                                                                                                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                                                                                                    .map((j) => (
                                                                                                        <div key={j.judgeId} className="flex items-center justify-between gap-3">
                                                                                                            <span className="truncate max-w-[180px]">
                                                                                                                {j.judgeName || "Judge"}
                                                                                                            </span>
                                                                                                            <span className="font-bold text-gray-200">{j.score}/10</span>
                                                                                                        </div>
                                                                                                    ))}
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <span className="block text-gray-500 italic">No judge scores</span>
                                                                                    )}
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
                                {!!selectedTeam.judgeScores?.length && (
                                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Per-judge scores</h4>
                                        <div className="space-y-2">
                                            {selectedTeam.judgeScores
                                                .slice()
                                                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                                                .map((j) => (
                                                    <div key={j.judgeId} className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm text-gray-200 truncate">{j.judgeName || "Judge"}</div>
                                                            {j.remarks && <div className="text-xs text-gray-500 truncate">{j.remarks}</div>}
                                                        </div>
                                                        <div className="text-sm font-bold text-white">{j.score}/10</div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Member Evaluations</h4>
                                <div className="space-y-3">
                                    {selectedTeam.individualEvaluations?.map((ev, idx) => (
                                        <div key={idx} className="bg-black/40 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-base text-white">{ev.participant.name}</p>
                                                <p className="text-sm text-gray-400">{ev.participant.collageId || "No ID"}</p>
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
