"use client";


import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";

import dynamic from 'next/dynamic';
const CircularGallery = dynamic(() => import("@/components/ui/CircularGallery"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center text-gray-500">Loading gallery...</div>
});
import { CircularGalleryHandle } from "@/components/ui/CircularGallery";
import { useEffect, useState, useRef, type SyntheticEvent } from "react";
import Footer from '@/components/ui/Footer';

const ScheduleTimeline = dynamic(() => import('@/components/ui/ScheduleTimeline'), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center text-zinc-500 bg-[#030303]">Loading schedule...</div>,
});
import CountUp from '@/components/ui/CountUp';
import { FiAward, FiUsers, FiFeather, FiVolume2, FiVolumeX } from "react-icons/fi";

// Hero video: CDN first; Chrome often needs direct Spaces URL (Range/206), Safari works with CDN
const HERO_VIDEO_CDN = "https://surabhi-images.sgp1.cdn.digitaloceanspaces.com/SURABHI2k26.mp4";
const HERO_VIDEO_DIRECT = "https://surabhi-images.sgp1.digitaloceanspaces.com/SURABHI2k26.mp4";

// Particles for fiery background (stable positions for SSR/hydration)
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
    x: `${(i * 4.5) % 100}%`,
    duration: 4 + (i % 5),
    delay: (i * 0.3) % 3,
}));

