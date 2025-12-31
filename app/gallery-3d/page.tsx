"use client";

import { motion } from "framer-motion";
import CircularGallery from "@/components/ui/CircularGallery";
import { useEffect, useState } from "react";

const PosterGalleryPage = () => {
    const [posterItems, setPosterItems] = useState<{ image: string; text: string }[]>([]);
    const [loadingPosters, setLoadingPosters] = useState(true);

    useEffect(() => {
        // Fetch poster gallery items from API
        const fetchPosters = async () => {
            try {
                const response = await fetch('/api/gallery-3d');
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
                    // console.log(`Loaded ${data.items.length} posters:`, data.items.map((item: any) => item.image));
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
        <main className="relative w-full min-h-screen bg-[#0a0000] overflow-hidden pt-20">
            {/* Background Effects */}
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
            </div>

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-rose-500 to-red-600 bg-clip-text text-transparent">
                        Poster Gallery
                    </h1>
                    <div className="w-32 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 mx-auto rounded-full" />
                </motion.div>

                {loadingPosters ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-gray-400 animate-pulse">Loading gallery...</div>
                    </div>
                ) : posterItems.length > 0 ? (
                    <div className="w-full h-[80vh] relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CircularGallery
                                items={posterItems}
                                bend={3}
                                textColor="#ef4444"
                                borderRadius={0.05}
                                font="bold 28px sans-serif"
                                scrollSpeed={2}
                                scrollEase={0.05}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[60vh]">
                        <div className="text-center text-gray-400 glass-effect p-8 rounded-xl border border-white/10">
                            <p className="text-lg mb-2">No posters found</p>
                            <p className="text-sm">Upload posters to the poster-gallery folder in Cloudflare R2</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition border border-red-600/50"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default PosterGalleryPage;
