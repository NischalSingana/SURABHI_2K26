"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MainPoster from "./MainPoster.png";
import CircularGallery from "@/components/ui/CircularGallery";
import { useEffect, useState } from "react";

import Footer from '@/components/ui/Footer';
import ClickSpark from '@/components/ui/ClickSpark';

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
        <ClickSpark
            sparkColor='#ff8c42'
            sparkSize={12}
            sparkRadius={20}
            sparkCount={12}
            duration={500}
        >
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

                {/* About Surabhi Section - One Page */}
                <section className="relative z-10 w-full h-screen bg-gradient-to-b from-[#1a0000] to-[#0a0000] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
                    <div className="max-w-6xl mx-auto w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                                About Surabhi
                            </h2>
                            <div className="w-32 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 mx-auto rounded-full" />
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Left Side - Main Description */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="glass-effect rounded-2xl p-8 backdrop-blur-sm border border-red-600/20">
                                    <p className="text-xl sm:text-2xl text-gray-200 leading-relaxed mb-6">
                                        Surabhi is KL University's annual <span className="text-red-500 font-semibold">international cultural festival</span>, a vibrant celebration that brings together students from diverse backgrounds to showcase their artistic talents.
                                    </p>
                                    <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                                        This grand event serves as a platform for cultural expression, fostering unity, creativity, and appreciation for the rich tapestry of global cultures.
                                    </p>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.4 }}
                                        className="glass-effect rounded-xl p-6 text-center border border-red-600/20"
                                    >
                                        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent mb-2">
                                            35+
                                        </div>
                                        <div className="text-sm sm:text-base text-gray-300">Competitions</div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                        className="glass-effect rounded-xl p-6 text-center border border-red-600/20"
                                    >
                                        <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent mb-2">
                                            21K+
                                        </div>
                                        <div className="text-sm sm:text-base text-gray-300">Participants</div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Right Side - Features */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="space-y-4"
                            >
                                {/* Feature Cards */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="glass-effect rounded-xl p-6 border border-red-600/20 hover:border-red-600/40 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-2">Diverse Performances</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                Singing, dancing, drama, skits, and artistic performances by talented students from various disciplines.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.5 }}
                                    className="glass-effect rounded-xl p-6 border border-red-600/20 hover:border-red-600/40 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-2">Hobby Clubs</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                Narthana (Dance), Abhinaya (Drama), Swara (Music), and Vachas (Literary) organize and perform.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                    className="glass-effect rounded-xl p-6 border border-red-600/20 hover:border-red-600/40 transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-2">National Recognition</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                Recognized by the Indian Book of Records for organizing India's largest cultural festival.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
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
        </ClickSpark >
    );
};

export default HomePage;