const HomePage = () => {
    const [posterItems, setPosterItems] = useState<{ image: string; text: string }[]>([]);
    const [loadingPosters, setLoadingPosters] = useState(true);
    const posterSectionRef = useRef<HTMLElement>(null);
    const galleryRef = useRef<CircularGalleryHandle>(null);

    const [videoSrc, setVideoSrc] = useState(HERO_VIDEO_CDN);
    const [usedFallback, setUsedFallback] = useState(false);
    const videoFrameRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    // Sound button state — reflects the ACTUAL muted state of the video.
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    // Whether the user has explicitly toggled mute (prevents auto-unmute from overriding)
    const userToggledRef = useRef(false);
    // Whether auto-unmute listeners are registered (avoid duplicates)
    const autoUnmuteRegisteredRef = useRef(false);
    // Show a hint to the user when browser forces muted playback
    const [showSoundHint, setShowSoundHint] = useState(false);
    // Guard: true while we're doing the initial play attempt (prevents onPause from interfering)
    const initialPlayRef = useRef(false);

    // Register one-time listeners to auto-unmute on first real user interaction
    const registerAutoUnmute = () => {
        if (autoUnmuteRegisteredRef.current) return;
        autoUnmuteRegisteredRef.current = true;

        const autoUnmute = () => {
            const v = videoRef.current;
            if (v && !userToggledRef.current) {
                v.muted = false;
                setIsMuted(false);
                setShowSoundHint(false);
            }
            cleanup();
        };
        const cleanup = () => {
            autoUnmuteRegisteredRef.current = false;
            document.removeEventListener("click", autoUnmute, true);
            document.removeEventListener("touchstart", autoUnmute, true);
        };
        document.addEventListener("click", autoUnmute, true);
        document.addEventListener("touchstart", autoUnmute, true);
    };

    // Drive ALL playback from this effect — no autoPlay attribute on the video element.
    // This gives us full control: try unmuted first, fall back to muted only if browser blocks.
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (userToggledRef.current) return;

        initialPlayRef.current = true;

        void (async () => {
            try {
                // 1) Try unmuted play — works if Chrome's Media Engagement Index allows it
                v.muted = false;
                await v.play();
                setIsMuted(false);
                setIsVideoReady(true);
                setShowSoundHint(false);
            } catch {
                // 2) Browser blocked unmuted play — fall back to muted
                try {
                    v.muted = true;
                    await v.play();
                    setIsMuted(true);
                    setIsVideoReady(true);
                    setShowSoundHint(true);
                    registerAutoUnmute();
                } catch {
                    // Even muted play failed (very rare) — wait for canplay
                    console.error("Both unmuted and muted autoplay failed");
                }
            }
            initialPlayRef.current = false;
        })();
    }, [videoSrc]);

    const handleCanPlay = () => {
        setIsVideoReady(true);
        // If the video isn't playing yet (e.g. slow load), kick off playback
        const v = videoRef.current;
        if (v && v.paused && !initialPlayRef.current) {
            v.play().catch(() => {});
        }
    };

    const handleVideoError = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
        const v = e.currentTarget;
        const err = v.error;
        if (err) {
            console.error("Hero video failed:", err.code, err.message, videoSrc);
        }
        // Chrome often fails with CDN (Range/206); try direct Spaces URL once
        if (!usedFallback && videoSrc === HERO_VIDEO_CDN) {
            setUsedFallback(true);
            setVideoSrc(HERO_VIDEO_DIRECT);
        }
    };

    const handleToggleMute = () => {
        userToggledRef.current = true;
        const video = videoRef.current;
        if (video) {
            const next = !video.muted;
            video.muted = next;
            setIsMuted(next);
            setShowSoundHint(false);
        }
    };

    useEffect(() => {
        // If the tab becomes visible again, ensure the hero resumes playback.
        const onVis = () => {
            if (document.visibilityState === "visible") {
                const v = videoRef.current;
                if (v && v.paused) {
                    v.play().catch(() => {});
                }
            }
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);
    useEffect(() => {
        // When the source changes (e.g., fallback), reset ready state.
        // The main playback useEffect will re-run because videoSrc is in its deps.
        setIsVideoReady(false);
    }, [videoSrc]);

    useEffect(() => {
        // Fetch poster gallery items from API
        const fetchPosters = async () => {
            try {
                const response = await fetch('/api/poster-gallery');
                if (!response.ok) {
                    console.error('API response not OK:', response.status, response.statusText);
                    return;
                }
                const data = await response.json();
                if (data.error) {
                    console.error('API returned error:', data.error, data.details);
                }

                if (data.items && data.items.length > 0) {
                    setPosterItems(data.items);
                }
            } catch (error) {
                console.error('Error fetching posters:', error);
            } finally {
                setLoadingPosters(false);
            }
        };

        fetchPosters();
    }, []);

    const { scrollYProgress } = useScroll({
        target: posterSectionRef,
        offset: ["start end", "end start"],
    });
    // Slower poster scroll: map full section scroll to ~55% of carousel so movement feels gentler
    const posterProgress = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 0, 0.55, 0.55]);
    const rafRef = useRef<number | null>(null);
    const pendingRef = useRef<number | null>(null);
    // Only drive poster from scroll when the poster section is in view; stops poster moving when touching/scrolling elsewhere (e.g. footer)
    useMotionValueEvent(scrollYProgress, "change", (v) => {
        if (v > 0.95) return; // below section: don't update so touching footer etc. doesn't move poster
        const progress = v < 0.05 ? 0 : (v - 0.05) / 0.9 * 0.55;
        pendingRef.current = progress;
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const val = pendingRef.current;
            if (val !== null) {
                pendingRef.current = null;
                galleryRef.current?.setProgress(val);
            }
        });
    });
    useEffect(() => {
        if (!loadingPosters && posterItems.length > 0) {
            const raf = requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    galleryRef.current?.setProgress(posterProgress.get());
                });
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [loadingPosters, posterItems.length, posterProgress]);

    return (
        <main className="relative w-full bg-[#030303]">
            <h1 className="sr-only">Surabhi International Cultural Fest 2026 - KL University</h1>
            {/* Fiery Red Background - Edge to Edge, no white bleed */}
            <div className="fixed inset-0 z-0 bg-black md:bg-gradient-to-br md:from-[#0a0303] md:via-[#1a0505] md:to-[#0a0303]">
                {/* CSS animated gradient overlay - Optimized for performance */}
                <div
                    className="absolute inset-0 animate-gradient-slow opacity-30 hidden md:block"
                    style={{
                        background: "radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.4), transparent 70%), radial-gradient(circle at 0% 100%, rgba(185, 28, 28, 0.3), transparent 50%)"
                    }}
                />
                {/* Fire-like particles effect - Optimized with CSS */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                    {PARTICLES.map((particle, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-red-600 rounded-full animate-float"
                            style={{
                                left: particle.x,
                                animationDuration: `${particle.duration}s`,
                                animationDelay: `${particle.delay}s`,
                                bottom: "-10px",
                            }}
                        />
                    ))}
                </div>
            </div>
            <section
                ref={videoFrameRef}
                id="video-frame"
                className={[
                    // Mobile: video fills from the very top — no gap, compact height
                    "relative z-10 w-full overflow-hidden bg-black pt-0",
                    "h-[55vh] sm:h-[65vh]",
                    // Desktop: keep current perfect fixed hero behavior
                    "md:pt-0 md:fixed md:inset-0 md:h-full",
                ].join(" ")}
                aria-label="Surabhi 2K26 hero video"
            >
                <h2 className="sr-only">Surabhi 2K26 - International Cultural Fest</h2>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="absolute inset-0 w-full h-full"
                >

                    <video
                        key={videoSrc}
                        ref={videoRef}
                        loop
                        playsInline
                        preload="auto"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                        onCanPlay={handleCanPlay}
                        onCanPlayThrough={handleCanPlay}
                        onPause={() => {
                            const v = videoRef.current;
                            if (!v || v.ended || initialPlayRef.current) return;
                            if (document.visibilityState !== "visible") return;
                            // Only auto-resume if the video element is still in viewport
                            // Use a longer delay to avoid fighting with browser media controls
                            window.setTimeout(() => {
                                if (v.paused && document.visibilityState === "visible" && !v.ended) {
                                    v.play().catch(() => {});
                                }
                            }, 500);
                        }}
                        onError={handleVideoError}
                        className={[
                            // Mobile: full video visible (object-contain), black bars fill gaps
                            // Desktop: video fills entire viewport (object-cover)
                            "absolute left-0 top-0 w-full h-full min-w-full min-h-full object-contain md:object-cover object-center",
                            "transition-opacity duration-300",
                            isVideoReady ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                    >
                        <source src={videoSrc} type="video/mp4" />
                    </video>

                    {/* Loading backdrop */}
                    {!isVideoReady && (
                        <div className="absolute inset-0 bg-black md:bg-gradient-to-b md:from-black md:via-[#120404] md:to-black" />
                    )}

                    <button
                        type="button"
                        onClick={handleToggleMute}
                        className="absolute top-[4.5rem] left-4 md:top-[5.5rem] z-50 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors backdrop-blur-sm border border-white/10 shadow-lg"
                    >
                        {isMuted ? <FiVolumeX size={22} /> : <FiVolume2 size={22} />}
                    </button>

                    {showSoundHint && (
                        <div className="absolute top-[6.5rem] left-4 md:top-[8.5rem] z-50 animate-pulse">
                            <span className="text-xs text-white/80 bg-black/70 px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                🔊 Tap anywhere for sound
                            </span>
                        </div>
                    )}

                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 md:pb-10 px-4 z-40 pointer-events-none">
                        <h1
                            className="font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight drop-shadow-lg text-center font-[family-name:var(--font-Lexend)] bg-gradient-to-r from-white via-red-200 to-white bg-clip-text text-transparent [filter:drop-shadow(0_2px_20px_rgba(0,0,0,0.8))]"
                        >
                            SURABHI<span className="font-light">-</span>2K26
                        </h1>
                        <p className="text-xs sm:text-base md:text-lg mt-1 md:mt-2 tracking-[0.2em] md:tracking-[0.4em] uppercase font-medium font-[family-name:var(--font-Martian_Mono)] bg-gradient-to-r from-white/60 via-white to-white/60 bg-clip-text text-transparent [filter:drop-shadow(0_2px_12px_rgba(0,0,0,0.8))]">
                            — INTERNATIONAL CULTURAL FEST —
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Only needed for desktop fixed hero; mobile hero is in-flow */}
            <div className="relative z-0 hidden md:block h-screen w-full flex-shrink-0" aria-hidden="true" />

            {/* About Surabhi Section - Bento Grid Redesign */}
            <section className="relative z-10 w-full min-h-screen bg-[#0a0000] flex items-start md:items-center justify-center px-4 sm:px-6 lg:px-8 pt-10 pb-8 sm:py-16 md:py-20 lg:py-24 overflow-visible">
                {/* Background Noise/Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 via-black to-black pointer-events-none" />

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-10 md:mb-16"
                    >
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent font-[family-name:var(--font-Lexend)] tracking-tight">
                            About Surabhi
                        </h2>
                        <div className="flex items-center justify-center gap-4 text-red-500/60 font-[family-name:var(--font-Martian_Mono)] text-xs md:text-sm tracking-widest uppercase">
                            <span className="w-8 md:w-12 h-[1px] bg-red-800" />
                            International Cultural Fest
                            <span className="w-8 md:w-12 h-[1px] bg-red-800" />
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 sm:gap-4 h-full md:h-[600px]">
                        {/* Main Narrative Card - Spans 2x2 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-5 md:p-6 flex flex-col justify-between hover:border-red-500/30 transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />

                            <div className="relative z-10 space-y-2 md:space-y-4">
                                <h3 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-Lexend)]">
                                    A Legacy of Artistic Excellence
                                </h3>
                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-[family-name:var(--font-Lexend)]">
                                    Surabhi is the flagship cultural festival of <span className="text-red-400 font-medium">KL University</span>, organized by the Student Activity Centre (SAC), serving as a vibrant platform for artistic expression and cultural diversity. Celebrated annually, the fest brings together talented students from across the country, transforming the campus into a lively space where tradition and modern creativity blend seamlessly through dance, music, theatre, fine arts, and literary events.
                                </p>
                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-[family-name:var(--font-Lexend)]">
                                    Driven by a strong student-led spirit, Surabhi is planned, organized, and executed by dedicated student teams under SAC, fostering leadership, teamwork, and innovation. This commitment to excellence has earned the fest recognition, including a place in the <a href="https://indianbookofrecords.com/kl-university-indian-world-record-holder" target="_blank" rel="noopener noreferrer" className="text-white border-b border-red-500/50 hover:text-red-400 hover:border-red-400 transition-colors">Indian Book of Records</a>.
                                </p>
                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-[family-name:var(--font-Lexend)]">
                                    Across two power packed days, Surabhi unites thousands to celebrate art, culture, and passion. More than just a festival, it is a signature celebration of creativity that continues to inspire, connect, and showcase the cultural brilliance of KL University.
                                </p>
                            </div>
                        </motion.div>

                        {/* Stats Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-4 md:p-6 flex flex-col justify-center items-center hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <FiUsers className="text-zinc-600 text-3xl md:text-4xl mb-2 group-hover:text-red-500 transition-colors duration-300 transform group-hover:scale-110" />
                            <span className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1 font-medium">Till Date</span>
                            <h4 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-Martian_Mono)] text-center">
                                <CountUp from={0} to={28} duration={3.5} />K+
                            </h4>
                            <p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium tracking-wide uppercase">Participants</p>
                        </motion.div>

                        {/* Stats Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-4 md:p-6 flex flex-col justify-center items-center hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <FiAward className="text-zinc-600 text-3xl md:text-4xl mb-2 group-hover:text-orange-500 transition-colors duration-300 transform group-hover:scale-110" />
                            <span className="text-zinc-600 text-[10px] uppercase tracking-widest mb-1 font-medium">Till Date</span>
                            <h4 className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-Martian_Mono)] text-center">
                                <CountUp from={0} to={250} duration={3.5} />+
                            </h4>
                            <p className="text-zinc-500 text-xs md:text-sm mt-1 font-medium tracking-wide uppercase">Competitions</p>
                        </motion.div>

                        {/* Liberal Arts Clubs - Spans 2 cols */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/60 to-black border border-white/5 p-8 flex flex-col justify-center hover:border-red-500/30 transition-all duration-500"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-red-600/10 rounded-xl">
                                    <FiFeather className="text-red-500 text-2xl" />
                                </div>
                                <h3 className="text-2xl font-bold text-white font-[family-name:var(--font-Lexend)]">
                                    Liberal Arts Clubs
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 md:gap-x-8 gap-y-3 md:gap-y-4">
                                {[
                                    { name: "Fusion", type: "Dance", color: "bg-red-500" },
                                    { name: "Swara", type: "Music", color: "bg-orange-500" },
                                    { name: "MovieMakers", type: "Film Making", color: "bg-yellow-500" },
                                    { name: "Vachas", type: "Literature", color: "bg-green-500" },
                                    { name: "Esports", type: "Gaming", color: "bg-blue-500" },
                                    { name: "Vastraa", type: "Fashion", color: "bg-purple-500" },
                                    { name: "Abhinaya", type: "Dramatics", color: "bg-pink-500" },
                                ].map((club, idx) => (
                                    <div key={idx} className="flex items-center gap-2 md:gap-3 group/item">
                                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${club.color} group-hover/item:scale-125 transition-transform`} />
                                        <span className="text-zinc-300 font-medium font-[family-name:var(--font-Lexend)] text-sm md:text-base group-hover/item:text-white transition-colors">
                                            {club.name}
                                            <span className="text-zinc-600 ml-1 text-xs md:text-sm font-normal hidden sm:inline">({club.type})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Day-wise Schedule Timeline */}
            <div className="relative z-10 bg-[#030303]">
              <ScheduleTimeline />
            </div>

            {/* Poster Gallery Section - position relative for useScroll offset calc */}
            <section ref={posterSectionRef} className="relative z-30 w-full h-auto min-h-[70vh] md:min-h-[85vh] bg-gradient-to-b from-[#0a0000] to-black overflow-hidden pt-0 pb-4 md:py-20 flex flex-col items-center justify-center" style={{ position: 'relative' }}>
                <div className="w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-0 z-20 relative"
                    >
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent font-sans uppercase tracking-wider">
                            Competitions
                        </h2>
                        <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 mx-auto rounded-full" />
                    </motion.div>

                    {loadingPosters ? (
                        <div className="flex items-center justify-center h-[50vh] md:h-[80vh]">
                            <div className="text-gray-400">Loading gallery...</div>
                        </div>
                    ) : posterItems.length > 0 ? (
                        <>
                            <div className="relative w-full h-[55dvh] min-h-[280px] sm:h-[60dvh] md:h-[70vh] mt-8 md:mt-4" style={{ position: 'relative' }}>
                                <CircularGallery
                                    ref={galleryRef}
                                    items={posterItems}
                                    bend={0}
                                    textColor="#ff8c42"
                                    borderRadius={0.05}
                                    font="bold 28px sans-serif"
                                    scrollSpeed={2}
                                    scrollEase={0.08}
                                    manualMode={true}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                                <p className="text-lg mb-2">No posters found</p>
                                <p className="text-sm mb-4">Upload posters to the poster-gallery folder in R2 bucket</p>
                                <div className="text-xs text-gray-500 mt-4">
                                    <p>Upload posters to public/poster-gallery or configure R2 bucket.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            {/* Footer */}
            <Footer />
        </main>
    );
};

export default HomePage;
