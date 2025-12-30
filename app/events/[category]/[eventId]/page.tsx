"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  getPublicEvents,
  registerForEvent,
  checkEventRegistration,
} from "@/actions/events.action";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiX,
  FiCheck,
  FiShare2,
} from "react-icons/fi";
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
}

function EventDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const categoryName = decodeURIComponent(params.category as string);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchEvent();
    checkRegistration();
  }, [eventId]);

  const fetchEvent = async () => {
    const result = await getPublicEvents();
    if (result.success && result.data) {
      const foundEvent = result.data.find((e) => e.id === eventId);
      setEvent(foundEvent || null);
    }
    setLoading(false);
  };

  const checkRegistration = async () => {
    const result = await checkEventRegistration(eventId);
    if (result.success) {
      setIsRegistered(result.isRegistered || false);
    }
    setCheckingRegistration(false);
  };

  const handleRegister = async () => {
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setRegistering(true);

    const result = await registerForEvent(eventId);

    if (result.success) {
      toast.success("Successfully registered for the event!");
      setIsRegistered(true);
      setShowRegistrationModal(false);
      setAcceptedTerms(false);
      // Refresh event data to update participant count
      fetchEvent();
    } else {
      toast.error(result.error || "Failed to register");
    }

    setRegistering(false);
  };

  const handleShare = () => {
    if (event?.registrationLink) {
      navigator.clipboard.writeText(event.registrationLink);
      toast.success("Registration link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Event not found</p>
          <button
            onClick={() => router.push("/events")}
            className="text-orange-500 hover:text-orange-400"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Image */}
      <div className="relative h-[60vh] overflow-hidden group">
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setShowImageModal(true)}
        >
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/1920x1080?text=Event+Image";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

          {/* Click to expand indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
            <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full text-white flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
              Click to view full image
            </div>
          </div>
        </div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/events/${categoryName}`);
          }}
          className="absolute top-28 left-8 flex items-center gap-2 text-white hover:text-orange-500 transition-colors bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg z-10"
        >
          <FiArrowLeft size={20} />
          Back
        </motion.button>

        {/* Category Badge */}
        <div className="absolute top-28 right-8 z-10">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            {event.Category.name}
          </div>
        </div>

        {/* Event Title */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-bold text-white mb-4"
              >
                {event.name}
              </motion.h1>

              {/* Share Button - beside title on large screens */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="hidden lg:flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg hover:bg-zinc-800 transition-colors mb-4"
              >
                <FiShare2 size={18} />
                Share Link
              </motion.button>
            </div>

            {/* Share Button - below title on small screens */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="lg:hidden flex items-center gap-2 bg-zinc-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-zinc-800 transition-colors"
            >
              <FiShare2 size={16} />
              Share Link
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                About This Event
              </h2>
              <p className="text-zinc-300 leading-relaxed">
                {event.description}
              </p>
            </motion.div>

            {/* Terms and Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Terms & Conditions
              </h2>
              <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
                {event.termsandconditions}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 sticky top-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">
                Event Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FiCalendar className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Date</p>
                    <p className="text-white font-medium">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiClock className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Time</p>
                    <p className="text-white font-medium">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiMapPin className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Venue</p>
                    <p className="text-white font-medium">{event.venue}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiUsers className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Participants</p>
                    <p className="text-white font-medium">
                      {event._count.registeredStudents} /{" "}
                      {event.participantLimit} registered
                    </p>
                    <div className="mt-2 w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            (event._count.registeredStudents /
                              event.participantLimit) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Register Button */}
              {isRegistered ? (
                <div className="w-full mt-6 px-6 py-4 bg-green-600 text-white font-bold rounded-lg text-center">
                  ✓ Registered
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRegistrationModal(true)}
                  disabled={
                    event._count.registeredStudents >= event.participantLimit ||
                    checkingRegistration
                  }
                  className="w-full mt-6 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingRegistration
                    ? "Loading..."
                    : event._count.registeredStudents >= event.participantLimit
                    ? "Event Full"
                    : "Register Now"}
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-70 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-7xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 p-2 bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-800 rounded-lg transition-colors text-white"
              >
                <FiX size={24} />
              </button>

              {/* Full Image */}
              <img
                src={event.image}
                alt={event.name}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/1920x1080?text=Event+Image";
                }}
              />

              {/* Image Caption */}
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-bold text-white">{event.name}</h3>
                <p className="text-zinc-400 mt-2">{event.Category.name}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 rounded-2xl w-full max-w-2xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Register for {event.name}
                </h2>
                <button
                  onClick={() => {
                    setShowRegistrationModal(false);
                    setAcceptedTerms(false);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto flex-1">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Terms and Conditions
                  </h3>
                  <div className="bg-zinc-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">
                      {event.termsandconditions}
                    </p>
                  </div>
                </div>

                {/* Acceptance Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-zinc-700 bg-zinc-800 checked:bg-orange-500 checked:border-orange-500 cursor-pointer transition-all"
                    />
                    {acceptedTerms && (
                      <FiCheck
                        className="absolute left-0.5 top-0.5 text-white pointer-events-none"
                        size={16}
                      />
                    )}
                  </div>
                  <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                    I have read and accept the terms and conditions for this
                    event
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => {
                    setShowRegistrationModal(false);
                    setAcceptedTerms(false);
                  }}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  disabled={!acceptedTerms || registering}
                  className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? "Registering..." : "Register for Event"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-xl">Loading event...</div>
        </div>
      }
    >
      <EventDetailPageContent />
    </Suspense>
  );
}
