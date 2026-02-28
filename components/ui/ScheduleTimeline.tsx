"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiExternalLink } from "react-icons/fi";

import ScheduleFlowLine from "./ScheduleFlowLine";

// Use reduced motion for better scroll performance on mobile
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px)");
    setReduced(mq.matches || mobile.matches);
    const handler = () => setReduced(mq.matches || mobile.matches);
    mq.addEventListener("change", handler);
    mobile.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
      mobile.removeEventListener("change", handler);
    };
  }, []);
  return reduced;
};

type ApiCategory = { name: string; slug: string; events: { name: string; slug: string }[] };

function findCategorySlug(scheduleName: string, apiCategories: ApiCategory[]): string | null {
  const s = scheduleName.toLowerCase();
  const sNorm = s.replace(/[^a-z0-9]/g, "");
  for (const c of apiCategories) {
    const cNorm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sNorm === cNorm) return c.slug;
    if (sNorm.includes(cNorm) || cNorm.includes(sNorm)) return c.slug;
    if (s.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(s.split("-")[0]?.trim() || "")) return c.slug;
  }
  const keywords = ["chitrakala", "sahitya", "cine", "parliament", "mock", "natayaka", "raaga", "nrithya", "vastranaut", "kurukshetra"];
  const found = keywords.find((k) => sNorm.includes(k));
  if (found) {
    const match = apiCategories.find((c) => c.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(found));
    if (match) return match.slug;
  }
  return null;
}

function findEventSlug(
  scheduleEventName: string,
  categoryName: string,
  apiCategories: ApiCategory[]
): { categorySlug: string; eventSlug: string } | null {
  const categorySlug = findCategorySlug(categoryName, apiCategories);
  if (!categorySlug) return null;
  const cat = apiCategories.find((c) => c.slug === categorySlug);
  if (!cat?.events?.length) return null;
  const s = scheduleEventName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const e of cat.events) {
    const eNorm = e.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (s === eNorm || s.includes(eNorm) || eNorm.includes(s)) {
      return { categorySlug: cat.slug, eventSlug: e.slug };
    }
  }
  return null;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "CHITRAKALA - Painting": "/poster-gallery/CHITRAKALA.jpg",
  "SAHITYA - Literature": "/poster-gallery/SAHITYA.jpg",
  "CINE CARNIVAL - Short Films": "/poster-gallery/CINE CARNIVAL.png",
  "National Parliamentary Simulation": "/poster-gallery/MOCK PARLIAMENT.jpg",
  "NATYAKA - Dramatics": "/poster-gallery/NATYAKA.png",
  "RAAGA - Music": "/poster-gallery/RAAGA.png",
  "NRITHYA - Dance": "/poster-gallery/NRITHYA.png",
  "VASTRANAUT - Fashion": "/poster-gallery/VASTRANAUT.png",
  "KURUKSHETRA - eSports": "/poster-gallery/KURUKSHETRA.png",
};

const SCHEDULE_DATA = [
  {
    date: "March 2, 2026",
    categories: [
      { name: "CHITRAKALA - Painting", events: ["LandScape", "Bhavishya Bharat"] },
      { name: "SAHITYA - Literature", events: ["Elocution", "Short Story Writing"] },
    ],
  },
  {
    date: "March 3, 2026",
    categories: [
      { name: "CINE CARNIVAL - Short Films", events: ["Short Film", "Photography", "Cover songs"] },
      { name: "NATYAKA - Dramatics", events: ["Skit", "Mono Action"] },
    ],
  },
  {
    date: "March 4, 2026",
    categories: [
      { name: "RAAGA - Music", events: ["Solo Instrumental", "Voice of Raaga", "Battle of bands"] },
    ],
  },
  {
    date: "March 5, 2026",
    categories: [
      { name: "National Parliamentary Simulation", events: ["National Mock Parliament"] },
      { name: "NRITHYA - Dance", events: ["Group (Classical, Western, Folk)", "Solo (Classical, Western, Folk)"] },
    ],
  },
  {
    date: "March 6, 2026",
    categories: [
      { name: "VASTRANAUT - Fashion", events: ["VASTRANAUT FASHION RUNAWAY"] },
    ],
  },
  {
    date: "March 7, 2026",
    categories: [
      { name: "KURUKSHETRA - eSports", events: ["Free Fire", "Tekken 8"] },
    ],
  },
];

