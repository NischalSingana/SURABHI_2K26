"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ChromaGrid, { SponsorItem } from "@/components/ui/ChromaGrid";

export default function SponsorsPage() {
    const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSponsors();
    }, []);

    const fetchSponsors = async () => {
        try {
            const response = await fetch("/api/sponsors");
            const data = await response.json();

            if (data.success) {
                setSponsors(data.sponsors);
            }
        } catch (error) {
            console.error("Error fetching sponsors:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative w-full min-h-screen bg-black overflow-hidden pt-16 sm:pt-20">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-black">
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />
            </div>

            <div className="relative z-10 w-full min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-6 sm:mb-10"
                >
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 tracking-tight bg-gradient-to-br from-red-500 via-red-600 to-red-400 bg-clip-text text-transparent drop-shadow-2xl">
                        Our Sponsors
                    </h1>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        We are grateful to our sponsors for their generous support in making Surabhi 2026 possible
                    </p>
                    <div className="w-32 h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-400 mx-auto rounded-full mt-8 shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                </motion.div>

                {/* Sponsors Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-gray-400 animate-pulse text-xl">Loading sponsors...</div>
                    </div>
                ) : sponsors.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="w-full max-w-7xl"
                    >
                        <ChromaGrid items={sponsors} />
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center text-gray-400 glass-effect p-8 rounded-xl border border-white/10">
                            <p className="text-lg mb-2">No sponsors yet</p>
                            <p className="text-sm">Check back soon for our amazing sponsors!</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
