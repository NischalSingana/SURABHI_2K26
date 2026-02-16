"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Loader() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0e1a] backdrop-blur-3xl">
            {/* Background Gradient Orbs - optional for premium feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-[100px]"
                />
            </div>

            {/* Main Logo Container */}
            <div className="relative">
                {/* Glowing Aura behind logo */}
                <motion.div
                    animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [0.8, 1.1, 0.8],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl"
                />

                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative w-48 h-48 md:w-64 md:h-64"
                >
                    <Image
                        src="/images/surabhi1.png"
                        alt="Surabhi Loader"
                        fill
                        sizes="(max-width: 768px) 192px, 256px"
                        className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        loading="eager"
                    />
                </motion.div>
            </div>

            {/* Text Animation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-4 md:mt-6 text-center space-y-1"
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto max-w-[120px]"
                />
                <p className="text-zinc-400 text-sm sm:text-base md:text-lg tracking-widest uppercase">
                    Loading Experience
                </p>
            </motion.div>
        </div>
    );
}
