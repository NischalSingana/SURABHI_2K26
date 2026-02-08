"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getPublicEvents, registerForEvent, getUserRegistrations, getCategories } from "@/actions/events.action";
import { FiArrowLeft, FiCalendar, FiMapPin, FiClock, FiUsers, FiFileText } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import SubmissionModal from "@/components/ui/SubmissionModal";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { formatTime } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

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
  whatsappLink?: string | null;
  brochureLink?: string | null;
  Category: {
    id: string;
    name: string;
  };
  _count: {
    individualRegistrations: number;
    groupRegistrations: number;
  };
  isGroupEvent: boolean;
}

// Fallback poster paths when event has no image
const CATEGORY_POSTER_FALLBACK: Record<string, string> = {
  "chitrakala": "/poster-gallery/CHITRAKALA.png",
  "sahitya": "/poster-gallery/SAHITYA.jpg",
  "cine carnival": "/poster-gallery/CINE CARNIVAL.png",
  "national parliamentary simulation": "/poster-gallery/MOCK PARLIAMENT.jpg",
  "natyaka": "/poster-gallery/NATYAKA.png",
  "raaga": "/poster-gallery/RAAGA.png",
  "nrithya": "/poster-gallery/NRITHYA.png",
  "vastranaut": "/poster-gallery/VASTRANAUT.png",
  "kurukshetra": "/poster-gallery/KURUKSHETRA.png",
};

function getEventPosterSrc(event: Event, categoryImage: string | null): string {
  if (event.image) return event.image;
  if (categoryImage) return categoryImage;
  const catName = (event.Category?.name || "").toLowerCase();
  const fallback = Object.entries(CATEGORY_POSTER_FALLBACK).find(([k]) => catName.includes(k));
  return fallback?.[1] || "https://via.placeholder.com/350x500/27272a/71717a?text=Poster+coming+soon";
}

