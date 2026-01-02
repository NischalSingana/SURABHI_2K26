"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

interface VerificationResult {
    valid: boolean;
    user?: {
        name: string;
        email: string;
        phone: string | null;
        college: string | null;
        collegeId: string | null;
        branch: string | null;
        year: number | null;
        transactionId: string | null;
        paymentStatus: string;
        isApproved: boolean;
        registeredAt: Date;
    };
    verifiedAt?: string;
    error?: string;
}

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyTicket = async () => {
            const qrData = searchParams.get("data");

            if (!qrData) {
                setResult({ valid: false, error: "No ticket data provided" });
                setLoading(false);
                return;
            }

            try {
                const response = await fetch("/api/ticket/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ qrData }),
                });

                const data = await response.json();
                setResult(data);
            } catch (error) {
                setResult({ valid: false, error: "Verification failed" });
            } finally {
                setLoading(false);
            }
        };

        verifyTicket();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <FiLoader className="text-red-600 text-6xl" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black px-4 py-8 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full"
            >
                <div
                    className={`p-8 rounded-xl border-2 ${result?.valid
                            ? "bg-green-500/10 border-green-500"
                            : "bg-red-500/10 border-red-500"
                        }`}
                >
                    {/* Status Header */}
                    <div className="flex items-center gap-4 mb-6">
                        {result?.valid ? (
                            <FiCheckCircle className="text-green-500 text-5xl" />
                        ) : (
                            <FiXCircle className="text-red-500 text-5xl" />
                        )}
                        <div>
                            <h1
                                className={`text-3xl font-bold ${result?.valid ? "text-green-500" : "text-red-500"
                                    }`}
                            >
                                {result?.valid ? "Valid Ticket ✓" : "Invalid Ticket ✗"}
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                {result?.valid
                                    ? "This ticket has been verified successfully"
                                    : "This ticket could not be verified"}
                            </p>
                        </div>
                    </div>

                    {/* User Details */}
                    {result?.valid && result.user && (
                        <div className="space-y-4 mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-zinc-900 p-4 rounded-lg">
                                    <p className="text-zinc-400 text-sm mb-1">Participant Name</p>
                                    <p className="text-white font-semibold text-lg">{result.user.name}</p>
                                </div>

                                <div className="bg-zinc-900 p-4 rounded-lg">
                                    <p className="text-zinc-400 text-sm mb-1">Email</p>
                                    <p className="text-white font-semibold">{result.user.email}</p>
                                </div>

                                {result.user.college && (
                                    <div className="bg-zinc-900 p-4 rounded-lg">
                                        <p className="text-zinc-400 text-sm mb-1">College</p>
                                        <p className="text-white font-semibold">{result.user.college}</p>
                                    </div>
                                )}

                                {result.user.collegeId && (
                                    <div className="bg-zinc-900 p-4 rounded-lg">
                                        <p className="text-zinc-400 text-sm mb-1">College ID</p>
                                        <p className="text-white font-semibold">{result.user.collegeId}</p>
                                    </div>
                                )}

                                {result.user.phone && (
                                    <div className="bg-zinc-900 p-4 rounded-lg">
                                        <p className="text-zinc-400 text-sm mb-1">Phone</p>
                                        <p className="text-white font-semibold">{result.user.phone}</p>
                                    </div>
                                )}

                                {result.user.transactionId && (
                                    <div className="bg-zinc-900 p-4 rounded-lg">
                                        <p className="text-zinc-400 text-sm mb-1">Transaction ID</p>
                                        <p className="text-white font-semibold text-sm">
                                            {result.user.transactionId}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Status */}
                            <div className="bg-zinc-900 p-4 rounded-lg flex items-center justify-between">
                                <span className="text-zinc-400">Payment Status</span>
                                <span
                                    className={`px-4 py-2 rounded-full text-sm font-bold ${result.user.isApproved
                                            ? "bg-green-500/20 text-green-500"
                                            : "bg-yellow-500/20 text-yellow-500"
                                        }`}
                                >
                                    {result.user.isApproved ? "APPROVED ✓" : "PENDING"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {!result?.valid && (
                        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-red-400 font-semibold">
                                {result?.error || "Invalid or expired ticket"}
                            </p>
                            <p className="text-zinc-400 text-sm mt-2">
                                Please contact support if you believe this is an error.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={() => router.push("/admin/verify-tickets")}
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Scan Another Ticket
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-400 text-sm text-center">
                        This verification was performed at{" "}
                        <span className="text-white font-semibold">
                            {new Date().toLocaleString()}
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
