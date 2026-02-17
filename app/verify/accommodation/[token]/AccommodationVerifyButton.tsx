"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FiCheckCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function AccommodationVerifyButton({ token }: { token: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/accommodation/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ passToken: token }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Accommodation checked in successfully!");
                router.refresh();
            } else {
                toast.error(data.error || "Verification failed");
            }
        } catch (error) {
            toast.error("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                </span>
            ) : (
                <>
                    <FiCheckCircle className="w-6 h-6" />
                    Mark as Checked In
                </>
            )}
        </button>
    );
}
