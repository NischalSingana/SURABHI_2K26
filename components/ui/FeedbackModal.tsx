"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiMessageSquare, FiX } from "react-icons/fi";
import { submitFeedback } from "@/actions/feedback.action";
import { FEEDBACK_RATING_FIELDS, type FeedbackRatings, type RatingKey } from "@/lib/feedback";
import { toast } from "sonner";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  onSuccess?: () => void;
}

const initialRatings: FeedbackRatings = {
  competition: 0,
  experience: 0,
  hospitality: 0,
  fairJudgement: 0,
  organization: 0,
  venue: 0,
};

export default function FeedbackModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  onSuccess,
}: FeedbackModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [ratings, setRatings] = useState<FeedbackRatings>(initialRatings);
  const [suggestions, setSuggestions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (key: RatingKey, value: number) => {
    setRatings((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitFeedback(eventId, {
        overallRating,
        ratings,
        suggestions: suggestions.trim() || undefined,
      });
      if (res.success) {
        toast.success(res.message);
        setOverallRating(0);
        setRatings(initialRatings);
        setSuggestions("");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Focus scroll container when modal opens so trackpad/wheel events are captured
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => scrollRef.current?.focus({ preventScroll: true }), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open so background doesn't scroll
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const prevOverflow = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      const prevTop = document.body.style.top;
      const prevWidth = document.body.style.width;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 overflow-hidden bg-black/70 backdrop-blur-sm"
          onClick={handleBackdropClick}
          data-lenis-prevent
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg h-[85vh] sm:h-[90vh] flex flex-col shrink-0 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl shadow-black/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent
          >
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-900/95 backdrop-blur">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiMessageSquare className="text-red-500" />
                Submit Feedback
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden overscroll-contain py-6 px-6 focus:outline-none"
              tabIndex={0}
              role="region"
              aria-label="Feedback form"
              data-lenis-prevent
              style={{ WebkitOverflowScrolling: "touch" }}
            >
            <form onSubmit={handleSubmit} className="space-y-6 pb-4">
              <div className="rounded-lg p-4 bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-200 text-sm font-medium">
                  Please provide genuine feedback so we can improve ourselves next time. Your honest input helps us deliver better experiences.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{eventName}</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOverallRating((v) => Math.max(0, v - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-lg font-bold transition-colors shrink-0"
                  >
                    −
                  </button>
                  <div className="relative flex-1 flex items-center min-w-0">
                    <div className="absolute left-0 right-0 h-3 rounded-full bg-zinc-700" />
                    <div
                      className="absolute left-0 h-3 rounded-full bg-red-500 transition-all duration-150"
                      style={{ width: `${(overallRating / 10) * 100}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={overallRating}
                      onChange={(e) => setOverallRating(parseInt(e.target.value, 10))}
                      className="relative z-10 w-full h-3 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:-mt-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverallRating((v) => Math.min(10, v + 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-lg font-bold transition-colors shrink-0"
                  >
                    +
                  </button>
                  <span className="flex items-center gap-1 text-xl font-bold text-red-500 min-w-[4rem] shrink-0">
                    <FiStar className="fill-red-500" size={20} />
                    {overallRating}/10
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-300">
                  Rate each aspect (0–10)
                </label>
                {FEEDBACK_RATING_FIELDS.map((field) => {
                  const val = ratings[field.key] ?? 0;
                  return (
                    <div key={field.key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-zinc-400">{field.label}</span>
                        <span className="text-sm font-medium text-red-500">{val}/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSliderChange(field.key, Math.max(0, val - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-base font-bold transition-colors shrink-0"
                        >
                          −
                        </button>
                        <div className="relative flex-1 flex items-center min-w-0">
                          <div className="absolute left-0 right-0 h-2 rounded-full bg-zinc-700" />
                          <div
                            className="absolute left-0 h-2 rounded-full bg-red-500 transition-all duration-150"
                            style={{ width: `${(val / 10) * 100}%` }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={10}
                            value={val}
                            onChange={(e) => handleSliderChange(field.key, parseInt(e.target.value, 10))}
                            className="relative z-10 w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:-mt-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSliderChange(field.key, Math.min(10, val + 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-base font-bold transition-colors shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Improvements or suggestions (optional)
                </label>
                <textarea
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Any suggestions for improvement? We value your insights."
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
