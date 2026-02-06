"use client";

import React from 'react';
import { motion } from 'framer-motion';

export interface SponsorItem {
    image?: string;
    name: string;
    description: string;
    sponsoredFor: string;
    website?: string;
    borderColor?: string;
    gradient?: string;
}

export interface ChromaGridProps {
    items: SponsorItem[];
    className?: string;
    // Legacy props (can be ignored or removed)
    radius?: number;
    damping?: number;
    fadeOut?: number;
    ease?: string;
}

const ChromaGrid: React.FC<ChromaGridProps> = ({
    items,
    className = '',
}) => {

    const handleCardClick = (url?: string) => {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full ${className}`}>
            {items.map((sponsor, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    onClick={() => handleCardClick(sponsor.website)}
                    className="group relative flex flex-col w-full rounded-2xl overflow-hidden cursor-pointer bg-neutral-900/40 backdrop-blur-md border border-white/5 shadow-lg transition-all duration-500 ease-out"
                    whileHover={{
                        y: -8,
                        boxShadow: `0 25px 50px -12px ${sponsor.borderColor || '#ef4444'}30`,
                        borderColor: sponsor.borderColor || '#ef4444',
                        backgroundColor: "rgba(23, 23, 23, 0.6)"
                    }}
                >
                    {/* Hover Gradient Overlay */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none mix-blend-overlay"
                    />

                    {/* Image */}
                    {sponsor.image && (
                        <div className="relative z-10 w-full h-80 overflow-hidden">
                            <motion.img
                                src={sponsor.image}
                                alt={sponsor.name}
                                className="w-full h-full object-cover"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.4 }}
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-white mb-2 transition-colors duration-300"
                            style={{
                                textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                            }}
                        >
                            {sponsor.name}
                        </h3>
                        <p className="text-gray-300 text-sm mb-4 flex-1 font-medium leading-relaxed"
                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                        >
                            {sponsor.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center w-full">
                            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                                Sponsored
                            </span>
                            <span
                                className="text-lg font-bold"
                                style={{ color: sponsor.borderColor || '#dc2626' }}
                            >
                                {sponsor.sponsoredFor}
                            </span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default ChromaGrid;