function CategoryPageContent() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = params.category as string;

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
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [categoryDisplayName, setCategoryDisplayName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    screenshot: null as File | null,
    utrId: "",
    payeeName: "",
  });
  const [uploadingPayment, setUploadingPayment] = useState(false);

  const { data: session } = useSession();
  const isInternational = !!(session?.user as { isInternational?: boolean } | undefined)?.isInternational;

  useEffect(() => {
    fetchEvents();
  }, [categoryParam]);

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
    const categoryResult = await getCategories(false);
    let resolvedCategory: { slug: string; name: string } | null = null;

    if (categoryResult.success && categoryResult.data) {
      const decoded = decodeURIComponent(categoryParam);
      const currentCategory = (categoryResult.data as Array<{ id: string; name: string; slug: string; image: string | null; video: string | null; Event: any[] }>).find(
        (c: { id: string; name: string; slug: string; image: string | null; video: string | null; Event: any[] }) => c.slug === categoryParam || c.name.toLowerCase() === decoded.toLowerCase()
      );
      if (currentCategory) {
        resolvedCategory = { slug: currentCategory.slug, name: currentCategory.name };
        setCategoryVideo(currentCategory.video || null);
        setCategoryImage(currentCategory.image || null);
        setCategorySlug(currentCategory.slug);
        setCategoryDisplayName(currentCategory.name);
      }
    }

    const result = await getPublicEvents();

    if (result.success && result.data) {
      const filtered = resolvedCategory
        ? result.data.filter(
            (event) => event.Category.name.toLowerCase() === resolvedCategory!.name.toLowerCase()
          )
        : [];
      setEvents(filtered);

      if (resolvedCategory) {
        const regResult = await getUserRegistrations();
        if (regResult.success) {
          if (regResult.registeredEventIds) {
            setRegisteredEvents(new Set(regResult.registeredEventIds));
          }
          if (regResult.email) {
            setUserEmail(regResult.email);
          }
        }
      }
    } else {
      console.error("[fetchEvents] Failed:", result.error);
      toast.error("Failed to load events: " + result.error);
    }
    setLoading(false);
  };

  const handleEventClick = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const handleRegisterClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();

    toast.info("Redirecting to registration page...");
    const eventIdentifier = (event as any).slug || event.id;
    router.push(`/competitions/${categorySlug}/${eventIdentifier}`);
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

    // Check for Manual Payment Requirement (Non-KL Users)
    const isKLStudent = userEmail?.endsWith("@kluniversity.in");

    if (!isKLStudent && !showPaymentStep) {
      setShowPaymentStep(true);
      return;
    }

    if (showPaymentStep) {
      if (!paymentDetails.screenshot || !paymentDetails.utrId || !paymentDetails.payeeName) {
        setRegistrationStatus({
          loading: false,
          error: "Please complete all payment details",
          success: false,
        });
        return;
      }
    }

    setRegistrationStatus({ loading: true, error: null, success: false });

    try {
      let uploadedScreenshotUrl = "";

      if (showPaymentStep && paymentDetails.screenshot) {
        setUploadingPayment(true);
        const formData = new FormData();
        formData.append("file", paymentDetails.screenshot);

        // Dynamically import upload action to avoid server-client issues if any
        const { uploadPaymentScreenshot } = await import("@/actions/upload.action");
        const uploadResult = await uploadPaymentScreenshot(formData);

        if (!uploadResult.success || !uploadResult.url) {
          setRegistrationStatus({
            loading: false,
            error: "Failed to upload payment screenshot. Please try again.",
            success: false
          });
          setUploadingPayment(false);
          return;
        }
        uploadedScreenshotUrl = uploadResult.url;
        setUploadingPayment(false);
      }

      const result = await registerForEvent(selectedEvent.id, undefined,
        showPaymentStep ? {
          paymentScreenshot: uploadedScreenshotUrl,
          utrId: paymentDetails.utrId,
          payeeName: paymentDetails.payeeName
        } : undefined
      );

      if (result.success) {
        setRegistrationStatus({ loading: false, error: null, success: true });
        setShowRegisterPopup(false);
        setShowSuccessPopup(true);
        // Keep selectedEvent for submission modal
        setAcceptedTerms(false);
        setShowPaymentStep(false); // Reset
        setPaymentDetails({ screenshot: null, utrId: "", payeeName: "" }); // Reset

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
      setUploadingPayment(false);
    }
  };

  const closeRegisterPopup = () => {
    setShowRegisterPopup(false);
    setSelectedEvent(null);
    setAcceptedTerms(false);
    setShowPaymentStep(false);
    setPaymentDetails({ screenshot: null, utrId: "", payeeName: "" });
    setRegistrationStatus({ loading: false, error: null, success: false });
  };

  if (loading) {
    return <Loader />;
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
          onClick={() => router.push("/competitions")}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-red-500 transition-colors mt-20"
        >
          <FiArrowLeft size={20} />
          Back to Competitions
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
                alt={categoryDisplayName || categoryParam}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                quality={75}
              />
            </div>
          </motion.div>
        ) : null}

        {/* Category Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-red-500 mb-4 capitalize"
          >
            {categoryDisplayName || categoryParam}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-base md:text-xl"
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
                      <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-2">
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
                            {/* Event Image - Vertical Portrait Sizing (fallback to category poster if event has none) */}
                            <div className="w-full md:w-[350px] relative h-[300px] md:h-[500px] shrink-0 bg-zinc-800/50 rounded-xl overflow-hidden">
                              <Image
                                src={getEventPosterSrc(event, categoryImage)}
                                alt={event.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 350px"
                                className="object-cover rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
                                quality={75}
                                unoptimized={!!getEventPosterSrc(event, categoryImage).match(/(r2\.dev|digitaloceanspaces|r2\.cloudflarestorage)/i)}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = "none";
                                  const sibling = target.nextElementSibling as HTMLElement | null;
                                  if (sibling) sibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="absolute inset-0 hidden items-center justify-center bg-zinc-800/80 text-zinc-500 text-sm"
                                style={{ display: "none" }}
                              >
                                Poster coming soon
                              </div>
                            </div>

                            {/* Event Details - Stacked Layout */}
                            <div className="flex-1 flex flex-col justify-between py-2" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-6">
                                <p className="text-zinc-300 text-sm md:text-lg leading-loose">
                                  {event.description}
                                </p>

                                <div className="flex flex-col space-y-3 bg-zinc-800/30 p-5 rounded-xl border border-zinc-800">
                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center mr-3 shrink-0">
                                      <FiMapPin className="text-red-500" size={16} />
                                    </div>
                                    <span className="text-sm font-medium">{isInternational ? "Virtual" : event.venue}</span>
                                  </div>

                                  <div className="w-full h-px bg-zinc-800/50" />

                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center mr-3 shrink-0">
                                      <FiCalendar className="text-red-500" size={16} />
                                    </div>
                                    <span className="text-sm font-medium">
                                      {new Date(event.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>

                                  <div className="w-full h-px bg-zinc-800/50" />

                                  <div className="flex items-center text-zinc-200">
                                    <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center mr-3 shrink-0">
                                      <FiClock className="text-red-500" size={16} />
                                    </div>
                                    <span className="text-sm font-medium">{isInternational ? "Will be announced later (to your convenient timezone)" : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Register & View Brochure */}
                              <div className="pt-2 flex flex-wrap gap-2">
                                {event.brochureLink && (
                                  <a
                                    href={event.brochureLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-5 py-2 rounded-md transition-all duration-300 border border-zinc-600"
                                  >
                                    <FiFileText size={16} />
                                    View Brochure
                                  </a>
                                )}
                                {registeredEvents.has(event.id) ? (
                                  <button
                                    disabled
                                    className="bg-zinc-700 text-zinc-400 px-6 py-2 rounded-md cursor-not-allowed"
                                  >
                                    Already Registered
                                  </button>
                                ) : (event._count.individualRegistrations + event._count.groupRegistrations) >= event.participantLimit ? (
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={closeRegisterPopup}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-zinc-900 p-8 rounded-xl max-w-md w-full border border-zinc-800 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-red-500 mb-4">
                Register for {selectedEvent.name}
              </h3>

              {/* ID Card Mandatory Warning */}
              <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="text-red-500 text-xl font-bold shrink-0">⚠️</div>
                  <div>
                    <h3 className="text-red-400 font-bold text-xs mb-1 uppercase tracking-wide">
                      Important Notice
                    </h3>
                    <p className="text-red-300 text-xs font-medium leading-relaxed">
                      COLLEGE PHYSICAL ID CARD MANDATORY FOR ENTRY TO THE FEST
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Event Details:</h4>
                <div className="space-y-1 text-zinc-300 text-sm">
                  <p><span className="text-zinc-400">Venue:</span> {isInternational ? "Virtual" : selectedEvent.venue}</p>
                  <p><span className="text-zinc-400">Date:</span> {new Date(selectedEvent.date).toLocaleDateString()}</p>
                  <p><span className="text-zinc-400">Time:</span> {isInternational ? "Will be announced later to your convenient timezone" : `${formatTime(selectedEvent.startTime)} - ${formatTime(selectedEvent.endTime)}`}</p>
                </div>
              </div>

              {!showPaymentStep && !userEmail?.endsWith("@kluniversity.in") && (
                <div className="mb-6 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                  <h4 className="text-sm font-semibold text-white mb-2">Includes (₹350):</h4>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 1 Day Free Accommodation</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Complimentary Lunch</li>
                    <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Access to all Events & Pro Shows</li>
                  </ul>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-2">Terms and Conditions:</h4>
                <div
                  className="bg-zinc-800 p-4 rounded-md mb-4 max-h-40 overflow-y-auto text-zinc-300 text-sm overscroll-contain relative group"
                  data-lenis-prevent
                  onScroll={(e) => {
                    const element = e.currentTarget;
                    // Allow a 10px buffer
                    const isBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) <= 10;
                    if (isBottom) {
                      element.setAttribute('data-scrolled', 'true');
                    }
                  }}
                  // Initialization ref to check if scroll is needed at all
                  ref={(el) => {
                    if (el) {
                      // If content height <= container height, it's already "scrolled"
                      if (el.scrollHeight <= el.clientHeight) {
                        el.setAttribute('data-scrolled', 'true');
                      }
                    }
                  }}
                >
                  {selectedEvent.termsandconditions ? (
                    <div className="space-y-2">
                      {(() => {
                        let points = selectedEvent.termsandconditions.split(/\r?\n/).filter(line => line.trim());
                        if (points.length === 1 && points[0].length > 50) {
                          const sentences = points[0].split(/\.\s+/).filter(s => s.trim());
                          if (sentences.length > 1) {
                            points = sentences.map(s => s.trim().endsWith('.') ? s : s + '.');
                          }
                        }
                        return points.map((point, index) => (
                          <div key={index} className="flex gap-2 text-start">
                            <span className="text-red-500 mt-1.5 min-w-[5px] h-1.5 rounded-full bg-red-500 block shrink-0" />
                            <span>{point.replace(/^[•\-\*]\s*/, '')}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <p>By registering for this event, you agree to follow all event guidelines and rules.</p>
                  )}
                </div>
                <label className="flex items-center gap-2 text-white cursor-pointer relative">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      const termsBox = e.currentTarget.closest('.mb-6')?.querySelector('[data-lenis-prevent]');
                      const hasScrolled = termsBox?.getAttribute('data-scrolled') === 'true';

                      if (!hasScrolled && !acceptedTerms) {
                        toast.error("Please scroll through all terms and conditions first");
                        return;
                      }
                      setAcceptedTerms(e.target.checked);
                    }}
                    className="rounded border-zinc-600 text-red-600 focus:ring-red-600 bg-zinc-800"
                  />
                  I accept the terms and conditions
                </label>
              </div>

              {/* Payment Step for Non-KL Users */}
              {showPaymentStep && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-6 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700"
                >
                  <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    Payment Verification
                    <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Required for Non-KL</span>
                  </h4>

                  {/* ID Card Mandatory Warning */}
                  <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="text-red-500 text-xl font-bold shrink-0">⚠️</div>
                      <div>
                        <h3 className="text-red-400 font-bold text-xs mb-1 uppercase tracking-wide">
                          Important Notice
                        </h3>
                        <p className="text-red-300 text-xs font-medium leading-relaxed">
                          COLLEGE PHYSICAL ID CARD MANDATORY FOR ENTRY TO THE FEST
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center mb-4">
                    <div className="text-center mb-4">
                      <p className="text-zinc-400 text-xs">Total Amount</p>
                      <p className="text-xl font-bold text-red-500">₹350</p>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">Scan QR to Pay</p>
                    <div className="bg-white p-4 rounded-xl shadow-2xl shadow-black/50 border-4 border-white mb-4 transform hover:scale-105 transition-transform duration-300">
                      <div className="w-64 h-64 sm:w-72 sm:h-72 relative">
                        <Image
                          src="/images/paymentQR.png"
                          alt="Payment QR"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Upload Payment Screenshot</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("File size exceeds 5MB limit");
                              e.target.value = "";
                              return;
                            }
                            setPaymentDetails({ ...paymentDetails, screenshot: file });
                          }
                        }}
                        className="w-full text-sm text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">UTR / Transaction ID</label>
                      <input
                        type="text"
                        value={paymentDetails.utrId}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, utrId: e.target.value })}
                        placeholder="Enter UTR ID"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Payee Name</label>
                      <input
                        type="text"
                        value={paymentDetails.payeeName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, payeeName: e.target.value })}
                        placeholder="Enter Name on UPI"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 outline-none"
                      />
                    </div>

                    <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex gap-2 text-left">
                        <span className="text-yellow-500 text-[10px] md:text-xs flex-shrink-0">•</span>
                        <p className="text-[10px] md:text-xs text-yellow-500 leading-relaxed font-medium uppercase">
                          The amount once paid will not be refunded under any circumstances.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

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
                  {registrationStatus.loading || uploadingPayment ?
                    (uploadingPayment ? "Uploading Proof..." : "Registering...") :
                    (showPaymentStep ? "Submit & Pay" : (userEmail?.endsWith("@kluniversity.in") ? "Confirm Registration" : "Proceed to Payment"))
                  }
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
                <p className="text-zinc-300 mb-6">
                  {userEmail?.endsWith("@kluniversity.in")
                    ? "Successfully registered for the event!"
                    : "Your registration is submitted! Please wait for admin approval (2-3 business days). You will receive an email with your ticket once approved."}
                </p>

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
                    onClick={() => router.push("/profile/competitions")}
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

      {/* Hidden Image Preloader to speed up open interaction */}
      <div className="hidden" aria-hidden="true">
        {events.map((event) => (
          <div key={`preload-${event.id}`} className="relative w-[350px] h-[500px]">
            <Image
              src={event.image}
              alt={event.name}
              fill
              sizes="(max-width: 768px) 100vw, 350px"
              quality={75}
              priority
            />
          </div>
        ))}
      </div>

      {/* Submission Modal */}
      {
        selectedEvent && (
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
        )
      }
    </div >
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CategoryPageContent />
    </Suspense>
  );
}
