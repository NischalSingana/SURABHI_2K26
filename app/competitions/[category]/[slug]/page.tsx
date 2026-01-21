"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiX,
  FiCheck,
  FiShare2,
  FiLink,
  FiFileText,
  FiCopy,
} from "react-icons/fi";
import { FaWhatsapp, FaTelegram, FaEnvelope } from "react-icons/fa";
import { toast } from "sonner";
import {
  getPublicEvents,
  checkEventRegistration,
  unregisterFromEvent,
} from "@/actions/events.action";
import { formatTime } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

function ShareModal({
  show,
  onClose,
  url,
  title,
  text,
}: {
  show: boolean;
  onClose: () => void;
  url: string;
  title: string;
  text: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: <FaWhatsapp size={24} />,
      color: "bg-[#25D366] hover:bg-[#20bd5a]",
      onClick: () =>
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(
            text + " " + url
          )}`,
          "_blank"
        ),
    },
    {
      name: "Telegram",
      icon: <FaTelegram size={24} />,
      color: "bg-[#0088cc] hover:bg-[#007dbd]",
      onClick: () =>
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(text)}`,
          "_blank"
        ),
    },
    {
      name: "Email",
      icon: <FaEnvelope size={24} />,
      color: "bg-[#EA4335] hover:bg-[#d93025]",
      onClick: () =>
        window.open(
          `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
            text + "\n" + url
          )}`,
          "_self"
        ),
    },
    {
      name: "Copy Link",
      icon: <FiCopy size={24} />,
      color: "bg-zinc-700 hover:bg-zinc-600",
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        } catch (err) {
          toast.error("Failed to copy link");
        }
      },
    },
  ];

  return createPortal(
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[999999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Share Event</h3>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {shareLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    link.onClick();
                    onClose();
                  }}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div
                    className={`${link.color} w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}
                  >
                    {link.icon}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">
                    {link.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Link Preview */}
            <div className="mt-6 p-3 bg-black/50 rounded-lg border border-zinc-800 flex items-center gap-3 overflow-hidden">
              <div className="bg-zinc-800 p-2 rounded-md">
                <FiLink className="text-zinc-400" size={16} />
              </div>
              <p className="text-sm text-zinc-500 truncate flex-1">{url}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ImageModal({
  show,
  onClose,
  image,
  name,
  categoryName,
}: {
  show: boolean;
  onClose: () => void;
  image: string;
  name: string;
  categoryName: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-[999999] p-4"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 md:top-6 md:right-6 p-2 md:p-4 bg-red-600/90 hover:bg-red-600 rounded-full transition-all text-white z-[1000000] shadow-2xl shadow-red-600/40 hover:scale-110 backdrop-blur-md border border-white/10"
          >
            <FiX className="w-5 h-5 md:w-7 md:h-7" />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-7xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Full Image */}
            <img
              src={image}
              alt={name}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                e.currentTarget.src =
                  "https://via.placeholder.com/1920x1080?text=Event+Image";
              }}
            />

            {/* Image Caption */}
            <div className="mt-4 text-center">
              <h3 className="text-2xl font-bold text-white">{name}</h3>
              <p className="text-zinc-400 mt-2">{categoryName}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

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
    individualRegistrations: number;
    groupRegistrations: number;
  };
  isGroupEvent: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  whatsappLink?: string | null;
  brochureLink?: string | null;
}

function EventDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const categoryName = decodeURIComponent(params.category as string);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | undefined>(undefined);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [unregistering, setUnregistering] = useState(false);
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { data: session } = useSession();
  const isOutsider = session?.user?.email && !session.user.email.endsWith("@kluniversity.in");



  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showImageModal || showUnregisterConfirm) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [showImageModal, showUnregisterConfirm]);

  const fetchEvent = async () => {
    try {
      const { getEventBySlug } = await import("@/actions/events.action");
      const result = await getEventBySlug(slug);

      if (result.success && result.data) {
        setEvent(result.data as any);
        // Check registration with ID once we have the event
        checkRegistration(result.data.id);
      } else {
        console.error("Event not found");
      }
    } catch (e) {
      console.error("Error fetching event", e);
    }
    setLoading(false);
  };

  const checkRegistration = async (id: string) => {
    const result = await checkEventRegistration(id);
    if (result.success) {
      setIsRegistered(result.isRegistered || false);
      setIsApproved(result.isApproved);
    }
    setCheckingRegistration(false);
  };



  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: event?.name || "Surabhi 2026",
      text: `Check out ${event?.name} at Surabhi 2026!`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Event link copied to clipboard!");
      }
    } catch (err: any) {
      // Ignore AbortError (user cancelled) or InvalidStateError (share already in progress)
      if (err.name !== 'AbortError' && err.name !== 'InvalidStateError') {
        console.error("Error sharing:", err);
        // Fallback to clipboard if share failed for other reasons
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Event link copied to clipboard!");
        } catch (clipboardErr) {
          console.error("Clipboard error:", clipboardErr);
        }
      }
    }
  };

  const handleUnregister = async () => {
    if (!event) return;
    setUnregistering(true);

    const result = await unregisterFromEvent(event.id);

    if (result.success) {
      toast.success("Successfully unregistered from the event!");
      setIsRegistered(false);
      setShowUnregisterConfirm(false);
      fetchEvent();
    } else {
      toast.error(result.error || "Failed to unregister");
    }

    setUnregistering(false);
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
            onClick={() => router.push("/competitions")}
            className="text-red-500 hover:text-red-400"
          >
            Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <ShareModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={event?.name || "Surabhi 2026"}
        text={`Check out ${event?.name} at Surabhi 2026!`}
      />
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
            router.push(`/competitions/${categoryName}`);
          }}
          className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-white hover:text-red-500 transition-colors bg-black/50 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-lg z-10 text-sm md:text-base"
        >
          <FiArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          Back
        </motion.button>

        {/* Category Badge */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
          <div className="bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium shadow-lg">
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
                setShowShareModal(true);
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
              <div className="text-zinc-300 space-y-2">
                {(() => {
                  // First try splitting by newline
                  let points = event.termsandconditions.split(/\r?\n/).filter(line => line.trim());

                  // If only one point found (likely a paragraph), try splitting by sentences
                  if (points.length === 1 && points[0].length > 50) {
                    // Split by period followed by space, or period at end of string
                    // This regex looks for a period followed by a space or end of string, 
                    // but ignores periods in common abbreviations like "Mr.", "e.g.", etc if strictness needed,
                    // but for T&C simple split is usually sufficient.
                    const sentences = points[0].split(/\.\s+/).filter(s => s.trim());
                    if (sentences.length > 1) {
                      points = sentences.map(s => s.trim().endsWith('.') ? s : s + '.');
                    }
                  }

                  return points.map((line, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="text-red-500 mt-1.5 min-w-[6px] h-1.5 rounded-full bg-red-500 block" />
                      <span>{line.replace(/^[•\-\*]\s*/, '').trim()}</span>
                    </div>
                  ));
                })()}
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
                  <FiCalendar className="text-red-500 mt-1" size={20} />
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
                  <FiClock className="text-red-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Time</p>
                    <p className="text-white font-medium">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FiMapPin className="text-red-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Venue</p>
                    <p className="text-white font-medium">{event.venue}</p>
                  </div>
                </div>


              </div>

              {/* External Registration Link */}
              {event.registrationLink && (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 mt-6 group"
                >
                  <FiLink size={20} className="group-hover:rotate-45 transition-transform duration-300" />
                  <span>Fill the form</span>
                </a>
              )}

              {/* WhatsApp Link */}
              {event.whatsappLink && (
                <a
                  href={event.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 mt-4 group"
                >
                  <FaWhatsapp size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>Join WhatsApp Group</span>
                </a>
              )}

              {/* Brochure Link */}
              {event.brochureLink && (
                <a
                  href={event.brochureLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4 group"
                >
                  <FiFileText size={20} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>View Brochure</span>
                </a>
              )}



              {/* Register/Unregister Button */}
              {isRegistered ? (
                <div className="space-y-3 mt-6">
                  <div className="w-full px-6 py-4 bg-green-600/20 border border-green-500/50 text-green-400 font-bold rounded-lg text-center flex items-center justify-center gap-2">
                    <FiCheck size={20} />
                    Registered
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUnregisterConfirm(true)}
                    disabled={unregistering}
                    className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:bg-red-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {unregistering ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Unregistering...
                      </>
                    ) : (
                      <>
                        <FiX size={18} />
                        Unregister
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (isApproved === undefined) {
                      toast.error("Please register/login first to register for event.");
                      // router.push("/login"); // Optional: Redirect to login
                      return;
                    }
                    if (isApproved === false) {
                      toast.error("Please wait till admin approves your registration.");
                      return;
                    }
                    router.push(`/competitions/${categoryName}/${slug}/register`);
                  }}
                  disabled={
                    (event._count.individualRegistrations + event._count.groupRegistrations) >= event.participantLimit ||
                    checkingRegistration
                  }
                  className="w-full mt-6 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingRegistration
                    ? "Loading..."
                    : (event._count.individualRegistrations + event._count.groupRegistrations) >= event.participantLimit
                      ? "Event Full"
                      : "Register Now"}
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Image Modal using Portal */}
      <ImageModal
        show={showImageModal}
        onClose={() => setShowImageModal(false)}
        image={event.image}
        name={event.name}
        categoryName={event.Category.name}
      />



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
                <p className="text-zinc-300 mb-4">
                  Are you sure you want to unregister from <span className="font-semibold text-white">{event.name}</span>?
                </p>
                <p className="text-zinc-400 text-sm">
                  This action cannot be undone. You will need to register again if you change your mind.
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => setShowUnregisterConfirm(false)}
                  disabled={unregistering}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnregister}
                  disabled={unregistering}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unregistering ? "Unregistering..." : "Yes, Unregister"}
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
