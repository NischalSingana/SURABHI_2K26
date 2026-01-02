"use client";

import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { FiCamera, FiCheckCircle, FiXCircle } from "react-icons/fi";
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
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const startScanning = async () => {
        setCameraError(null);

        try {
            // Check if element exists
            const element = document.getElementById("qr-reader");
            if (!element) {
                toast.error("Scanner element not found. Please refresh the page.");
                return;
            }

            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            // Start scanning with rear camera
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                async (decodedText) => {
                    console.log("QR Code detected:", decodedText);

                    // Stop scanning immediately
                    try {
                        await html5QrCode.stop();
                        await html5QrCode.clear();
                        setScanning(false);
                    } catch (error) {
                        console.error("Error stopping scanner:", error);
                    }

                    // Verify QR code
                    await verifyQRCode(decodedText);
                },
                (errorMessage) => {
                    // Ignore frequent scanning errors
                    // console.log("Scan error:", errorMessage);
                }
            );

            setScanning(true);
            toast.success("Camera started! Point at QR code to scan");
        } catch (error: any) {
            console.error("Error starting scanner:", error);
            const errorMsg = error?.message || "Failed to start camera";
            setCameraError(errorMsg);

            if (errorMsg.includes("Permission")) {
                toast.error("Camera permission denied. Please allow camera access.");
            } else if (errorMsg.includes("NotFound")) {
                toast.error("No camera found on this device.");
            } else {
                toast.error("Failed to start camera. " + errorMsg);
            }
            setScanning(false);
        }
    };

    const verifyQRCode = async (qrData: string) => {
        try {
            // Extract QR data from URL if it's a URL
            let dataToVerify = qrData;

            // If it's a URL, extract the qr parameter
            if (qrData.startsWith('http')) {
                const url = new URL(qrData);
                const qrParam = url.searchParams.get('qr');
                if (qrParam) {
                    dataToVerify = qrParam;
                }
            }

            const response = await fetch("/api/ticket/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrData: dataToVerify }),
            });

            const data = await response.json();
            setResult(data);

            if (data.valid) {
                toast.success("Ticket verified successfully!");
            } else {
                toast.error(data.error || "Invalid ticket");
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast.error("Failed to verify ticket");
            setResult({ valid: false, error: "Verification failed" });
        }
    };

    const resetScanner = () => {
        setResult(null);
        setCameraError(null);
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

                {/* Always render qr-reader div, just hide it */}
                <div
                    id="qr-reader"
                    className={`rounded-lg overflow-hidden border-2 border-red-600 ${scanning ? "block" : "hidden"
                        }`}
                ></div>

                {scanning && (
                    <div className="mt-4 text-center">
                        <p className="text-gray-300 text-sm animate-pulse">
                            Point camera at QR code...
                        </p>
                    </div>
                )}

                {cameraError && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{cameraError}</p>
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
                                resetScanner();
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
