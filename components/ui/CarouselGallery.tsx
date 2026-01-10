"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiCalendar, FiFilter } from "react-icons/fi";
import styles from "./CarouselGallery.module.css";

interface CarouselItem {
  image: string;
  year: string;
}

interface CarouselGalleryProps {
  items: CarouselItem[];
  defaultYear?: string;
}

const CarouselGallery = ({ items, defaultYear }: CarouselGalleryProps) => {
  // Extract unique years and sort them (newest first)
  const years = useMemo(
    () => Array.from(new Set(items.map((item) => item.year))).sort((a, b) => b.localeCompare(a)),
    [items]
  );

  // Initialize selected year (use defaultYear or the most recent year)
  const initialYear = defaultYear || years[0] || "";
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);

  // Filter items by selected year
  const filteredItems = useMemo(
    () => items.filter((item) => item.year === selectedYear),
    [items, selectedYear]
  );

  // Current items displayed in carousel (initialized with filtered items)
  const [currentItems, setCurrentItems] = useState<CarouselItem[]>(() =>
    items.filter((item) => item.year === initialYear)
  );

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Active preview index (index 2 always shows the current displayed image)
  const activePreviewIndex = 2;

  // Update current items when year filter changes
  useEffect(() => {
    if (filteredItems.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentItems(filteredItems);
        setIsTransitioning(false);
      }, 250);
    } else {
      setCurrentItems([]);
    }
  }, [filteredItems]);

  // Navigate to next image
  const handleNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentItems((prev) => {
      const newItems = [...prev];
      const firstItem = newItems.shift();
      if (firstItem) newItems.push(firstItem);
      setTimeout(() => setIsTransitioning(false), 300);
      return newItems;
    });
  }, [isTransitioning]);

  // Navigate to previous image
  const handlePrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentItems((prev) => {
      const newItems = [...prev];
      const lastItem = newItems.pop();
      if (lastItem) newItems.unshift(lastItem);
      setTimeout(() => setIsTransitioning(false), 300);
      return newItems;
    });
  }, [isTransitioning]);

  // Handle year filter change
  const handleYearChange = useCallback((year: string) => {
    if (selectedYear !== year) {
      setSelectedYear(year);
    }
    setIsFilterOpen(false);
  }, [selectedYear]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isFilterOpen &&
        !target.closest(".filter-container") &&
        !target.closest(".year-pills-container")
      ) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isFilterOpen]);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNext, handlePrev]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10 py-20 px-4 md:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto mb-12"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-red-500 to-white bg-clip-text text-transparent leading-tight"
              >
                Gallery
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-zinc-400 text-lg md:text-xl max-w-2xl"
              >
                Explore memories from previous years of Surabhi Cultural Fest
              </motion.p>
            </div>

            {/* Year Filter Dropdown */}
            <div className="relative filter-container">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-3 px-6 py-3.5 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/50 rounded-xl transition-all backdrop-blur-md shadow-lg hover:shadow-xl hover:border-red-600/50"
              >
                <FiFilter className="text-red-500" size={20} />
                <span className="font-semibold">{selectedYear}</span>
                <motion.svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  animate={{ rotate: isFilterOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </motion.button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-xl overflow-hidden shadow-2xl z-50"
                  >
                    {years.map((year, idx) => (
                      <motion.button
                        key={year}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                        onClick={() => handleYearChange(year)}
                        className={`w-full px-6 py-3.5 text-left transition-colors flex items-center gap-3 border-t border-zinc-800/50 ${selectedYear === year
                          ? "bg-red-600/20 text-red-500 font-semibold"
                          : "text-white hover:bg-white/5"
                          }`}
                      >
                        <FiCalendar size={16} />
                        {year}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Year Pills - Quick filter buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-3 year-pills-container"
          >
            {years.map((year, idx) => (
              <motion.button
                key={year}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleYearChange(year);
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all backdrop-blur-sm flex items-center gap-2 ${selectedYear === year
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/50"
                  : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800/50"
                  }`}
              >
                <FiCalendar size={14} />
                {year}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Carousel Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative max-w-7xl mx-auto mt-12"
        >
          <AnimatePresence mode="wait">
            {currentItems.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-32"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900/50 border border-zinc-800 mb-6">
                  <FiCalendar size={32} className="text-zinc-500" />
                </div>
                <p className="text-zinc-500 text-xl font-medium">No images found for this year.</p>
              </motion.div>
            ) : (
              <motion.div
                key={`carousel-${selectedYear}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className={styles.carouselContainer}
              >
                <div className={styles.carouselSlide}>
                  <AnimatePresence mode="popLayout">
                    {currentItems.slice(0, 6).map((item, index) => {
                      // Carousel item structure:
                      // - Index 0, 1: Full screen display (index 1 is the active/visible one)
                      // - Index 2: Preview showing current displayed image (highlighted with orange border)
                      // - Index 3: Preview showing next image in queue
                      // - Index 4: Preview showing next+1 image in queue
                      let displayItem = item;
                      if (index === 2 && currentItems[1]) {
                        displayItem = currentItems[1]; // Show current displayed image
                      } else if (index === 3 && currentItems[2]) {
                        displayItem = currentItems[2]; // Show next image
                      } else if (index === 4 && currentItems[3]) {
                        displayItem = currentItems[3]; // Show next+1 image
                      }

                      return (
                        <motion.div
                          key={`${displayItem.year}-${selectedYear}-${index}`}
                          initial={{ opacity: 0, scale: 0.9, x: index > 1 ? 50 : 0 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: index > 1 ? -50 : 0 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.05,
                            ease: [0.4, 0, 0.2, 1],
                          }}
                          whileHover={index === 1 ? { scale: 1.02 } : index >= 2 ? { scale: 1.05, y: -5 } : {}}
                          className={`${styles.carouselItem} ${index >= 2 ? styles.previewItem : ""} ${index === activePreviewIndex ? styles.activePreview : ""
                            }`}
                          style={{ backgroundImage: `url(${displayItem.image})` }}
                          onClick={index >= 2 ? () => {
                            // Handle preview item clicks
                            if (index === 3) {
                              handleNext(); // Navigate to next image
                            } else if (index === 4) {
                              handleNext(); // Navigate twice to skip to next+1
                              setTimeout(() => handleNext(), 350);
                            }
                          } : undefined}
                        >
                          {/* Content overlay for active display (index 1) */}

                          {/* Preview overlay for preview items (index 2+) */}
                          {index >= 2 && (
                            <motion.div
                              className={styles.previewOverlay}
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className={styles.previewTitle}></div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className={styles.carouselButtonContainer}>
                  <motion.button
                    onClick={handlePrev}
                    disabled={isTransitioning || currentItems.length <= 1}
                    aria-label="Previous slide"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={styles.navButton}
                  >
                    <FiChevronLeft size={20} />
                  </motion.button>
                  <motion.button
                    onClick={handleNext}
                    disabled={isTransitioning || currentItems.length <= 1}
                    aria-label="Next slide"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={styles.navButton}
                  >
                    <FiChevronRight size={20} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default CarouselGallery;
