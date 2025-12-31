"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getUserRegisteredEvents } from "@/actions/submissions.action";
import { unregisterFromEvent } from "@/actions/events.action";
import SubmissionModal from "@/components/ui/SubmissionModal";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiUpload, FiCheckCircle, FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Event {
    id: string;
    name: string;
    description: string;
    date: string | Date;
    image: string;
    venue: string;
    startTime: string;
    endTime: string;
    participantLimit: number;
    Category: {
        id: string;
        name: string;
    };
    _count: {
        registeredStudents: number;
    };
}

interface Submission {
    id: string;
    eventId: string;
    submissionLink: string;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export default function MyEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [unregistering, setUnregistering] = useState<string | null>(null);
    const [showUnregisterConfirm, setShowUnregisterConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        const result = await getUserRegisteredEvents();
        if (result.success && result.data) {
            setEvents(result.data);
            setSubmissions(result.submissions || []);
        }
        setLoading(false);
    };

    const getSubmissionForEvent = (eventId: string) => {
        return submissions.find((sub) => sub.eventId === eventId);
    };

    const handleSubmitClick = (event: Event) => {
        setSelectedEvent(event);
        setShowSubmissionModal(true);
    };

    const handleSubmissionSuccess = () => {
        fetchMyEvents();
    };

    const handleUnregister = async (eventId: string) => {
        setUnregistering(eventId);

        const result = await unregisterFromEvent(eventId);

        if (result.success) {
            toast.success("Successfully unregistered from the event!");
            setShowUnregisterConfirm(null);
            fetchMyEvents();
        } else {
            toast.error(result.error || "Failed to unregister");
        }

        setUnregistering(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading your events...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 mt-20">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold text-orange-500 mb-4"
                    >
                        My Events
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-400 text-xl"
                    >
                        {events.length} {events.length === 1 ? "event" : "events"} registered
                    </motion.p>
                </div>

                {/* Events List */}
                {events.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                    >
                        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiCalendar size={40} className="text-zinc-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Events Yet</h3>
                        <p className="text-zinc-400 mb-6">You haven't registered for any events</p>
                        <button
                            onClick={() => router.push("/events")}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                            Browse Events
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event, index) => {
                            const submission = getSubmissionForEvent(event.id);
                            const hasSubmission = !!submission;

                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20"
                                >
                                    {/* Event Image */}
                                    <div className="relative h-48 bg-zinc-800 overflow-hidden">
                                        <Image
                                            src={event.image}
                                            alt={event.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover"
                                            quality={85}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                        {/* Category Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-orange-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                                {event.Category.name}
                                            </span>
                                        </div>

                                        {/* Submission Status Badge */}
                                        {hasSubmission && (
                                            <div className="absolute top-3 right-3">
                                                <span className="bg-green-500/90 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                                    <FiCheckCircle size={12} />
                                                    Submitted
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Event Details */}
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                                            {event.name}
                                        </h3>
                                        <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                                            {event.description}
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-zinc-300 text-sm">
                                                <FiMapPin className="text-orange-500 mr-2 flex-shrink-0" size={16} />
                                                <span className="truncate">{event.venue}</span>
                                            </div>
                                            <div className="flex items-center text-zinc-300 text-sm">
                                                <FiCalendar className="text-orange-500 mr-2 flex-shrink-0" size={16} />
                                                <span>
                                                    {new Date(event.date).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-zinc-300 text-sm">
                                                <FiClock className="text-orange-500 mr-2 flex-shrink-0" size={16} />
                                                <span>{event.startTime} - {event.endTime}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleSubmitClick(event)}
                                                className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${hasSubmission
                                                    ? "bg-zinc-800 text-orange-400 border border-orange-500/30 hover:bg-zinc-700"
                                                    : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/50"
                                                    }`}
                                            >
                                                <FiUpload size={16} />
                                                {hasSubmission ? "Update Submission" : "Submit Work"}
                                            </button>
                                            <button
                                                onClick={() => setShowUnregisterConfirm(event.id)}
                                                disabled={unregistering === event.id}
                                                className="w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {unregistering === event.id ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Unregistering...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiX size={16} />
                                                        Unregister
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {hasSubmission && submission && (
                                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                <p className="text-xs text-green-400 mb-1">Submitted on:</p>
                                                <p className="text-xs text-zinc-300">
                                                    {new Date(submission.updatedAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            {selectedEvent && (
                <SubmissionModal
                    event={selectedEvent}
                    isOpen={showSubmissionModal}
                    onClose={() => {
                        setShowSubmissionModal(false);
                        setSelectedEvent(null);
                    }}
                    existingSubmission={getSubmissionForEvent(selectedEvent.id)}
                    onSuccess={handleSubmissionSuccess}
                />
            )}

            {/* Unregister Confirmation Modal */}
            <AnimatePresence>
                {showUnregisterConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-zinc-800">
                                <h2 className="text-xl font-bold text-white">
                                    Unregister from Event
                                </h2>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6">
                                {(() => {
                                    const eventToUnregister = events.find(e => e.id === showUnregisterConfirm);
                                    return (
                                        <>
                                            <p className="text-zinc-300 mb-4">
                                                Are you sure you want to unregister from <span className="font-semibold text-white">{eventToUnregister?.name}</span>?
                                            </p>
                                            <p className="text-zinc-400 text-sm">
                                                This action cannot be undone. You will need to register again if you change your mind.
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 border-t border-zinc-800 flex gap-3">
                                <button
                                    onClick={() => setShowUnregisterConfirm(null)}
                                    disabled={unregistering === showUnregisterConfirm}
                                    className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => showUnregisterConfirm && handleUnregister(showUnregisterConfirm)}
                                    disabled={unregistering === showUnregisterConfirm}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {unregistering === showUnregisterConfirm ? "Unregistering..." : "Yes, Unregister"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
