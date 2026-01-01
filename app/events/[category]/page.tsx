"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getPublicEvents, registerForEvent, checkEventRegistration, getCategories } from "@/actions/events.action";
import { FiArrowLeft, FiCalendar, FiMapPin, FiClock, FiUsers } from "react-icons/fi";
import SubmissionModal from "@/components/ui/SubmissionModal";
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
  termsandconditions: string;
  registrationLink: string;
  Category: {
    id: string;
    name: string;
  };
  _count: {
    registeredStudents: number;
  };
  isGroupEvent: boolean;
}

function CategoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const categoryName = decodeURIComponent(params.category as string);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState({
    loading: false,
    error: null as string | null,
    success: false,
  });
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [categoryVideo, setCategoryVideo] = useState<string | null>(null);
  const [categoryImage, setCategoryImage] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [categoryName]);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    try {
      if (url.includes("embed")) return url;

      let videoId = "";
      if (url.includes("youtu.be")) {
        videoId = url.split("/").pop()?.split("?")[0] || "";
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
      }
    } catch (e) {
      console.error("Error parsing video URL:", e);
    }
    return url;
  };

  const fetchEvents = async () => {
    // Fetch Category Details (for video and image)
    const categoryResult = await getCategories();
    if (categoryResult.success && categoryResult.data) {
      const currentCategory = categoryResult.data.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (currentCategory) {
        setCategoryVideo(currentCategory.video || null);
        setCategoryImage(currentCategory.image || null);
      }
    }

    const result = await getPublicEvents();
    if (result.success && result.data) {
      const filtered = result.data.filter(
        (event) => event.Category.name.toLowerCase() === categoryName.toLowerCase()
      );
      setEvents(filtered);

      // Check registration status for all events
      const registeredSet = new Set<string>();
      for (const event of filtered) {
        const regResult = await checkEventRegistration(event.id);
        if (regResult.success && regResult.isRegistered) {
          registeredSet.add(event.id);
        }
      }
      setRegisteredEvents(registeredSet);
    }
    setLoading(false);
  };

  const handleEventClick = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const handleRegisterClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();

    if (event.isGroupEvent) {
      toast.info("Redirecting to team registration...");
      router.push(`/events/${encodeURIComponent(categoryName)}/${event.id}`);
      return;
    }

    setSelectedEvent(event);
    setShowRegisterPopup(true);
  };

  const handleRegistrationSubmit = async () => {
    if (!acceptedTerms) {
      setRegistrationStatus({
        loading: false,
        error: "Please accept the terms and conditions",
        success: false,
      });
      return;
    }

    if (!selectedEvent) return;

    setRegistrationStatus({ loading: true, error: null, success: false });

    try {
      const result = await registerForEvent(selectedEvent.id);

      if (result.success) {
        setRegistrationStatus({ loading: false, error: null, success: true });
        setShowRegisterPopup(false);
        setShowSuccessPopup(true);
        // Keep selectedEvent for submission modal
        setAcceptedTerms(false);

        // Update registered events
        setRegisteredEvents(prev => new Set(prev).add(selectedEvent.id));

        // Refresh events to get updated counts
        fetchEvents();
      } else {
        setRegistrationStatus({
          loading: false,
          error: result.error || "Failed to register for event",
          success: false,
        });
      }
    } catch (error) {
      setRegistrationStatus({
        loading: false,
        error: "An unexpected error occurred",
        success: false,
      });
    }
  };

  const closeRegisterPopup = () => {
    setShowRegisterPopup(false);
    setSelectedEvent(null);
    setAcceptedTerms(false);
    setRegistrationStatus({ loading: false, error: null, success: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading events...</div>
      </div>
    );
  }

  // Filter events based on search query
  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/events")}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-red-500 transition-colors mt-20"
        >
          <FiArrowLeft size={20} />
          Back to Categories
        </motion.button>

        {/* Category Media (Video or Image) */}
        {categoryVideo ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-4xl mx-auto mb-12 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
          >
            <div className="relative pt-[56.25%] bg-black">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={getEmbedUrl(categoryVideo) || ""}
                title="Category Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        ) : categoryImage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-4xl mx-auto mb-12 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
          >
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={categoryImage}
                alt={categoryName}
                fill
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        ) : null}

        {/* Category Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-red-500 mb-4 capitalize"
          >
            {categoryName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-xl"
          >
            {events.length} {events.length === 1 ? "event" : "events"} available
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-zinc-500"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>

        {/* Timeline Events */}
        {filteredEvents.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-xl">
              {searchQuery ? `No events found matching "${searchQuery}"` : "No events in this category yet."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-red-600/30 hidden md:block"></div>

            {/* Events */}
            <div className="space-y-8">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start md:ml-8"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 -ml-6 mt-6 hidden md:block">
                    <div className="w-4 h-4 bg-red-600 rounded-full relative z-10">
                      <div className="absolute w-4 h-4 bg-red-600 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>

                  {/* Event Card */}
                  <div
                    className={`bg-zinc-900 rounded-xl p-6 w-full cursor-pointer transition-all duration-300 transform hover:scale-[1.01] border ${expandedEventId === event.id
                      ? "ring-2 ring-red-600 border-red-600"
                      : "border-zinc-800 hover:border-red-600/50"
                      }`}
                    onClick={() => handleEventClick(event.id)}
                  >
                    {/* Event Header */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-bold text-red-500 mb-2">
                        {event.name}
                      </h3>
                      <motion.div
                        animate={{ rotate: expandedEventId === event.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-red-500"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedEventId === event.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col md:flex-row gap-8 mt-6">
                            {/* Event Image - Vertical Portrait Sizing */}
                            <div className="w-full md:w-[350px] relative h-[500px] shrink-0">
                              <Image
                                src={event.image}
                                alt={event.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 350px"
                                className="object-cover rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                                quality={95}
                              />
                            </div>

                            {/* Event Details - Stacked Layout */}
                            <div className="flex-1 flex flex-col justify-between py-2">
                              <div className="space-y-6">
                                <p className="text-zinc-300 text-lg leading-relaxed">
                                  {event.description}
                                </p>

                                <div className="flex flex-col space-y-4 bg-zinc-800/30 p-6 rounded-xl border border-zinc-800">
                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center mr-4 shrink-0">
                                      <FiMapPin className="text-red-500" size={20} />
                                    </div>
                                    <span className="text-base font-medium">{event.venue}</span>
                                  </div>

                                  <div className="w-full h-px bg-zinc-800" />

                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center mr-4 shrink-0">
                                      <FiCalendar className="text-red-500" size={20} />
                                    </div>
                                    <span className="text-base font-medium">
                                      {new Date(event.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>

                                  <div className="w-full h-px bg-zinc-800" />

                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center mr-4 shrink-0">
                                      <FiClock className="text-red-500" size={20} />
                                    </div>
                                    <span className="text-base font-medium">{event.startTime} - {event.endTime}</span>
                                  </div>

                                  <div className="w-full h-px bg-zinc-800" />

                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center mr-4 shrink-0">
                                      <FiUsers className="text-red-500" size={20} />
                                    </div>
                                    <span className="text-base font-medium">
                                      {event._count.registeredStudents} / {event.participantLimit} registered
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Register Button */}
                              <div className="pt-2">
                                {registeredEvents.has(event.id) ? (
                                  <button
                                    disabled
                                    className="bg-zinc-700 text-zinc-400 px-6 py-2 rounded-md cursor-not-allowed"
                                  >
                                    Already Registered
                                  </button>
                                ) : event._count.registeredStudents >= event.participantLimit ? (
                                  <button
                                    disabled
                                    className="bg-zinc-700 text-zinc-400 px-6 py-2 rounded-md cursor-not-allowed"
                                  >
                                    Event Full
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => handleRegisterClick(event, e)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-600/50"
                                  >
                                    Register Now
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Registration Popup */}
      <AnimatePresence>
        {showRegisterPopup && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeRegisterPopup}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-zinc-900 p-8 rounded-xl max-w-md w-full border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-red-500 mb-4">
                Register for {selectedEvent.name}
              </h3>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Event Details:</h4>
                <div className="space-y-1 text-zinc-300 text-sm">
                  <p><span className="text-zinc-400">Venue:</span> {selectedEvent.venue}</p>
                  <p><span className="text-zinc-400">Date:</span> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                  <p><span className="text-zinc-400">Time:</span> {selectedEvent.startTime} - {selectedEvent.endTime}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Terms and Conditions:</h4>
                <div className="bg-zinc-800 p-4 rounded-md mb-4 max-h-40 overflow-y-auto text-zinc-300 text-sm">
                  {selectedEvent.termsandconditions ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEvent.termsandconditions }} />
                  ) : (
                    <p>By registering for this event, you agree to follow all event guidelines and rules.</p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded border-zinc-600 text-red-600 focus:ring-red-600 bg-zinc-800"
                  />
                  I accept the terms and conditions
                </label>
              </div>

              {registrationStatus.error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-100 text-sm">
                  {registrationStatus.error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleRegistrationSubmit}
                  disabled={!acceptedTerms || registrationStatus.loading}
                  className={`flex-1 bg-red-600 text-white px-6 py-2 rounded-md transition-all duration-300 ${!acceptedTerms || registrationStatus.loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-red-700"
                    }`}
                >
                  {registrationStatus.loading ? "Registering..." : "Confirm Registration"}
                </button>
                <button
                  onClick={closeRegisterPopup}
                  className="px-6 py-2 border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-800 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowSuccessPopup(false);
              setSelectedEvent(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-zinc-900 p-8 rounded-xl max-w-md w-full border border-green-500/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-500 mb-2">Success!</h3>
                <p className="text-zinc-300 mb-6">Successfully registered for the event!</p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowSuccessPopup(false);
                      setShowSubmissionModal(true);
                    }}
                    className="w-full bg-red-600 text-white px-6 py-2.5 rounded-md hover:bg-red-700 transition-all duration-300 font-semibold"
                  >
                    Submit Your Work
                  </button>
                  <button
                    onClick={() => router.push("/profile/events")}
                    className="w-full bg-zinc-800 text-white px-6 py-2.5 rounded-md hover:bg-zinc-700 transition-all duration-300 border border-zinc-700"
                  >
                    View My Events
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessPopup(false);
                      setSelectedEvent(null);
                    }}
                    className="w-full text-zinc-400 px-6 py-2 rounded-md hover:text-white transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission Modal */}
      {selectedEvent && (
        <SubmissionModal
          event={selectedEvent}
          isOpen={showSubmissionModal}
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading events...</div>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}
