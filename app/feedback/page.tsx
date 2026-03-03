"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiMessageSquare } from "react-icons/fi";
import { useSession } from "@/lib/auth-client";
import { getUserRegisteredEvents } from "@/actions/submissions.action";
import { getFeedbackReleasesForUser, getFeedbackStatusForUser } from "@/actions/feedback.action";
import FeedbackModal from "@/components/ui/FeedbackModal";
import ViewFeedbackModal from "@/components/ui/ViewFeedbackModal";
import Loader from "@/components/ui/Loader";

interface EventItem {
  id: string;
  name: string;
  slug: string;
  Category: {
    id: string;
    name: string;
  };
}

export default function FeedbackPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [feedbackReleasedIds, setFeedbackReleasedIds] = useState<Set<string>>(new Set());
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});
  const [feedbackEvent, setFeedbackEvent] = useState<EventItem | null>(null);
  const [viewFeedbackEvent, setViewFeedbackEvent] = useState<EventItem | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const registered = await getUserRegisteredEvents();
      if (!registered.success || !registered.data) {
        setEvents([]);
        return;
      }

      const parsedEvents = (registered.data as EventItem[]) || [];
      setEvents(parsedEvents);
      const eventIds = parsedEvents.map((e) => e.id);

      const [releasesRes, statusRes] = await Promise.all([
        getFeedbackReleasesForUser(),
        getFeedbackStatusForUser(eventIds),
      ]);

      if (releasesRes.success && releasesRes.eventIds) {
        setFeedbackReleasedIds(new Set(releasesRes.eventIds));
      }
      if (statusRes.success && statusRes.submitted) {
        setFeedbackSubmitted(statusRes.submitted);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }
    if (session?.user) {
      loadData();
    }
  }, [session, isPending, router, loadData]);

  const releasableEvents = useMemo(
    () => events.filter((event) => feedbackReleasedIds.has(event.id)),
    [events, feedbackReleasedIds]
  );

  if (loading || isPending) return <Loader />;

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mt-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-red-500 mb-3">Feedback</h1>
          <p className="text-zinc-400">
            Submit feedback directly for your released competitions.
          </p>
        </div>

        {releasableEvents.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-300 text-lg mb-2">No feedback forms available right now.</p>
            <p className="text-zinc-500 mb-6">
              Feedback appears here when it is released for your registered competitions.
            </p>
            <Link
              href="/profile/competitions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              Back to My Competitions
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {releasableEvents.map((event) => {
              const submitted = !!feedbackSubmitted[event.id];
              return (
                <div
                  key={event.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-red-500/40 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wide text-red-400 mb-2">{event.Category.name}</p>
                  <h3 className="text-white font-semibold text-lg mb-4">{event.name}</h3>
                  <button
                    onClick={() => (submitted ? setViewFeedbackEvent(event) : setFeedbackEvent(event))}
                    className={`w-full px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      submitted
                        ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 hover:bg-zinc-700"
                        : "bg-amber-600/90 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-600/30"
                    }`}
                  >
                    {submitted ? <FiCheckCircle size={16} /> : <FiMessageSquare size={16} />}
                    {submitted ? "View your Feedback" : "Submit Feedback"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {feedbackEvent && (
        <FeedbackModal
          isOpen={!!feedbackEvent}
          onClose={() => setFeedbackEvent(null)}
          eventId={feedbackEvent.id}
          eventName={feedbackEvent.name}
          onSuccess={() => {
            setFeedbackSubmitted((prev) => ({ ...prev, [feedbackEvent.id]: true }));
            setFeedbackEvent(null);
          }}
        />
      )}

      {viewFeedbackEvent && (
        <ViewFeedbackModal
          isOpen={!!viewFeedbackEvent}
          onClose={() => setViewFeedbackEvent(null)}
          eventId={viewFeedbackEvent.id}
          eventName={viewFeedbackEvent.name}
        />
      )}
    </div>
  );
}
