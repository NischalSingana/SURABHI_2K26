"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MainPoster from "./MainPoster.png";
import CircularGallery from "@/components/ui/CircularGallery";
import { useEffect, useState } from "react";

import Footer from '@/components/ui/Footer';
import CountUp from '@/components/ui/CountUp';
import { FiGlobe, FiAward, FiUsers, FiMusic, FiHeart, FiTrendingUp } from "react-icons/fi";

const HomePage = () => {
    const [posterItems, setPosterItems] = useState<{ image: string; text: string }[]>([]);
    const [loadingPosters, setLoadingPosters] = useState(true);
    const [particles, setParticles] = useState<Array<{ x: string; duration: number; delay: number }>>([]);

    useEffect(() => {
        // Generate particles on client side to avoid hydration mismatch
        setParticles([...Array(20)].map(() => ({
            x: `${Math.random() * 100}%`,
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
        })));

        // Fetch poster gallery items from API
        const fetchPosters = async () => {
            try {
                const response = await fetch('/api/poster-gallery');
                if (!response.ok) {
                    console.error('API response not OK:', response.status, response.statusText);
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Error data:', errorData);
                    return;
                }
                const data = await response.json();
                console.log('Poster gallery API response:', data);

                if (data.error) {
                    console.error('API returned error:', data.error, data.details);
                }

                if (data.items && data.items.length > 0) {
                    console.log(`Loaded ${data.items.length} posters:`, data.items.map((item: any) => item.image));
                    setPosterItems(data.items);
                } else {
                    console.log('No posters found in gallery. Response:', data);
                }
            } catch (error) {
                console.error('Error fetching posters:', error);
            } finally {
                setLoadingPosters(false);
            }
        };

        fetchPosters();
    }, []);

    return (
        <main className="relative w-full">
            {/* Fiery Red Background - Edge to Edge */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#1a0000] via-[#4a0000] to-[#2a0000]">
                {/* Animated gradient overlay */}
                <motion.div
                    animate={{
                        background: [
                            "radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 50%, rgba(185, 28, 28, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
                            "radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)",
                        ],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0"
                />
                {/* Fire-like particles effect */}
                <div className="absolute inset-0 overflow-hidden">
                    {particles.map((particle, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-red-600 rounded-full"
                            initial={{
                                x: particle.x,
                                y: "100%",
                                opacity: 0,
                            }}
                            animate={{
                                y: "-10%",
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay,
                                ease: "easeOut",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Poster Section - Edge to Edge (left, right, bottom), top space for navbar */}
            <section className="relative w-full h-auto md:h-screen flex items-center justify-center overflow-hidden z-10 pt-24 md:pt-16 pb-0">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="relative w-full h-auto md:h-full flex items-center justify-center bg-[#0f0505] py-0"
                >
                    {/* Ambient Background Gradient - No duplicate image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0f0505]" />

                    {/* Subtle red glow in center */}
                    <div className="absolute inset-0 bg-radial-gradient from-red-900/10 via-transparent to-transparent opacity-50" />

                    {/* Poster Container */}
                    <div className="relative w-full h-auto md:h-full flex items-center justify-center z-10 px-0">
                        <Image
                            src={MainPoster}
                            alt="Surabhi International Cultural Fest 2026 Poster"
                            className="w-full h-auto md:h-full object-contain md:object-fill drop-shadow-2xl"
                            priority
                            sizes="100vw"
                            quality={85}
                        />
                    </div>
                </motion.div>
            </section>

            {/* About Surabhi Section - Bento Grid Redesign */}
            <section className="relative z-10 w-full min-h-screen bg-[#0a0000] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
                {/* Background Noise/Gradient */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 brightness-100 mix-blend-overlay pointer-events-none" />
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
                            className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-6 md:p-8 flex flex-col justify-between hover:border-red-500/30 transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />

                            <div className="relative z-10 space-y-4 md:space-y-6">
                                <h3 className="text-2xl md:text-3xl font-bold text-white font-[family-name:var(--font-Lexend)]">
                                    A Legacy of Artistic Excellence
                                </h3>
                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-[family-name:var(--font-Lexend)]">
                                    Surabhi is the flagship cultural festival of <span className="text-red-400 font-medium">KL University</span>, organized by the Student Activity Centre (SAC), serving as a vibrant platform for artistic expression and cultural diversity. Celebrated annually, the fest brings together talented students from across the country, transforming the campus into a lively space where tradition and modern creativity blend seamlessly through dance, music, theatre, fine arts, and literary events.
                                </p>
                                <p className="text-zinc-400 text-base md:text-lg leading-relaxed font-[family-name:var(--font-Lexend)] hidden sm:block">
                                    Driven by a strong student-led spirit, Surabhi is planned, organized, and executed by dedicated student teams under SAC, fostering leadership, teamwork, and innovation. This commitment to excellence has earned the fest recognition, including a place in the <span className="text-white border-b border-red-500/50">Indian Book of Records</span>.
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
                                <CountUp from={0} to={21} duration={2.5} />K+
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
                                <CountUp from={0} to={35} duration={2.5} />+
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
                                    <FiMusic className="text-red-500 text-2xl" />
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

            {/* Poster Gallery Section */}
            <section className="relative z-10 w-full h-screen bg-gradient-to-b from-[#0a0000] to-[#1a0000] overflow-hidden">
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-8 z-10"
                    >
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent font-sans uppercase tracking-wider">
                            Events
                        </h2>
                        <div className="w-32 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 mx-auto rounded-full" />
                    </motion.div>

                    {loadingPosters ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-gray-400">Loading gallery...</div>
                        </div>
                    ) : posterItems.length > 0 ? (
                        <>
                            <div className="w-full h-[80vh]">
                                <CircularGallery
                                    items={posterItems}
                                    bend={0}
                                    textColor="#ff8c42"
                                    borderRadius={0.05}
                                    font="bold 28px sans-serif"
                                    scrollSpeed={2}
                                    scrollEase={0.05}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                                <p className="text-lg mb-2">No posters found</p>
                                <p className="text-sm mb-4">Upload posters to the poster-gallery folder in R2 bucket</p>
                                <div className="text-xs text-gray-500 mt-4">
                                    <p>Debug info: Check browser console for API response</p>
                                    <button
                                        onClick={() => {
                                            fetch('/api/poster-gallery')
                                                .then(r => r.json())
                                                .then(d => console.log('API Response:', d))
                                                .catch(e => console.error('API Error:', e));
                                        }}
                                        className="mt-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                                    >
                                        Test API
                                    </button>
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
