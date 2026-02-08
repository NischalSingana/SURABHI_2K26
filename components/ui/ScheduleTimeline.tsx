"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiExternalLink } from "react-icons/fi";

import ScheduleFlowLine from "./ScheduleFlowLine";

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
  "CHITRAKALA - Painting": "/poster-gallery/CHITRAKALA.png",
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
      { name: "National Parliamentary Simulation", events: ["National Mock Parliament"] },
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
      { name: "KURUKSHETRA - eSports", events: ["Free Fire", "BGMI Tournament", "Valorant"] },
    ],
  },
];

function ScheduleTimeline() {
  const containerRef = useRef<HTMLElement>(null);
  const [categorySlugMap, setCategorySlugMap] = useState<Record<string, string>>({});
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);

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
      className="relative w-full min-h-screen py-24 md:py-32 overflow-hidden schedule-section-dark bg-[#030303] [contain:layout_paint]"
      style={{ backgroundColor: "#030303" }}
      aria-labelledby="schedule-heading"
    >
      {/* Premium dark gradient - opaque, no transparency */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#0a0a0a] to-[#030303] pointer-events-none" style={{ backgroundColor: "#030303" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(220,38,38,0.06)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(139,0,0,0.03)_0%,transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_60%,rgba(0,0,0,0.25)_100%)] pointer-events-none" />
      <div className="absolute inset-0 schedule-noise pointer-events-none" />

      {/* S-curve flow line - clean, professional SVG (no particle balls) */}
      <ScheduleFlowLine containerRef={containerRef} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20 md:mb-28"
        >
          <h2
            id="schedule-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-red-50 to-red-100 bg-clip-text text-transparent font-[family-name:var(--font-Lexend)] tracking-tight drop-shadow-[0_0_40px_rgba(220,38,38,0.15)]"
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
        <div className="space-y-16 md:space-y-24">
          {SCHEDULE_DATA.map((day, dayIndex) => {
            const isLeft = dayIndex % 2 === 0;
            return (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: isLeft ? -80 : 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px", amount: 0.4 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`flex flex-col md:flex-row items-stretch gap-8 md:gap-12 ${
                  isLeft ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Date node - professional minimal marker */}
                <div className="flex-shrink-0 md:w-48 flex flex-col items-center justify-start gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border border-zinc-600/80 bg-zinc-800/60 backdrop-blur-sm">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-red-400/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="w-px h-6 md:h-8 bg-gradient-to-b from-zinc-600 to-transparent mt-1" aria-hidden />
                  </motion.div>
                  <span className="text-zinc-300 font-medium text-xs md:text-sm font-[family-name:var(--font-Martian_Mono)] uppercase tracking-wider text-center">
                    {day.date}
                  </span>
                </div>

                {/* Content card - flows from the side */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex-1 min-w-0"
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-2xl schedule-card-glass border border-zinc-800/90 overflow-hidden backdrop-blur-md relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                      {day.categories.map((category, catIndex) => (
                        <motion.div
                          key={category.name}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: 0.05 * catIndex }}
                          className="flex gap-4 items-start"
                        >
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
                                  <motion.div
                                    key={event}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: 0.08 * eventIndex }}
                                  >
                                    <Link
                                      href={href}
                                      className="group/btn inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/90 text-zinc-200 text-sm font-medium border border-zinc-600/60 hover:border-red-500 hover:bg-zinc-800 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-600/20"
                                    >
                                      {event}
                                      <FiExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100 transition-opacity shrink-0" />
                                    </Link>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Spacer for S-shape alignment */}
                <div className="hidden md:block flex-shrink-0 md:w-48" />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20 md:mt-28"
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
