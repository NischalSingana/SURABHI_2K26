"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiLock, FiUser, FiLoader } from "react-icons/fi";
import { motion } from "framer-motion";

export default function GodLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const email = username.trim().toLowerCase();
            const pass = password.trim();

            if (!email || !pass) {
                toast.error("Please enter both email and password.");
                setLoading(false);
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                toast.error("Please enter a valid email address.");
                setLoading(false);
                return;
            }

            const { data, error } = await signIn.email({
                email,
                password: pass,
            });

            if (error) {
                toast.error(error.message || "Invalid credentials");
                setLoading(false);
                return;
            }

            // Check if user has GOD role
            if ((data?.user as { role?: string })?.role !== "GOD") {
                toast.error("Access denied. God role required.");
                setLoading(false);
                return;
            }

            // Redirect to registration analytics upon success
            toast.success("Welcome, God!");
            router.replace("/admin/registration-analytics");
        } catch (err) {
            console.error("Login error:", err);
            toast.error("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8 sm:p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="w-32 h-16 sm:w-48 sm:h-24 relative mb-3 sm:mb-4">
                        <Image
                            src="/images/surabhi_white_logo.png"
                            alt="Surabhi Logo"
                            fill
                            sizes="192px"
                            priority
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-Schibsted_Grotesk)]">
                        God Portal
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2 text-center">
                        Ultimate access control
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                        <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                inputMode="email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="email"
                                name="email"
                                className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                placeholder=""
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="off"
                                name="password"
                                className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                placeholder=""
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-medium py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <FiLoader className="animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            "Access Dashboard"
                        )}
                    </button>
                </form>
            </motion.div>

            <p className="mt-8 text-gray-500 text-sm text-center">
                Restricted Area. Authorized Personnel Only.
            </p>
        </div>
    );
}
