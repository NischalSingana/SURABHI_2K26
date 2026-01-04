"use client";

import { useEffect } from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Verify Page Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <FiAlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong!</h1>
            <div className="bg-zinc-900 p-4 rounded-lg mb-6 max-w-md w-full overflow-auto">
                <p className="text-red-400 font-mono text-xs text-left">
                    {error.message || "Unknown error occurred"}
                </p>
                {error.digest && (
                    <p className="text-zinc-600 font-mono text-xs text-left mt-2">
                        Digest: {error.digest}
                    </p>
                )}
            </div>
            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition"
            >
                Try again
            </button>
        </div>
    );
}
