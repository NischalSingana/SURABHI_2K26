"use client";

import { useEffect, useState } from "react";
import { getEvaluations } from "@/actions/evaluation.action";
import Loader from "@/components/ui/Loader";
import { FiChevronDown, FiChevronUp, FiDownload, FiAward } from "react-icons/fi";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminEvaluationsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

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
                        {events.map((event) => (
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
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {event.evaluations.length} Evaluations submitted
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
                                                                <th className="pb-3 font-medium">Participant</th>
                                                                <th className="pb-3 font-medium">Score</th>
                                                                <th className="pb-3 font-medium">Remarks</th>
                                                                <th className="pb-3 font-medium">Judge</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm">
                                                            {event.evaluations.map((evaluation: any, index: number) => (
                                                                <tr key={evaluation.id} className="border-b border-zinc-800/50 hover:bg-white/5">
                                                                    <td className="py-4 pl-4 font-mono text-gray-500">
                                                                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                                                                    </td>
                                                                    <td className="py-4">
                                                                        <div className="font-medium text-white">{evaluation.participant.name}</div>
                                                                        <div className="text-xs text-gray-500">{evaluation.participant.collageId}</div>
                                                                    </td>
                                                                    <td className="py-4 font-bold text-lg text-red-500">
                                                                        {evaluation.score}
                                                                        <span className="text-xs text-gray-600 font-normal ml-1">/10</span>
                                                                    </td>
                                                                    <td className="py-4 text-gray-400 max-w-xs truncate">
                                                                        {evaluation.remarks || "-"}
                                                                    </td>
                                                                    <td className="py-4 text-gray-500">
                                                                        {evaluation.judge.name}
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
