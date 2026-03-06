"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiCalendar, FiClock, FiSearch } from "react-icons/fi";
import Loader from "@/components/ui/Loader";
import { isOnlineRegistrationClosed, ONLINE_REG_CLOSED_MESSAGE } from "@/lib/registration-deadline";
import { COMPETITIONS_SCHEDULE_IMAGE_URL } from "@/lib/schedule";

export interface CategoryData {
  name: string;
  slug: string;
  count: number;
  image: string;
}

interface CompetitionsClientProps {
  initialCategories: CategoryData[];
}

export default function CompetitionsClient({
  initialCategories,
}: CompetitionsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const [hasChosenToBrowse, setHasChosenToBrowse] = useState(false);
  const minLoadTime = 1200;
  const startTimeRef = useRef<number>(0);
  // Preload images and manage loading state
  useEffect(() => {
    startTimeRef.current = Date.now();
    const imagesToPreload = Math.min(6, initialCategories.length); // Preload first 6 priority images
    
    if (imagesToPreload === 0) {
      // No images to load, just wait minimum time
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remaining);
      return;
    }

    // When all priority images are loaded or minimum time has passed
    const checkComplete = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const allImagesLoaded = imagesLoaded >= imagesToPreload;
      const minTimeElapsed = elapsed >= minLoadTime;

      if (allImagesLoaded && minTimeElapsed) {
        setIsLoading(false);
      } else if (allImagesLoaded && !minTimeElapsed) {
        // Images loaded but minimum time not elapsed
        setTimeout(() => setIsLoading(false), minLoadTime - elapsed);
      } else if (!allImagesLoaded && minTimeElapsed) {
        // Minimum time elapsed but images not all loaded (timeout protection)
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    checkComplete();
  }, [imagesLoaded, initialCategories.length]);

  const regClosed = isOnlineRegistrationClosed();


  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("surabhi_competitions_browsed");
      if (stored === "1") setHasChosenToBrowse(true);
    } catch { /* ignore */ }
  }, []);

  const handleBrowseClick = () => {
    try { sessionStorage.setItem("surabhi_competitions_browsed", "1"); } catch { /* ignore */ }
    setHasChosenToBrowse(true);
  };

  const handleImageLoad = () => {
    setImagesLoaded((prev) => prev + 1);
  };

  const handleScheduleDownload = () => {
    const downloadUrl = `/api/schedule/download?url=${encodeURIComponent(
      COMPETITIONS_SCHEDULE_IMAGE_URL
    )}&filename=${encodeURIComponent("surabhi-2026-competitions-schedule")}`;
    window.location.href = downloadUrl;
  };

  const filteredCategories = initialCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pure black placeholder for blur effect
  const blurDataURL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMDAwMCIvPjwvc3ZnPg==";

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <Loader />
            <p className="absolute bottom-20 text-zinc-400 text-sm">Loading competitions...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen competitions-bg py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        {/* Subtle dot grid for depth */}
        <div className="absolute inset-0 competitions-bg-dots pointer-events-none" aria-hidden />


      {/* Closed overlay when online reg closed (after 5 PM IST) */}
      <AnimatePresence>
        {regClosed && !hasChosenToBrowse && (
          <motion.div
            key="reg-closed-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-30 pt-[72px] flex flex-col items-center justify-center overflow-hidden bg-[#080a0a]"
          >
            {/* Premium layered background */}
            <div className="absolute inset-0 reg-closed-overlay-bg" />
            <div className="absolute inset-0 reg-closed-overlay-mesh" />
            <div className="absolute inset-0 reg-closed-overlay-rays" />
            {/* Soft vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
              }}
            />

            <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative bg-zinc-950/90 backdrop-blur-2xl border border-red-900/50 px-8 py-10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                {/* Premium inner glow & gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/15 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute inset-0 ring-1 ring-inset ring-red-500/10 pointer-events-none rounded-2xl" />
                <div className="relative">
                  <div className="text-red-400 font-black text-4xl md:text-5xl mb-2 tracking-widest uppercase drop-shadow-[0_0_30px_rgba(248,113,113,0.2)]">
                    Online registrations closed
                  </div>
                  <div className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                    {ONLINE_REG_CLOSED_MESSAGE}
                  </div>
                  <div className="mt-4 text-left bg-red-950/40 border border-red-800/70 rounded-xl px-4 py-3 text-xs md:text-sm text-red-100 space-y-2">
                    <div className="font-semibold text-red-300">
                      🚨 IMPORTANT NOTICE – SPOT &amp; VISITOR REGISTRATIONS 🚨
                    </div>
                    <p>⚠️ On 6th and 7th, OUTSIDERS (External Participants) are NOT allowed for Spot Registrations.</p>
                    <p>❗ STRICTLY NO EXTERNAL PARTICIPANT will be permitted for Spot Registration on these dates.</p>
                    <p>🚫 VISITORS are also NOT allowed on 6th and 7th.</p>
                  </div>
                  <motion.button
                    onClick={handleBrowseClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-red-950/50 hover:shadow-red-600/30 hover:shadow-xl"
                  >
                    <FiSearch size={22} />
                    Browse competition details
                  </motion.button>
                  <motion.button
                    onClick={() => router.push("/schedule")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative mt-4 inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-8 py-3 rounded-xl transition-all border border-zinc-700"
                  >
                    <FiClock size={20} />
                    View Schedule
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 mt-32 sm:mt-28 md:mt-28">
          <div className="flex justify-center items-center gap-4 mb-6">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-white"
            >
              Competition Categories
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-sm md:text-xl mb-6"
          >
            Choose a category to explore competitions
          </motion.p>
          <div className="flex flex-wrap justify-center gap-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => router.push("/profile/competitions")}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-600/50"
            >
              <FiCalendar size={20} />
              My Competitions
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => router.push("/schedule")}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-zinc-800/50 border border-zinc-700"
            >
              <FiClock size={20} />
              View Schedule
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              onClick={handleScheduleDownload}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-zinc-700"
            >
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Schedule
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
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
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-zinc-400 text-sm mt-2 text-center">
              Found {filteredCategories.length}{" "}
              {filteredCategories.length === 1 ? "category" : "categories"}
            </p>
          )}
        </motion.div>

        {filteredCategories.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-xl">
              {searchQuery
                ? `No categories found matching "${searchQuery}"`
                : "No categories available at the moment."}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{
                  y: -10,
                  rotateY: 5,
                  rotateX: 5,
                  scale: 1.05,
                  transition: { duration: 0.3 },
                }}
                onClick={() =>
                  router.push(`/competitions/${category.slug}`)
                }
                className="cursor-pointer perspective-1000"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative h-60 md:h-80 rounded-2xl overflow-hidden bg-black border border-zinc-800 hover:border-red-600/50 transition-all duration-300 shadow-2xl hover:shadow-red-600/20">
                  <div className="absolute inset-0 bg-black">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 hover:scale-110"
                      priority={index < 6}
                      quality={70}
                      unoptimized
                      loading={index < 6 ? "eager" : "lazy"}
                      onLoad={index < 6 ? handleImageLoad : undefined}
                      placeholder="blur"
                      blurDataURL={blurDataURL}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />
                  </div>

                  <div className="relative h-full flex flex-col justify-end p-4 md:p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 capitalize">
                        {category.name}
                      </h2>
                      <div className="flex items-center gap-2 text-red-500">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-base md:text-lg font-medium">
                          {category.count}{" "}
                          {category.count === 1 ? "Competition" : "Competitions"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                        <span>Explore</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  </div>

                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </motion.div>
    </>
  );
}
