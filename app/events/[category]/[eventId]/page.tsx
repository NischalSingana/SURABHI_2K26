"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  getPublicEvents,
  registerForEvent,
  checkEventRegistration,
  registerGroupEvent,
  unregisterFromEvent,
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
  isGroupEvent: boolean;
  minTeamSize: number;
  maxTeamSize: number;
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
  const [unregistering, setUnregistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);

  // Group Registration State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [teamSize, setTeamSize] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (event && event.isGroupEvent) {
      setTeamSize(event.minTeamSize);
    }
  }, [event]);

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

    if (event?.isGroupEvent) {
      setShowRegistrationModal(false);
      setShowGroupModal(true);
      return;
    }

    setRegistering(true);

    const result = await registerForEvent(eventId);

    if (result.success) {
      toast.success("Successfully registered for the event!");
      setIsRegistered(true);
      setShowRegistrationModal(false);
      setAcceptedTerms(false);
      fetchEvent();
    } else {
      toast.error(result.error || "Failed to register");
    }

    setRegistering(false);
  };

  const handleGroupRegister = async () => {
    console.log("handleGroupRegister started", { groupName, teamSize, teamMembers, event });

    // Basic validation
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      console.log("Validation failed: No group name");
      return;
    }
    const requiredMembers = Math.max(0, teamSize - 1);
    console.log("Required members:", requiredMembers, "Current members:", teamMembers.length);
    if (teamMembers.length < requiredMembers) {
      toast.error(`Please add details for all ${requiredMembers} additional members`);
      console.log("Validation failed: Not enough members");
      return;
    }
    for (const member of teamMembers) {
      if (!member.name || !member.email || !member.phone || !member.college || !member.collegeId) {
        toast.error("Please fill in all details for all team members");
        console.log("Validation failed: Missing member details", member);
        return;
      }
    }

    setRegistering(true);
    try {
      console.log("Calling registerGroupEvent action...");
      const result = await registerGroupEvent(eventId, groupName, teamMembers);
      console.log("Action result:", result);

      if (result.success) {
        toast.success("Team registered successfully!");
        setIsRegistered(true);
        setShowGroupModal(false);
        setAcceptedTerms(false);
        fetchEvent();
      } else {
        toast.error(result.error || "Failed to register team");
      }
    } catch (err) {
      console.error("Error in handleGroupRegister:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    if (event?.registrationLink) {
      navigator.clipboard.writeText(event.registrationLink);
      toast.success("Registration link copied to clipboard!");
    }
  };

  const handleUnregister = async () => {
    setUnregistering(true);

    const result = await unregisterFromEvent(eventId);

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
            onClick={() => router.push("/events")}
            className="text-red-500 hover:text-red-400"
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
          className="absolute top-28 left-8 flex items-center gap-2 text-white hover:text-red-500 transition-colors bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg z-10"
        >
          <FiArrowLeft size={20} />
          Back
        </motion.button>

        {/* Category Badge */}
        <div className="absolute top-28 right-8 z-10">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
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
                      {event.startTime} - {event.endTime}
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

                <div className="flex items-start gap-3">
                  <FiUsers className="text-red-500 mt-1" size={20} />
                  <div>
                    <p className="text-zinc-400 text-sm">Participants</p>
                    <p className="text-white font-medium">
                      {event._count.registeredStudents} /{" "}
                      {event.participantLimit} registered
                    </p>
                    <div className="mt-2 w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (event._count.registeredStudents / event.participantLimit) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                    className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  onClick={() => setShowRegistrationModal(true)}
                  disabled={
                    event._count.registeredStudents >= event.participantLimit ||
                    checkingRegistration
                  }
                  className="w-full mt-6 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-5 h-5 rounded border-2 border-zinc-700 bg-zinc-800 checked:bg-red-600 checked:border-red-600 cursor-pointer transition-all"
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
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? "Registering..." : "Register for Event"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Registration Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 rounded-2xl w-full max-w-3xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Team Registration
                </h2>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="px-8 py-6 overflow-y-auto flex-1 space-y-6">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Group/Team Name *</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 transition-all"
                    placeholder="Enter unique team name"
                  />
                </div>

                {/* Team Size Input */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Total Team Size (Including You) *
                  </label>
                  <input
                    type="number"
                    min={event?.minTeamSize || 2}
                    max={event?.maxTeamSize || 5}
                    value={teamSize || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setTeamSize(0);
                        return;
                      }
                      const size = parseInt(val);
                      if (isNaN(size)) return;
                      setTeamSize(size);

                      const needed = Math.max(0, size - 1);
                      const current = teamMembers.length;
                      if (needed > current) {
                        const newMembers = [...teamMembers];
                        for (let i = 0; i < needed - current; i++) {
                          newMembers.push({ name: '', college: '', collegeId: '', phone: '', email: '' });
                        }
                        setTeamMembers(newMembers);
                      } else if (needed < current) {
                        setTeamMembers(teamMembers.slice(0, needed));
                      }
                    }}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 transition-all"
                  />
                  <p className="text-zinc-500 text-sm mt-1">Min: {event?.minTeamSize} - Max: {event?.maxTeamSize}</p>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>

                  {/* Team Lead (User) Card */}
                  <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-red-600/20 text-red-500 px-2 py-1 rounded text-xs font-bold uppercase">Team Lead</div>
                      <span className="text-zinc-400 text-sm">(You)</span>
                    </div>
                    <p className="text-zinc-500 text-sm italic">Your details will be automatically included in the registration.</p>
                  </div>

                  {/* Member Inputs */}
                  <div className="space-y-6">
                    {teamMembers.map((member, idx) => (
                      <div key={idx} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                        <div className="mb-3 text-white font-medium">Member {idx + 2}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
                            <input
                              type="text"
                              value={member.name}
                              onChange={(e) => {
                                const newMembers = [...teamMembers];
                                newMembers[idx].name = e.target.value;
                                setTeamMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">College *</label>
                            <input
                              type="text"
                              value={member.college}
                              onChange={(e) => {
                                const newMembers = [...teamMembers];
                                newMembers[idx].college = e.target.value;
                                setTeamMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">College ID *</label>
                            <input
                              type="text"
                              value={member.collegeId}
                              onChange={(e) => {
                                const newMembers = [...teamMembers];
                                newMembers[idx].collegeId = e.target.value;
                                setTeamMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-400 mb-1">Phone *</label>
                            <input
                              type="text"
                              value={member.phone}
                              onChange={(e) => {
                                const newMembers = [...teamMembers];
                                newMembers[idx].phone = e.target.value;
                                setTeamMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Email *</label>
                            <input
                              type="email"
                              value={member.email}
                              onChange={(e) => {
                                const newMembers = [...teamMembers];
                                newMembers[idx].email = e.target.value;
                                setTeamMembers(newMembers);
                              }}
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


              </div>

              <div className="px-8 py-6 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGroupRegister}
                  disabled={registering || !groupName || teamSize < (event?.minTeamSize || 2) || teamSize > (event?.maxTeamSize || 5)}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {registering ? "Registering..." : "Confirm Team Registration"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
