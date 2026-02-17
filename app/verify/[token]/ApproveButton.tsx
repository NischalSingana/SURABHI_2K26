"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FiCheckCircle } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { approveUser } from "@/actions/admin/users.action";

export default function ApproveButton({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleApprove = async () => {
        setLoading(true);
        try {
            const result = await approveUser(userId);

            if (result.success) {
                toast.success("User approved successfully!");
                router.refresh(); // Refresh to update UI
            } else {
                toast.error(result.error || "Approval failed");
            }
        } catch {
            toast.error("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleApprove}
            disabled={loading}
            className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Approving...
                </span>
            ) : (
                <>
                    <FiCheckCircle className="w-6 h-6" />
                    Approve Registration
                </>
            )}
        </button>
    );
}
