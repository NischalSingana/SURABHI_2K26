"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendThankYouEmailsBatch } from "@/actions/admin/thankyou-emails.action";
import { FiMail, FiSend, FiCheckCircle } from "react-icons/fi";

interface ThankYouEmailsClientProps {
    stats: {
        totalEligible: number;
    };
}

export default function ThankYouEmailsClient({ stats }: ThankYouEmailsClientProps) {
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSendBatch = async () => {
        if (!confirm(`Are you sure you want to send the Thank You email to ${stats.totalEligible} participants?`)) {
            return;
        }

        setIsSending(true);
        const batchSize = 25; // Send in batches to avoid timeouts
        const totalBatches = Math.ceil(stats.totalEligible / batchSize);

        try {
            for (let i = 0; i < totalBatches; i++) {
                const result = await sendThankYouEmailsBatch(batchSize);

                if (!result.success) {
                    toast.error(result.error || "Failed while sending batch emails");
                    break;
                }

                setProgress(Math.round(((i + 1) / totalBatches) * 100));
                toast.success(result.message);

                if (result.count === 0 || (result.successCount === 0 && result.failureCount === 0)) {
                    break; // No more eligible users found
                }
            }

            toast.success("Finished sending Thank You emails!");
        } catch (error) {
            console.error("Error during batch send:", error);
            toast.error("An unexpected error occurred while sending emails");
        } finally {
            setIsSending(false);
            setProgress(0);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <FiMail className="w-24 h-24 text-red-500" />
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-4 relative z-10">Email Stats</h2>
                
                <div className="space-y-4 relative z-10">
                    <div className="bg-gray-900/50 p-4 border border-gray-700 rounded-lg flex justify-between items-center">
                        <span className="text-gray-400">Total Eligible Participants</span>
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className="text-green-500" />
                            <span className="text-2xl font-bold text-white">{stats.totalEligible}</span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                        This email will be sent to all users who have an APPROVED payment status, whose registration is verified, and who have not received this specific Thank You email yet.
                        The email contains an anonymous feedback link.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-500/5">
                    <FiSend className="w-8 h-8 ml-1" />
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-3">Blast Communications</h2>
                <p className="text-gray-400 mb-8 max-w-sm">
                    {stats.totalEligible > 0 
                        ? `Are you ready to send the Thank You email to ${stats.totalEligible} verified participants?`
                        : "There are no eligible participants left who need a Thank You email."}
                </p>
                
                <button
                    onClick={handleSendBatch}
                    disabled={isSending || stats.totalEligible === 0}
                    className="w-full max-w-xs py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg hover:shadow-red-600/25 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                    {isSending ? (
                        <>
                            <div className="absolute inset-0 bg-red-700 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                            <span className="relative z-10 flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending ({progress}%)
                            </span>
                        </>
                    ) : (
                        <>
                            Send Thank You Emails
                            <FiSend className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
