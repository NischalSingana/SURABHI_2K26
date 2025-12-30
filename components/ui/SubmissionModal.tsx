"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitEventWork } from "@/actions/submissions.action";
import { FiLink, FiUpload, FiX } from "react-icons/fi";

interface Event {
    id: string;
    name: string;
    description: string;
    date: string | Date;
    venue: string;
    startTime: string;
    endTime: string;
}

interface SubmissionModalProps {
    event: Event;
    isOpen: boolean;
    onClose: () => void;
    existingSubmission?: {
        submissionLink: string;
        notes?: string | null;
    } | null;
    onSuccess?: () => void;
}

export default function SubmissionModal({
    event,
    isOpen,
    onClose,
    existingSubmission,
    onSuccess,
}: SubmissionModalProps) {
    const [submissionLink, setSubmissionLink] = useState(existingSubmission?.submissionLink || "");
    const [notes, setNotes] = useState(existingSubmission?.notes || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await submitEventWork(event.id, submissionLink, notes);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
                setSuccess(false);
            }, 2000);
        } else {
            setError(result.error || "Failed to submit");
        }

        setLoading(false);
    };

    const handleClose = () => {
        if (!loading) {
            setSubmissionLink(existingSubmission?.submissionLink || "");
            setNotes(existingSubmission?.notes || "");
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="bg-zinc-900 rounded-xl max-w-2xl w-full border border-zinc-800 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-orange-500/30 p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold text-orange-500 mb-2">
                                        Submit Your Work
                                    </h3>
                                    <p className="text-zinc-300 text-sm">{event.name}</p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="text-zinc-400 hover:text-white transition-colors p-1"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Event Details */}
                            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                                <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                                    <FiUpload size={16} />
                                    Submission Guidelines
                                </h4>
                                <div className="space-y-2 text-sm text-zinc-300">
                                    <p>📌 Upload your work/files to Google Drive</p>
                                    <p>📌 Set sharing permissions to "Anyone with the link can view"</p>
                                    <p>📌 Copy and paste the shareable link below</p>
                                    <p>📌 Accepted formats: JPG, PNG, PDF, MP4, ZIP (Max 100MB)</p>
                                    <p>📌 Ensure your submission meets the event requirements</p>
                                </div>
                            </div>

                            {/* Drive Link Input */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Google Drive Link <span className="text-orange-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input
                                        type="url"
                                        value={submissionLink}
                                        onChange={(e) => setSubmissionLink(e.target.value)}
                                        placeholder="https://drive.google.com/file/d/..."
                                        required
                                        disabled={loading}
                                        className="w-full pl-12 pr-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-zinc-500 disabled:opacity-50"
                                    />
                                </div>
                                <p className="text-xs text-zinc-400 mt-2">
                                    Make sure the link is accessible to anyone with the link
                                </p>
                            </div>

                            {/* Notes (Optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Additional Notes <span className="text-zinc-500">(Optional)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional information about your submission..."
                                    rows={3}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-zinc-500 disabled:opacity-50 resize-none"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-100 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-100 text-sm flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Submission saved successfully!
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !submissionLink.trim()}
                                    className={`flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loading || !submissionLink.trim()
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/50"
                                        }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FiUpload size={18} />
                                            {existingSubmission ? "Update Submission" : "Submit Work"}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-all duration-300 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
