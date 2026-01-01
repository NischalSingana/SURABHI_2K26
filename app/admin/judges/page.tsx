"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { FiUserPlus, FiRefreshCw, FiCopy, FiCheck } from "react-icons/fi";
import { createJudgeAccount, getCategoriesWithJudges } from "@/actions/judge.action";

export default function JudgeManagementPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const res = await getCategoriesWithJudges();
        if (res.success) {
            setData(res.data || []);
        } else {
            toast.error("Failed to load data");
        }
        setLoading(false);
    };

    const handleCreateJudge = async (categoryId: string, categoryName: string) => {
        setProcessing(categoryId);
        const email = `judge.${categoryName.toLowerCase().replace(/\s+/g, '')}@klsurabhi.com`;
        const password = "password123"; // Default for now

        try {
            const res = await createJudgeAccount(categoryId, email, password, `Judge - ${categoryName}`);

            if (res.success) {
                toast.success(`Judge account created: ${email}`);
                loadData();
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Failed to create judge");
        } finally {
            setProcessing(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Judge Management</h1>
                    <p className="text-gray-400">Create and manage accounts for event judges.</p>
                </header>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 text-gray-400 text-sm">
                            <tr>
                                <th className="p-4">Category</th>
                                <th className="p-4">Judge Account</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-800/30">
                                    <td className="p-4 font-medium">{item.name}</td>
                                    <td className="p-4">
                                        {item.judge ? (
                                            <div className="flex items-center gap-2">
                                                <code className="bg-black/30 px-2 py-1 rounded text-red-400 text-sm">
                                                    {item.judge.email}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(item.judge.email)}
                                                    className="text-gray-500 hover:text-white"
                                                >
                                                    <FiCopy />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 italic">Not created</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {item.judge ? (
                                            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full flex items-center gap-1 w-fit">
                                                <FiCheck size={12} /> Active
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleCreateJudge(item.id, item.name)}
                                            disabled={!!processing}
                                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/5 flex items-center gap-2"
                                        >
                                            {processing === item.id ? (
                                                <FiRefreshCw className="animate-spin" />
                                            ) : (
                                                <FiUserPlus />
                                            )}
                                            {item.judge ? "Reset Credentials" : "Create Account"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl text-sm text-blue-200">
                    <h3 className="font-bold mb-1">Default Credentials</h3>
                    <p>All created accounts use the default password: <code className="bg-black/30 px-1 py-0.5 rounded text-white">password123</code></p>
                    <p className="mt-1">Login URL: <u>/judge/login</u></p>
                </div>
            </div>
        </div>
    );
}