function ScheduleTimeline() {
  const containerRef = useRef<HTMLElement>(null);
  const [categorySlugMap, setCategorySlugMap] = useState<Record<string, string>>({});
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: { categories?: ApiCategory[] }) => {
        const cats = data.categories || [];
        setApiCategories(cats);
        const map: Record<string, string> = {};
        SCHEDULE_DATA.forEach((day) =>
          day.categories.forEach((c) => {
            const slug = findCategorySlug(c.name, cats);
            if (slug) map[c.name] = slug;
          })
        );
        setCategorySlugMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen py-16 md:py-32 overflow-hidden schedule-section-dark bg-[#030303] [contain:layout_paint]"
      style={{ backgroundColor: "#030303" }}
      aria-labelledby="schedule-heading"
    >
      {/* Premium dark gradient - minimal overlays for performance */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#0a0a0a] to-[#030303] pointer-events-none" style={{ backgroundColor: "#030303" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(220,38,38,0.05)_0%,transparent_50%)] pointer-events-none md:block hidden" />
      <div className="absolute inset-0 schedule-noise-desktop pointer-events-none hidden md:block" />

      {/* S-curve flow line - clean, professional SVG (no particle balls) */}
      <ScheduleFlowLine containerRef={containerRef} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          className="text-center mb-10 md:mb-20"
        >
          <h2
            id="schedule-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-white via-red-50 to-red-100 bg-clip-text text-transparent font-[family-name:var(--font-Lexend)] tracking-tight drop-shadow-[0_0_40px_rgba(220,38,38,0.15)]"
          >
            Competitions Schedule
          </h2>
          <div className="flex items-center justify-center gap-4 text-red-400/70 font-[family-name:var(--font-Martian_Mono)] text-xs md:text-sm tracking-[0.2em] uppercase">
            <span className="w-12 md:w-16 h-[1px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent" />
            March 2–7, 2026
            <span className="w-12 md:w-16 h-[1px] bg-gradient-to-r from-transparent via-red-600/80 to-transparent" />
          </div>
        </motion.div>

        {/* S-shaped alternating layout - river flow */}
        <div className="space-y-8 md:space-y-20">
          {SCHEDULE_DATA.map((day, dayIndex) => {
            const isLeft = dayIndex % 2 === 0;
            const dayClassName = `flex flex-col md:flex-row items-stretch gap-4 md:gap-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`;
            return reducedMotion ? (
              <div key={day.date} className={dayClassName}>
                {/* Date node */}
                <div className="flex-shrink-0 md:w-48 flex flex-col items-center justify-start gap-3 [content-visibility:auto]">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border border-zinc-600/80 bg-zinc-800/60 md:backdrop-blur-sm">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-red-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="w-px h-6 md:h-8 bg-gradient-to-b from-zinc-600 to-transparent mt-1" aria-hidden />
                  </div>
                  <span className="text-zinc-300 font-medium text-xs md:text-sm font-[family-name:var(--font-Martian_Mono)] uppercase tracking-wider text-center">
                    {day.date}
                  </span>
                </div>

                {/* Content card */}
                <div className="flex-1 min-w-0 [content-visibility:auto]">
                  <div className="rounded-2xl schedule-card-glass border border-zinc-800/90 overflow-hidden md:backdrop-blur-sm relative group">
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                      {day.categories.map((category) => (
                        <div key={category.name} className="flex gap-4 items-start">
                          {/* Each category gets its own image */}
                          {CATEGORY_IMAGES[category.name] && (
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-zinc-700/80">
                              <Image
                                src={CATEGORY_IMAGES[category.name]}
                                alt={category.name}
                                fill
                                className="object-cover object-center"
                                sizes="96px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-3">
                              <h4 className="text-base sm:text-lg font-semibold text-zinc-100 font-[family-name:var(--font-Lexend)] flex items-center gap-2 min-w-0">
                                <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full shrink-0" />
                                {category.name}
                              </h4>
                              {categorySlugMap[category.name] && (
                                <Link
                                  href={`/competitions/${categorySlugMap[category.name]}`}
                                  className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 whitespace-nowrap justify-self-end shrink-0"
                                >
                                  View category
                                  <FiExternalLink className="w-3 h-3 shrink-0" />
                                </Link>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {category.events.map((event, eventIndex) => {
                                const eventMatch = findEventSlug(event, category.name, apiCategories);
                                const href = eventMatch
                                  ? `/competitions/${eventMatch.categorySlug}/${eventMatch.eventSlug}`
                                  : categorySlugMap[category.name]
                                    ? `/competitions/${categorySlugMap[category.name]}`
                                    : "/competitions";
                                return (
                                  <div key={event}>
                                    <Link
                                      href={href}
                                      className="group/btn inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 text-zinc-200 text-sm font-medium border border-zinc-600/60 hover:border-red-500 hover:bg-zinc-800 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-600/20"
                                    >
                                      {event}
                                      <FiExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100 transition-opacity shrink-0" />
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spacer for S-shape alignment */}
                <div className="hidden md:block flex-shrink-0 md:w-48" />
              </div>
            ) : (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px", amount: 0.2 }}
                transition={{ duration: 0.5 }}
                className={dayClassName}
              >
                {/* Date node */}
                <div className="flex-shrink-0 md:w-48 flex flex-col items-center justify-start gap-3 [content-visibility:auto]">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border border-zinc-600/80 bg-zinc-800/60 md:backdrop-blur-sm">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-red-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="w-px h-6 md:h-8 bg-gradient-to-b from-zinc-600 to-transparent mt-1" aria-hidden />
                  </div>
                  <span className="text-zinc-300 font-medium text-xs md:text-sm font-[family-name:var(--font-Martian_Mono)] uppercase tracking-wider text-center">
                    {day.date}
                  </span>
                </div>

                {/* Content card */}
                <div className="flex-1 min-w-0 [content-visibility:auto]">
                  <div className="rounded-2xl schedule-card-glass border border-zinc-800/90 overflow-hidden md:backdrop-blur-sm relative group">
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                      {day.categories.map((category) => (
                        <div key={category.name} className="flex gap-4 items-start">
                          {CATEGORY_IMAGES[category.name] && (
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-zinc-700/80">
                              <Image
                                src={CATEGORY_IMAGES[category.name]}
                                alt={category.name}
                                fill
                                className="object-cover object-center"
                                sizes="96px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-[1fr_auto] items-center gap-3 mb-3">
                              <h4 className="text-base sm:text-lg font-semibold text-zinc-100 font-[family-name:var(--font-Lexend)] flex items-center gap-2 min-w-0">
                                <span className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full shrink-0" />
                                {category.name}
                              </h4>
                              {categorySlugMap[category.name] && (
                                <Link
                                  href={`/competitions/${categorySlugMap[category.name]}`}
                                  className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 whitespace-nowrap justify-self-end shrink-0"
                                >
                                  View category
                                  <FiExternalLink className="w-3 h-3 shrink-0" />
                                </Link>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {category.events.map((event) => {
                                  const eventMatch = findEventSlug(event, category.name, apiCategories);
                                  const href = eventMatch
                                    ? `/competitions/${eventMatch.categorySlug}/${eventMatch.eventSlug}`
                                    : categorySlugMap[category.name]
                                      ? `/competitions/${categorySlugMap[category.name]}`
                                      : "/competitions";
                                  return (
                                    <div key={event}>
                                      <Link
                                        href={href}
                                        className="group/btn inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 text-zinc-200 text-sm font-medium border border-zinc-600/60 hover:border-red-500 hover:bg-zinc-800 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-600/20"
                                      >
                                        {event}
                                        <FiExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100 transition-opacity shrink-0" />
                                      </Link>
                                    </div>
                                  );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="hidden md:block flex-shrink-0 md:w-48" />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: reducedMotion ? 0 : 0.4 }}
          className="text-center mt-10 md:mt-20"
        >
          <Link
            href="/competitions"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold border border-red-500/30 shadow-[0_4px_24px_-4px_rgba(220,38,38,0.4)] hover:shadow-[0_8px_32px_-4px_rgba(220,38,38,0.5)] hover:from-red-500 hover:to-red-600 transition-all duration-300"
          >
            View All Competitions
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default ScheduleTimeline;
