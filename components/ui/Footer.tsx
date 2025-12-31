"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaInstagram, FaEnvelope, FaMapMarkerAlt, FaYoutube, FaFacebook } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: FaInstagram, href: "https://instagram.com/klsurabhi", label: "Instagram" },
        { icon: FaYoutube, href: "#", label: "Youtube" },
        { icon: FaFacebook, href: "#", label: "Facebook" },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    return (
        <footer className="relative bg-black border-t border-zinc-900 pt-20 pb-10 overflow-hidden z-20">
            {/* Fiery Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16"
                >
                    {/* Brand & Mission Section - 5 cols */}
                    <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
                        <Link href="/" className="inline-block">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-2">
                                Surabhi 2026
                            </h2>
                            <div className="h-1 w-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full" />
                        </Link>

                        <p className="text-zinc-400 leading-relaxed text-lg max-w-md">
                            Surabhi is KL University&apos;s annual international cultural festival, a vibrant celebration uniting students through the universal language of art, culture, and innovation.
                        </p>

                        <div className="flex gap-4 pt-4">
                            {socialLinks.map((social, idx) => (
                                <motion.a
                                    key={idx}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
                                >
                                    <social.icon size={18} />
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Links - 3 cols */}
                    <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
                        <h3 className="text-white font-semibold text-xl">Quick Links</h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Events', href: '/events' },
                                { name: 'Gallery', href: '/events#gallery' },
                                { name: 'Sponsors', href: '/sponsors' },
                                { name: 'Contact Us', href: '/contact' },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-2 group w-fit"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/0 group-hover:bg-red-500 transition-colors" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Contact Info - 4 cols */}
                    <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
                        <h3 className="text-white font-semibold text-xl">Contact Us</h3>
                        <div className="space-y-4">
                            <a
                                href="mailto:surabhi@kluniversity.in"
                                className="group flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-red-500/30 transition-all"
                            >
                                <div className="p-2.5 bg-zinc-800 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <FaEnvelope size={18} />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 mb-0.5">Email Us</p>
                                    <p className="text-zinc-300 font-medium group-hover:text-white transition-colors">
                                        surabhi@kluniversity.in
                                    </p>
                                </div>
                            </a>

                            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                <div className="p-2.5 bg-zinc-800 rounded-lg text-red-500">
                                    <FaMapMarkerAlt size={18} />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 mb-0.5">Visit Us</p>
                                    <p className="text-zinc-300 font-medium">
                                        KL University, Vaddeswaram,<br />
                                        Guntur, Andhra Pradesh 522302
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Footer Bottom */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    <p className="text-zinc-600 text-sm text-center md:text-left">
                        © {currentYear} Surabhi International Cultural Fest. All rights reserved.
                    </p>

                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                        <span>Made with</span>
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-red-500"
                        >
                            ❤️
                        </motion.span>
                        <span>at KL University</span>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
