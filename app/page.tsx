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
            <section className="relative w-full h-screen flex items-end justify-center overflow-hidden z-10 pt-16">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.0, ease: "easeOut" }}
                    className="relative w-full h-full flex items-center justify-center bg-[#0f0505]"
                >
                    {/* Ambient Background Gradient - No duplicate image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0f0505]" />

                    {/* Subtle red glow in center */}
                    <div className="absolute inset-0 bg-radial-gradient from-red-900/10 via-transparent to-transparent opacity-50" />

                    {/* Poster Container */}
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                        <Image
                            src={MainPoster}
                            alt="Surabhi International Cultural Fest 2026 Poster"
                            className="w-full h-full object-fill drop-shadow-2xl"
                            priority
                            sizes="100vw"
                            quality={100}
                        />
                    </div>
                </motion.div>
            </section>

            {/* About Surabhi Section - Bento Grid Redesign */}
            <section className="relative z-10 w-full min-h-screen bg-[#0a0000] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
                {/* Background Noise/Gradient */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 brightness-100 mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-red-900/10 via-black to-black pointer-events-none" />

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent font-[family-name:var(--font-Schibsted_Grotesk)] tracking-tight">
                            About Surabhi
                        </h2>
                        <div className="flex items-center justify-center gap-4 text-red-500/60 font-[family-name:var(--font-Martian_Mono)] text-sm tracking-widest uppercase">
                            <span className="w-12 h-[1px] bg-red-800" />
                            International Cultural Fest
                            <span className="w-12 h-[1px] bg-red-800" />
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 sm:gap-4 h-full md:h-[600px]">
                        {/* Main Narrative Card - Spans 2x2 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-8 flex flex-col justify-between hover:border-red-500/30 transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500" />

                            <div className="relative z-10 space-y-6">
                                <h3 className="text-3xl font-bold text-white font-[family-name:var(--font-Schibsted_Grotesk)]">
                                    A Legacy of Artistic Excellence
                                </h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Surabhi is the flagship cultural festival of <span className="text-red-400 font-medium">KL University</span>, celebrated as a grand platform for artistic expression, cultural diversity, and student-led excellence. Held annually, Surabhi brings together talent from across the country and beyond, transforming the campus into a vibrant hub of creativity, performance, and celebration.
                                </p>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Rooted in tradition yet driven by modern expression, Surabhi seamlessly blends classical arts with contemporary forms. From spellbinding dance and music performances to theatrical showcases, fine arts, and literary events, the fest provides a stage where diverse cultures, ideas, and artistic voices come together as one.
                                </p>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    What sets Surabhi apart is its student-driven spirit. Planned, organized, and executed by passionate student teams, the festival fosters leadership, teamwork, and innovation while delivering a professional, large-scale cultural experience. This commitment to excellence has earned Surabhi a proud place in the <span className="text-white border-b border-red-500/50">Indian Book of Records</span>, reflecting its impact and scale in student-led cultural initiatives.
                                </p>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Beyond competitions and performances, Surabhi is an emotion—a celebration of unity, passion, and self-expression. Over two power-packed days, thousands of participants and spectators come together to celebrate art, culture, and youthful energy, making Surabhi not just an event, but a legacy of cultural brilliance.
                                </p>
                            </div>
                        </motion.div>

                        {/* Stats Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-6 flex flex-col justify-center items-center hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <FiUsers className="text-zinc-600 text-4xl mb-4 group-hover:text-red-500 transition-colors duration-300 transform group-hover:scale-110" />
                            <h4 className="text-4xl font-bold text-white font-[family-name:var(--font-Martian_Mono)] text-center">
                                <CountUp from={0} to={21} duration={2.5} />K+
                            </h4>
                            <p className="text-zinc-500 text-sm mt-2 font-medium tracking-wide uppercase">Participants</p>
                        </motion.div>

                        {/* Stats Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-6 flex flex-col justify-center items-center hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <FiAward className="text-zinc-600 text-4xl mb-4 group-hover:text-orange-500 transition-colors duration-300 transform group-hover:scale-110" />
                            <h4 className="text-4xl font-bold text-white font-[family-name:var(--font-Martian_Mono)] text-center">
                                <CountUp from={0} to={35} duration={2.5} />+
                            </h4>
                            <p className="text-zinc-500 text-sm mt-2 font-medium tracking-wide uppercase">Competitions</p>
                        </motion.div>

                        {/* Feature Card - Clubs */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-gradient-to-b from-red-900/20 to-zinc-900/40 border border-white/5 p-6 hover:border-red-500/20 transition-all duration-300"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
                            <FiMusic className="text-red-500 text-3xl mb-4" />
                            <h4 className="text-xl font-bold text-white mb-2">Hobby Clubs</h4>
                            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-400">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Nrithya (Dance)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full" /> Raaga (Music)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" /> Natyaka (Drama)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Chitrakala (Arts)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Sahithya (Lit)</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Vastra (Fashion)</li>
                                <li className="flex items-center gap-2 col-span-2"><span className="w-1.5 h-1.5 bg-pink-500 rounded-full" /> Chitramela (Filmmaking)</li>
                            </ul>
                        </motion.div>

                        {/* Feature Card - Global */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="md:col-span-1 group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-6 hover:border-red-500/20 transition-all duration-300"
                        >
                            <FiTrendingUp className="text-green-500 text-3xl mb-4" />
                            <h4 className="text-xl font-bold text-white mb-2">Impact</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Setting benchmarks every year with record-breaking footfall and celebrity performances.
                            </p>
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
