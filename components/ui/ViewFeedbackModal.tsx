"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiMessageSquare, FiX } from "react-icons/fi";
import { getUserFeedbackForEvent } from "@/actions/feedback.action";
import { FEEDBACK_RATING_FIELDS, type FeedbackRatings } from "@/lib/feedback";

interface ViewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
}

export default function ViewFeedbackModal({
  isOpen,
  onClose,
  eventId,
  eventName,
}: ViewFeedbackModalProps) {
  const [feedback, setFeedback] = useState<{
    overallRating: number;
    ratings: FeedbackRatings;
    suggestions: string | null;
    createdAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      setLoading(true);
      setError(null);
      getUserFeedbackForEvent(eventId).then((res) => {
        setLoading(false);
        if (res.success && res.feedback) {
          setFeedback(res.feedback);
        } else {
          setError(res.error || "Failed to load feedback");
        }
      });
    } else {
      setFeedback(null);
      setError(null);
    }
  }, [isOpen, eventId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 overflow-hidden bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          data-lenis-prevent
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-900/95">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiMessageSquare className="text-emerald-500" />
                Your Feedback
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-6 px-6 overscroll-contain focus:outline-none data-lenis-prevent">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {error && (
                <p className="text-red-400 text-center py-8">{error}</p>
              )}
              {feedback && !loading && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{eventName}</h3>
                    <p className="text-zinc-500 text-sm">
                      Submitted on {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Overall Rating</label>
                    <div className="flex items-center gap-2">
                      <FiStar className="fill-emerald-500 text-emerald-500" size={24} />
                      <span className="text-2xl font-bold text-emerald-400">{feedback.overallRating}/10</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3">Aspect Ratings</label>
                    <div className="space-y-3">
                      {FEEDBACK_RATING_FIELDS.map((field) => (
                        <div key={field.key} className="flex justify-between items-center">
                          <span className="text-zinc-400">{field.label}</span>
                          <span className="text-emerald-400 font-medium">
                            {(feedback.ratings as Record<string, number>)[field.key] ?? 0}/10
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {feedback.suggestions && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Suggestions</label>
                      <p className="text-zinc-300 bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 whitespace-pre-wrap">
                        {feedback.suggestions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
