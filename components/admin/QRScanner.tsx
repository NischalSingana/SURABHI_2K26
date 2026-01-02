"use client";

import { useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { FiCamera, FiCheckCircle, FiXCircle, FiX } from "react-icons/fi";
import { toast } from "sonner";

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

export default function QRScanner() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const startScanning = async () => {
        try {
            // Check if element exists
            const element = document.getElementById("qr-reader");
            if (!element) {
                toast.error("Scanner element not found. Please refresh the page.");
                return;
            }

            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    // Stop scanning
                    await stopScanning();

                    // Verify QR code
                    try {
                        const response = await fetch("/api/ticket/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ qrData: decodedText }),
                        });

                        const data = await response.json();
                        setResult(data);

                        if (data.valid) {
                            toast.success("Ticket verified successfully!");
                        } else {
                            toast.error(data.error || "Invalid ticket");
                        }
                    } catch (error) {
                        toast.error("Failed to verify ticket");
                        setResult({ valid: false, error: "Verification failed" });
                    }
                },
                (errorMessage) => {
                    // Ignore scanning errors (they happen frequently)
                }
            );

            setScanning(true);
        } catch (error: any) {
            console.error("Error starting scanner:", error);
            toast.error(error?.message || "Failed to start camera. Please check camera permissions.");
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (error) {
                console.error("Error stopping scanner:", error);
            }
        }
        setScanning(false);
    };

    return (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Verify Ticket</h2>

            {/* Scanner */}
            <div className="mb-6">
                {!scanning && !result && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startScanning}
                        className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                    >
                        <FiCamera size={20} />
                        Start Scanning
                    </motion.button>
                )}

                {scanning && (
                    <div className="relative">
                        <div
                            id="qr-reader"
                            className="rounded-lg overflow-hidden border-2 border-red-600"
                        ></div>
                        <button
                            onClick={stopScanning}
                            className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Verification Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-6 rounded-lg border-2 ${result.valid
                            ? "bg-green-500/10 border-green-500"
                            : "bg-red-500/10 border-red-500"
                            }`}
                    >
                        {/* Status Header */}
                        <div className="flex items-center gap-3 mb-4">
                            {result.valid ? (
                                <FiCheckCircle className="text-green-500 text-3xl" />
                            ) : (
                                <FiXCircle className="text-red-500 text-3xl" />
                            )}
                            <h3
                                className={`text-2xl font-bold ${result.valid ? "text-green-500" : "text-red-500"
                                    }`}
                            >
                                {result.valid ? "Valid Ticket" : "Invalid Ticket"}
                            </h3>
                        </div>

                        {/* User Details */}
                        {result.valid && result.user && (
                            <div className="space-y-3 text-white">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-zinc-400 text-sm">Name</p>
                                        <p className="font-semibold">{result.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-zinc-400 text-sm">Email</p>
                                        <p className="font-semibold text-sm">{result.user.email}</p>
                                    </div>
                                    {result.user.college && (
                                        <div>
                                            <p className="text-zinc-400 text-sm">College</p>
                                            <p className="font-semibold">{result.user.college}</p>
                                        </div>
                                    )}
                                    {result.user.collegeId && (
                                        <div>
                                            <p className="text-zinc-400 text-sm">College ID</p>
                                            <p className="font-semibold">{result.user.collegeId}</p>
                                        </div>
                                    )}
                                    {result.user.phone && (
                                        <div>
                                            <p className="text-zinc-400 text-sm">Phone</p>
                                            <p className="font-semibold">{result.user.phone}</p>
                                        </div>
                                    )}
                                    {result.user.transactionId && (
                                        <div>
                                            <p className="text-zinc-400 text-sm">Transaction ID</p>
                                            <p className="font-semibold text-sm">
                                                {result.user.transactionId}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Payment Status */}
                                <div className="mt-4 pt-4 border-t border-zinc-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400">Payment Status</span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${result.user.isApproved
                                                ? "bg-green-500/20 text-green-500"
                                                : "bg-yellow-500/20 text-yellow-500"
                                                }`}
                                        >
                                            {result.user.isApproved ? "APPROVED" : "PENDING"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {!result.valid && (
                            <p className="text-red-400 mt-2">{result.error}</p>
                        )}

                        {/* Scan Again Button */}
                        <button
                            onClick={() => {
                                setResult(null);
                                startScanning();
                            }}
                            className="mt-6 w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Scan Another Ticket
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
