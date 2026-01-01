"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { FiUser, FiLogIn } from "react-icons/fi";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/events" },
    { name: "Gallery", href: "/gallery" },
    { name: "Contact", href: "/contact" },
];

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-[100] bg-transparent"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-40">
                        {/* Logo */}
                        <Link href="/" className="flex items-center group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="relative w-32 h-32"
                            >
                                <Image
                                    src="/favicon.ico"
                                    alt="Surabhi Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-16">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        className={`relative text-xl font-medium transition-colors hover:text-red-400 ${pathname === link.href
                                            ? "text-red-400"
                                            : "text-gray-300"
                                            }`}
                                    >
                                        {link.name}
                                        {pathname === link.href && (
                                            <motion.div
                                                layoutId="navbar-indicator"
                                                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 to-rose-600"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Profile/Auth Section */}
                        <div className="hidden lg:flex items-center gap-4">
                            {session?.user ? (
                                <Link href="/profile">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-3 px-4 py-2 rounded-lg glass-effect hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center">
                                            <FiUser className="text-white" size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-sm font-medium leading-tight">
                                                {session.user.name}
                                            </p>
                                            <p className="text-gray-400 text-xs leading-tight">
                                                View Profile
                                            </p>
                                        </div>
                                    </motion.div>
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-600/20"
                                    >
                                        <FiLogIn size={18} />
                                        Login / Register
                                    </motion.button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 rounded-lg glass-effect hover:bg-white/10 transition-colors"
                            aria-label="Toggle mobile menu"
                        >
                            <HiMenuAlt3 size={28} className="text-white" />
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 120 }}
                            className="fixed top-0 right-0 bottom-0 w-full sm:w-80 bg-[#111827] z-50 lg:hidden overflow-y-auto"
                        >
                            {/* Close Button */}
                            <div className="flex justify-end p-6">
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 rounded-full glass-effect hover:bg-white/10 transition-colors"
                                >
                                    <IoClose size={28} className="text-white" />
                                </motion.button>
                            </div>

                            {/* Mobile Navigation Links */}
                            <div className="px-6 space-y-2">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`block px-4 py-3 rounded-lg text-lg font-medium transition-all ${pathname === link.href
                                                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white"
                                                : "text-gray-300 hover:bg-white/5"
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Mobile Profile/Auth Section */}
                            <div className="px-6 mt-8">
                                {session?.user ? (
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <motion.div
                                            whileTap={{ scale: 0.95 }}
                                            className="flex items-center gap-3 p-4 rounded-lg glass-effect"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center">
                                                <FiUser className="text-white" size={20} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {session.user.name}
                                                </p>
                                                <p className="text-gray-400 text-sm">View Profile</p>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-medium shadow-lg shadow-red-600/20"
                                        >
                                            <FiLogIn size={20} />
                                            Login / Register
                                        </motion.button>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
