"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getSchedules } from "@/actions/schedule.action";
import Loader from "@/components/ui/Loader";
import { toast } from "sonner";

interface Schedule {
    id: string;
    image: string;
}

export default function SchedulePage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        async function fetchSchedules() {
            const result = await getSchedules();
            if (result.success && result.data) {
                setSchedules(result.data);
            }
            setLoading(false);
        }
        fetchSchedules();
    }, []);

    const handleDownload = async (imageUrl: string, id: string) => {
        if (downloading) return;
        setDownloading(true);
        const toastId = toast.loading("Downloading...");

        try {
            const response = await fetch(`/api/schedule/download?url=${encodeURIComponent(imageUrl)}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Download failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `schedule-${id}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Schedule downloaded successfully!", { id: toastId });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error("Failed to download schedule", { id: toastId });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.1),transparent_50%)]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
                    >
                        Event <span className="text-red-600">Schedule</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto"
                    >
                        Stay updated with the latest timeline for all events and activities.
                    </motion.p>
                </div>

                {schedules.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 backdrop-blur-sm"
                    >
                        <p className="text-zinc-500 text-xl">Schedule will be updated soon.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {schedules.map((schedule, index) => (
                            <motion.div
                                key={schedule.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="group relative cursor-pointer"
                                onClick={() => setSelectedSchedule(schedule)}
                            >
                                <div className="relative bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl backdrop-blur-sm">
                                    <div className="relative w-full">
                                        <img
                                            src={schedule.image}
                                            alt="Event Schedule"
                                            className="w-full h-auto block"
                                        />

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <span className="px-4 py-2 bg-zinc-900/80 text-white rounded-full text-sm font-medium border border-zinc-700">
                                                Click to view
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedSchedule && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSchedule(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedSchedule(null)}
                                className="absolute -top-12 right-0 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full transition-colors z-50"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Image Container */}
                            <div className="relative w-full max-h-[85vh] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                                <img
                                    src={selectedSchedule.image}
                                    alt="Schedule Full View"
                                    className="max-w-full max-h-[85vh] object-contain"
                                />
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-4">
                                <button
                                    onClick={() => handleDownload(selectedSchedule.image, selectedSchedule.id)}
                                    disabled={downloading}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {downloading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download Schedule
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
