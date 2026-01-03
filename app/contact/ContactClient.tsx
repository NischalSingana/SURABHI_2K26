"use client";

import { motion } from "framer-motion";
import { FiPhone, FiMail, FiUser } from "react-icons/fi";

interface Coordinator {
    id: string;
    name: string;
    phone: string;
    email: string;
    image: string | null;
    order: number;
}

interface Category {
    id: string;
    name: string;
    order: number;
    coordinators: Coordinator[];
}

interface ContactClientProps {
    categories: Category[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function ContactClient({ categories }: ContactClientProps) {
    return (
        <div className="w-full min-h-screen bg-black relative overflow-hidden pt-20 pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 font-medium text-sm tracking-wide uppercase">
                        Surabhi 2026 Team
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Contact{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                            Coordinators
                        </span>
                    </h1>
                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Connect with our dedicated team members for assistance with Events,
                        Accommodation, Hospitality, and more.
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-16"
                >
                    {categories.map((category) => (
                        <motion.div key={category.id} variants={item} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                                <h2 className="text-2xl font-bold text-red-500 uppercase tracking-wider px-4 py-1 border border-red-900/30 rounded-full bg-red-950/10">
                                    {category.name}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.coordinators.map((coordinator) => (
                                    <motion.div
                                        key={coordinator.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="group bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 hover:border-red-900/50 rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <FiUser size={60} />
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                {coordinator.name}
                                            </h3>
                                            <p className="text-red-400/80 text-xs font-medium uppercase tracking-wider mb-6">
                                                Coordinator
                                            </p>

                                            <div className="space-y-3">
                                                <a
                                                    href={`tel:${coordinator.phone}`}
                                                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group/link p-2 bg-black/20 rounded-lg hover:bg-black/40"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover/link:bg-red-900/20 group-hover/link:text-red-400 transition-colors">
                                                        <FiPhone size={14} />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {coordinator.phone}
                                                    </span>
                                                </a>

                                                <a
                                                    href={`mailto:${coordinator.email}`}
                                                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group/link p-2 bg-black/20 rounded-lg hover:bg-black/40"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover/link:bg-red-900/20 group-hover/link:text-red-400 transition-colors">
                                                        <FiMail size={14} />
                                                    </div>
                                                    <span className="text-sm font-medium truncate">
                                                        {coordinator.email}
                                                    </span>
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {categories.length === 0 && (
                    <div className="text-center py-20 text-zinc-600">
                        <p>No contact information available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
