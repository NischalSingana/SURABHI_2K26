"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFeedbackAdminData,
  setFeedbackRelease,
  getFeedbackForEvent,
} from "@/actions/feedback.action";
import { FEEDBACK_RATING_FIELDS, type FeedbackRatings } from "@/lib/feedback";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiRefreshCw, FiDownload, FiEye, FiToggleLeft, FiToggleRight, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface EventItem {
  id: string;
  name: string;
  date: Date;
  Category: { name: string };
  _count: {
    individualRegistrations: number;
    groupRegistrations: number;
    competitionFeedbacks: number;
  };
  isReleased: boolean;
  releasedAt: Date | null;
}

interface FeedbackItem {
  id: string;
  overallRating: number;
  ratings: FeedbackRatings;
  suggestions: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    collage: string | null;
    phone: string | null;
  };
}

export default function FeedbackAdminClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<{
    event: { name: string; date: Date; Category: { name: string } };
    feedbacks: FeedbackItem[];
  } | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFeedbackAdminData();
      if (res.success && res.data) {
        setEvents(res.data as EventItem[]);
      } else {
        toast.error(res.error || "Failed to load");
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRelease = async (eventId: string, currentReleased: boolean) => {
    setToggling(eventId);
    try {
      const res = await setFeedbackRelease(eventId, !currentReleased);
      if (res.success) {
        toast.success(res.message);
        loadData();
        if (selectedEventId === eventId) {
          setSelectedEventId(null);
          setFeedbackData(null);
        }
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setToggling(null);
    }
  };

  const handleViewFeedback = async (eventId: string) => {
    if (selectedEventId === eventId && feedbackData) return;
    setSelectedEventId(eventId);
    setFeedbackLoading(true);
    try {
      const res = await getFeedbackForEvent(eventId);
      if (res.success && res.event && res.feedbacks) {
        setFeedbackData({
          event: res.event,
          feedbacks: res.feedbacks as FeedbackItem[],
        });
      } else {
        toast.error(res.error || "Failed to load feedback");
        setFeedbackData(null);
      }
    } catch {
      toast.error("Failed to load feedback");
      setFeedbackData(null);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDownloadPdf = async (eventId: string) => {
    setPdfLoading(eventId);
    try {
      const res = await getFeedbackForEvent(eventId);
      if (!res.success || !res.event || !res.feedbacks) {
        toast.error("Failed to load feedback for PDF");
        return;
      }

      // Landscape for more table width - avoids jumbled headers
      const doc = new jsPDF("l", "mm", "a4");
      const event = res.event;
      const feedbacks = res.feedbacks as FeedbackItem[];

      doc.setFontSize(18);
      doc.text("Competition Feedback Report", 14, 20);
      doc.setFontSize(12);
      doc.text(`${event.Category?.name || "Category"} - ${event.name}`, 14, 28);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
      doc.setFontSize(9);
      doc.text(`Total feedback entries: ${feedbacks.length}`, 14, 40);

      if (feedbacks.length === 0) {
        doc.text("No feedback submitted yet.", 14, 50);
      } else {
        // Short headers to prevent overflow/jumbling in PDF cells
        const shortLabels = ["Comp", "Flow", "Hosp", "Fair", "Org", "Venue"];
        const head = [
          "#",
          "Name",
          "Email",
          "College",
          "Overall",
          ...shortLabels,
          "Suggestions",
        ];
        const body = feedbacks.map((f, i) => [
          String(i + 1),
          (f.user.name || "—").slice(0, 25),
          (f.user.email || "—").slice(0, 35),
          (f.user.collage || "—").slice(0, 22),
          `${f.overallRating}/10`,
          ...FEEDBACK_RATING_FIELDS.map(
            (rf) => `${(f.ratings[rf.key] ?? 0)}`
          ),
          (f.suggestions || "—").slice(0, 50),
        ]);

        autoTable(doc, {
          startY: 48,
          head: [head],
          body,
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 3 },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 35 },
            2: { cellWidth: 45 },
            3: { cellWidth: 32 },
            4: { cellWidth: 12 },
            5: { cellWidth: 11 },
            6: { cellWidth: 11 },
            7: { cellWidth: 11 },
            8: { cellWidth: 11 },
            9: { cellWidth: 11 },
            10: { cellWidth: 11 },
            11: { cellWidth: 60 },
          },
        });
      }

      const filename = `Feedback_${event.name.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-10 w-10 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">
                Competition
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-300">
                Category
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-zinc-300">
                Registrations
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-zinc-300">
                Feedbacks
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-zinc-300">
                Release
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-zinc-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const totalReg =
                e._count.individualRegistrations + e._count.groupRegistrations;
              return (
                <tr
                  key={e.id}
                  className="border-b border-zinc-700/50 hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 text-white font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {e.Category?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-300">
                    {totalReg}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-300">
                    {e._count.competitionFeedbacks}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleRelease(e.id, e.isReleased)}
                      disabled={toggling === e.id}
                      className="inline-flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                    >
                      {e.isReleased ? (
                        <>
                          <FiToggleRight
                            className="text-emerald-500"
                            size={24}
                          />
                          <span className="text-emerald-400">Open</span>
                        </>
                      ) : (
                        <>
                          <FiToggleLeft
                            className="text-zinc-500"
                            size={24}
                          />
                          <span className="text-zinc-400">Closed</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleViewFeedback(e.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      <FiEye size={14} className="inline mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(e.id)}
                      disabled={pdfLoading === e.id}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm disabled:opacity-50"
                    >
                      {pdfLoading === e.id ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <>
                          <FiDownload size={14} className="inline mr-1" />
                          PDF
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12 text-zinc-400">
          No competitions found.
        </div>
      )}

      <AnimatePresence>
        {selectedEventId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setSelectedEventId(null);
              setFeedbackData(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-700 shrink-0">
                <h2 className="text-xl font-semibold text-white">
                  Feedback Details
                </h2>
                <button
                  onClick={() => {
                    setSelectedEventId(null);
                    setFeedbackData(null);
                  }}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <FiX size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {feedbackLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin h-10 w-10 border-2 border-red-500 border-t-transparent rounded-full" />
                  </div>
                ) : feedbackData ? (
                  <div className="space-y-4">
                    <p className="text-zinc-400 font-medium">
                      {feedbackData.event.Category?.name} - {feedbackData.event.name}
                    </p>
                    {feedbackData.feedbacks.length === 0 ? (
                      <p className="text-zinc-500 py-8 text-center">No feedback submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {feedbackData.feedbacks.map((f, idx) => (
                          <div
                            key={f.id}
                            className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                          >
                            <div className="flex flex-wrap justify-between gap-2 mb-3">
                              <span className="font-medium text-white">
                                #{idx + 1} {f.user.name || "Anonymous"}
                              </span>
                              <span className="text-sm text-zinc-400">
                                {new Date(f.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm text-zinc-400 space-y-1">
                              <p>Email: {f.user.email}</p>
                              {f.user.collage && (
                                <p>College: {f.user.collage}</p>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="px-2 py-1 rounded bg-red-600/20 text-red-400 text-sm">
                                Overall: {f.overallRating}/10
                              </span>
                              {FEEDBACK_RATING_FIELDS.map((rf) => (
                                <span
                                  key={rf.key}
                                  className="px-2 py-1 rounded bg-zinc-700 text-zinc-300 text-xs"
                                >
                                  {rf.label}: {(f.ratings[rf.key] ?? 0)}/10
                                </span>
                              ))}
                            </div>
                            {f.suggestions && (
                              <div className="mt-3 pt-3 border-t border-zinc-700">
                                <p className="text-xs text-zinc-500 uppercase mb-1">
                                  Suggestions
                                </p>
                                <p className="text-zinc-300 text-sm">
                                  {f.suggestions}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
