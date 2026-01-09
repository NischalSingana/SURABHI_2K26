"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function PassScanner() {
    const [scanning, setScanning] = useState(false);
    const [manualToken, setManualToken] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    // Using HTML5 Qrcode Scanner ID
    const scannerId = "reader";

    useEffect(() => {
        let html5QrcodeScanner: Html5QrcodeScanner | null = null;

        if (scanning) {
            html5QrcodeScanner = new Html5QrcodeScanner(
                scannerId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );

            html5QrcodeScanner.render(
                (decodedText) => {
                    // Success
                    let token = decodedText;

                    try {
                        const url = new URL(decodedText);
                        // Case 1: New format /verify/[token]
                        if (url.pathname.includes('/verify/')) {
                            token = url.pathname.split('/verify/')[1];
                        }
                        // Case 2: Old format /admin/verify-tickets?qr=... (Handle JSON)
                        else if (url.pathname.includes('verify-tickets') && url.searchParams.get('qr')) {
                            toast.error("Format Deprecated. Please regenerate ticket.");
                            return;
                        }
                    } catch (e) {
                        // Not a URL, treat as raw token
                    }

                    if (token) {
                        verifyPass(token);
                    }
                },
                (errorMessage) => {
                    // parse error, ignore it.
                }
            );
        }

        return () => {
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(console.error);
            }
        };
    }, [scanning]);

    const verifyPass = async (token: string) => {
        // Prevent duplicate verification in short window
        if (verifying) return;

        setVerifying(true);
        try {
            const response = await fetch("/api/pass/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passToken: token }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Pass verified successfully!");
                setLastResult({
                    success: true,
                    pass: data.pass,
                });
            } else {
                toast.error(data.error || "Verification failed");
                setLastResult({
                    success: false,
                    error: data.error,
                });
            }
        } catch (error) {
            toast.error("Failed to verify pass");
            console.error(error);
        } finally {
            // Delay allowing next scan slightly to prevent double-scanning same frame
            setTimeout(() => setVerifying(false), 2000);
        }
    };

    const handleManualVerify = () => {
        if (manualToken.trim()) {
            verifyPass(manualToken.trim());
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Pass Scanner</h2>

            {/* Manual Entry */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Manual Verification
                </h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        placeholder="Enter pass token"
                        className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700"
                    />
                    <button
                        onClick={handleManualVerify}
                        disabled={verifying || !manualToken.trim()}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50"
                    >
                        {verifying ? "Verifying..." : "Verify"}
                    </button>
                </div>
            </div>

            {/* Camera Scanner */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    QR Code Scanner
                </h3>
                {!scanning ? (
                    <button
                        onClick={() => setScanning(true)}
                        className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg"
                    >
                        Start Camera Scanner
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div id={scannerId} className="w-full rounded-lg overflow-hidden bg-black text-white"></div>
                        <button
                            onClick={() => setScanning(false)}
                            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg"
                        >
                            Stop Scanner
                        </button>
                    </div>
                )}
            </div>

            {/* Last Result */}
            {lastResult && (
                <div
                    className={`bg-zinc-900 rounded-xl border p-6 ${lastResult.success
                        ? "border-green-500"
                        : "border-red-500"
                        }`}
                >
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Verification Result
                    </h3>
                    {lastResult.success ? (
                        <div className="space-y-2 text-white">
                            <p>
                                <strong>User:</strong> {lastResult.pass.user.name}
                            </p>
                            <p>
                                <strong>Email:</strong> {lastResult.pass.user.email}
                            </p>
                            <p>
                                <strong>Phone:</strong> {lastResult.pass.user.phone || "N/A"}
                            </p>
                            <p>
                                <strong>College:</strong> {lastResult.pass.user.collage} {lastResult.pass.user.collageId ? `(ID: ${lastResult.pass.user.collageId})` : ''}
                            </p>
                            <p>
                                <strong>Branch/Year:</strong> {lastResult.pass.user.branch} / {lastResult.pass.user.year}
                            </p>
                            <p>
                                <strong>Pass Type:</strong> {lastResult.pass.passType}
                            </p>
                            <div className="mt-4 p-3 bg-green-500/20 text-green-400 rounded text-center font-bold">
                                VALID PASS
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-red-400 text-xl font-bold mb-2">INVALID PASS</p>
                            <p className="text-red-300">{lastResult.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
