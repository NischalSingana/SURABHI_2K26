"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight, FiFilter } from "react-icons/fi";
import { cn } from "@/lib/utils";
import Loader from "./Loader";

interface CarouselItem {
  image: string;
  year: string;
  name?: string;
  description?: string;
}

interface CarouselGalleryProps {
  items: CarouselItem[];
  defaultYear?: string;
}

const CarouselGallery = ({ items, defaultYear }: CarouselGalleryProps) => {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const minLoadTime = 1500; // Minimum 1.5 seconds loading
  const startTime = useRef(Date.now());

  // Extract unique years and sort them (newest first)
  const years = useMemo(
    () => Array.from(new Set(items.map((item) => item.year))).sort((a, b) => b.localeCompare(a)),
    [items]
  );

  const initialYear = defaultYear || years[0] || "";
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter items by selected year
  const filteredItems = useMemo(
    () => items.filter((item) => item.year === selectedYear),
    [items, selectedYear]
  );

  // Virtual Index State
  const [activeIndex, setActiveIndex] = useState(0);

  // Modal State
  const [modalImage, setModalImage] = useState<CarouselItem | null>(null);

  // Reset index when year changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedYear]);

  // Handle preloading with minimum time
  useEffect(() => {
    const totalImages = filteredItems.length;
    const visibleCount = Math.min(3, totalImages); // Only preload visible images
    
    if (imagesLoaded >= visibleCount) {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, remaining);
      
      return () => clearTimeout(timer);
    }
  }, [imagesLoaded, filteredItems.length]);

  const handleImageLoad = useCallback(() => {
    setImagesLoaded(prev => prev + 1);
  }, []);

  // Handle client-side mobile detection to prevent hydration errors
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % filteredItems.length);
  }, [filteredItems.length]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  }, [filteredItems.length]);



  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (modalImage) {
        if (e.key === "Escape") setModalImage(null);
        return;
      }
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNext, handlePrev, modalImage]);

  // Close filter on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isFilterOpen && !target.closest(".filter-container")) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);


  // Helper to determine item properties based on offset from active index
  const getItemProps = (index: number) => {
    const total = filteredItems.length;
    // Calculate shortest distance in circular array
    let offset = (index - activeIndex + total) % total;
    if (offset > total / 2) offset -= total;

    const isActive = offset === 0;
    const isNext = offset === 1;
    const isPrev = offset === -1;
    const isVisible = Math.abs(offset) <= 2;

    return { offset, isActive, isVisible };
  };

  // Modal Navigation
  const handleModalNext = useCallback(() => {
    if (!modalImage) return;
    const currentIndex = filteredItems.indexOf(modalImage);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    setModalImage(filteredItems[nextIndex]);
  }, [modalImage, filteredItems]);

  const handleModalPrev = useCallback(() => {
    if (!modalImage) return;
    const currentIndex = filteredItems.indexOf(modalImage);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setModalImage(filteredItems[prevIndex]);
  }, [modalImage, filteredItems]);

  // Swipe Handlers
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEndMain = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  const onTouchEndModal = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleModalNext();
    if (isRightSwipe) handleModalPrev();
  };

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] bg-neutral-950 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-neutral-400 text-sm"
              >
                Loading gallery...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full min-h-screen bg-neutral-950 text-white relative overflow-hidden flex flex-col items-center">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Animated Active Image Background */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`bg-${filteredItems[activeIndex]?.image}`}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 0.15, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className={cn(
              "absolute inset-0 bg-cover bg-center opacity-20",
              isMobile ? "blur-xl" : "blur-[100px]" // Reduce blur on mobile for performance
            )}
            style={{ backgroundImage: `url(${filteredItems[activeIndex]?.image})` }}
          />
        </AnimatePresence>

        {/* Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/50 to-neutral-950" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-4 md:px-4 pt-24 md:pt-24 pb-12 flex flex-col justify-start min-h-screen">

        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 sm:mb-8">
          <div className="space-y-2">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
              Gallery
            </h2>
            <p className="text-neutral-400 text-lg md:text-lg max-w-md">
              A visual journey through {selectedYear}
            </p>
          </div>

          {/* Year Filter - Desktop (Dropdown) */}
          <div className="relative filter-container z-50 hidden md:block">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-3 px-5 py-3 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-red-500/50 transition-all backdrop-blur-md group"
            >
              <FiFilter className="text-red-500 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-neutral-200">{selectedYear}</span>
              <FiChevronRight className={cn("transition-transform text-neutral-500", isFilterOpen && "rotate-90")} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-40 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-2"
                >
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between group",
                        selectedYear === year ? "bg-red-900/20 text-red-500" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      )}
                    >
                      {year}
                      {selectedYear === year && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year Filter - Mobile (Horizontal Scroll) */}
          <div className="flex md:hidden w-full overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 mask-fade-sides">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                  selectedYear === year
                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20"
                    : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Carousel Stage */}
        <div

          className="relative w-full h-[500px] md:h-[500px] flex items-center justify-center perspective-1000 mt-6 md:mt-0"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndMain}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const { offset, isActive, isVisible } = getItemProps(index);

              if (!isVisible) return null;

              return (
                <motion.div
                  key={`${item.year}-${index}`}
                  layoutId={undefined}
                  className={cn(
                    "absolute top-0 rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl transition-all duration-300",
                    isMobile ? "w-[75vw] aspect-[3/4] h-auto" : "w-[600px] md:aspect-[4/3] h-auto",
                    isActive ? "z-20 border-red-500/30 cursor-zoom-in" : "z-10 grayscale-[50%] hover:grayscale-0 cursor-pointer"
                  )}
                  initial={false}
                  animate={{
                    x: offset * (isMobile ? 55 : 120) + '%',
                    scale: isActive ? 1 : 0.7,
                    opacity: isActive ? 1 : 0.4,
                    zIndex: isActive ? 20 : 10 - Math.abs(offset),
                    rotateY: offset * -25,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.5
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                  }}
                  onClick={() => {
                    if (isActive) {
                      setModalImage(item);
                    } else {
                      const total = filteredItems.length;
                      let diff = offset;
                      setActiveIndex((prev) => (prev + diff + total) % total);
                    }
                  }}
                >
                  {/* Clean Image Tag for better Border Clip */}
                  <div className="absolute inset-0 w-full h-full bg-zinc-900">
                    <Image
                      src={item.image}
                      alt={item.name || "Gallery Image"}
                      fill
                      className="object-cover rounded-3xl"
                      sizes="(max-width: 768px) 75vw, 600px"
                      priority={index < 3} // Preload first 3 images
                      quality={75} // Reduced quality for faster loading
                      loading={index < 3 ? "eager" : "lazy"}
                      onLoad={index < 3 ? handleImageLoad : undefined}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzI3MjcyNyIvPjwvc3ZnPg=="
                    />
                  </div>

                  {/* Overlay Gradient */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 pointer-events-none rounded-3xl",
                    isActive ? "opacity-100" : "opacity-0"
                  )} />



                  {/* Content (Only Visible on Active) */}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full pl-8 pr-4 py-4 md:p-8 transform transition-all duration-500 delay-100 pointer-events-none",
                    isActive ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                  )}>
                    {item.name && (
                      <motion.h3
                        className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 leading-tight"
                        layout
                      >
                        {item.name}
                      </motion.h3>
                    )}
                    {item.description && (
                      <motion.p
                        className="text-sm md:text-base text-neutral-300 line-clamp-2"
                        layout
                      >
                        {item.description}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Carousel Controls */}
        <div className="relative z-50 flex justify-center gap-6 -mt-16 md:mt-8">
          <button
            onClick={handlePrev}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-red-500/30 transition-all active:scale-95"
          >
            <FiChevronLeft size={24} />
          </button>

          {/* Pagination Indicators */}
          <div className="flex items-center gap-2">
            {filteredItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === activeIndex ? "w-8 bg-red-600" : "w-1.5 bg-neutral-800 hover:bg-neutral-700"
                )}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-red-500/30 transition-all active:scale-95"
          >
            <FiChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
            onClick={() => setModalImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setModalImage(null)}
              className="fixed top-24 right-6 md:top-28 md:right-12 z-[200] p-3 rounded-full bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/50 hover:border-red-500/50 backdrop-blur-xl transition-all duration-300 shadow-lg group hover:scale-105"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100 transition-opacity">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full h-full flex flex-col items-center justify-center pt-10 md:pt-12"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEndModal}
            >
              <img
                src={modalImage.image}
                alt={modalImage.name}
                className="h-[70vh] md:h-[80vh] w-auto max-w-[95vw] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none">
                {modalImage.name && (
                  <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg inline-block px-6 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                    {modalImage.name}
                  </h3>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </>
  );
};

export default CarouselGallery;
