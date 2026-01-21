
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Loader from "@/components/ui/Loader";
import { FiUserPlus, FiRefreshCw, FiCopy, FiCheck, FiTrash2 } from "react-icons/fi";
import { createJudgeAccount, getJudgeManagementData, deleteJudgeAccount } from "@/actions/judge.action";

export default function JudgeManagementPage() {
    const [data, setData] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [processing, setProcessing] = useState<string | null>(null);

    // Modals
    const [showAddJudgeModal, setShowAddJudgeModal] = useState<string | null>(null); // Event ID
    const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null); // Judge ID
    const [passwordInput, setPasswordInput] = useState("");
    const [viewingPassword, setViewingPassword] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // Judge ID

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const res = await getJudgeManagementData();
        if (res.success) {
            setData(res.data || []);
            setUserRole(res.role || "");
            if (res.data && res.data.length > 0 && !selectedCategory) {
                setSelectedCategory(res.data[0].id);
            }
        } else {
            toast.error("Failed to load data");
        }
        setLoading(false);
    };

    const handleCreateJudge = async () => {
        if (!showAddJudgeModal) return;
        setProcessing(showAddJudgeModal);

        try {
            // Master can set password, Admin cannot
            const passwordToSend = userRole === "MASTER" ? passwordInput : null;

            // Basic validation for Master
            if (userRole === "MASTER" && !passwordInput.trim()) {
                toast.error("Password is required for Master");
                setProcessing(null);
                return;
            }

            const res = await createJudgeAccount(showAddJudgeModal, passwordToSend);

            if (res.success) {
                toast.success(`Judge account created! Email: ${res.email} `);
                setShowAddJudgeModal(null);
                setPasswordInput("");
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

    // For updating password (Master only)
    const handleUpdatePassword = async () => {
        if (!showPasswordModal || !passwordInput.trim()) return;
        setProcessing(showPasswordModal);

        try {
            // We need a specific action for updating password if we split creation/update
            // But for now, we can perhaps use a new action or modify create to handle update?
            // Actually, the previous createJudgeAccount handled upsert logic. 
            // But now we foster MULTIPLE judges. So we are likely creating NEW ones.
            // Editing an existing judge's password is a different operation.
            // I'll assume I need to add 'updateJudgePassword' action or use a similar logic.
            // Wait, I didn't add updateJudgePassword to backend yet! 
            // The prompt said "delete all previous judge's accounts... create judge option...". 
            // It didn't explicitly ask for EDITING existing judges in the new flow, but it's implied by "MASTER WILL SET password".
            // If Master sets password during creation, that's covered.
            // If Master wants to navigate to an existing judge and set password? 
            // I should probably add an update password action.
            // For now, I will implement creation. If I need update, I'll add it.
            // Let's rely on creation for now.
            // Wait, the UI has "Edit Password" button.
            // I will implement a quick action for it in next step if needed.
            // Re-reading user request: "just create accounts, password MASTER WILL SET passowrd."
            // This implies creation time. 
            // "delete all previous... create judges... add multiple judge accounts".

            toast.error("Update password not implemented in this batch. Please delete and recreate if needed or request feature.");
            // I should implement it given I have "Edit Password" in UI code previously.
            // I'll comment out the "Edit Password" button for now or implement the action quickly.
            // Actually I added `updateJudgePassword` in the backend block previously!
            // I added `updateJudgePassword` function in `actions / judge.action.ts`?
            // checking... Yes I did! I added export async function updateJudgePassword... at the end of the file.
            // So I can import it.
            const { updateJudgePassword } = await import("@/actions/judge.action");
            const res = await updateJudgePassword(showPasswordModal, passwordInput);
            if (res.success) {
                toast.success("Password updated");
                setShowPasswordModal(null);
                setPasswordInput("");
                loadData();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to update password");
        } finally {
            setProcessing(null);
        }
    }

    const handleDeleteJudge = async () => {
        if (!deleteConfirm) return;
        setProcessing(deleteConfirm);

        try {
            const res = await deleteJudgeAccount(deleteConfirm);
            if (res.success) {
                toast.success("Judge account deleted");
                setDeleteConfirm(null);
                loadData();
            } else {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to delete judge");
        } finally {
            setProcessing(null);
        }
    }


    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    if (loading) return <Loader />;

    const selectedCategoryData = data.find(c => c.id === selectedCategory);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Judge Management</h1>
                        <p className="text-gray-400">Manage judge accounts per event.</p>
                    </div>
                </header>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Select Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full md:w-1/3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                    >
                        {data.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {selectedCategoryData && (
                    <div className="space-y-6">
                        {selectedCategoryData.Event.map((event: any) => (
                            <div key={event.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold">{event.name}</h3>
                                        <p className="text-zinc-500 text-sm mt-1">{event.slug}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {(userRole === "MASTER" || userRole === "ADMIN") && (
                                            <button
                                                onClick={() => {
                                                    setShowAddJudgeModal(event.id);
                                                    setPasswordInput(""); // reset
                                                }}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <FiUserPlus /> Add Judge
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Judges List */}
                                <div className="bg-black/30 rounded-lg border border-zinc-800 overflow-hidden">
                                    {event.judges && event.judges.length > 0 ? (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-zinc-800/50 text-gray-400">
                                                <tr>
                                                    <th className="p-3">Email</th>
                                                    <th className="p-3">Status</th>
                                                    {userRole === "MASTER" && <th className="p-3">Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                {event.judges.map((judge: any) => (
                                                    <tr key={judge.id}>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-red-400">{judge.email}</code>
                                                                <button onClick={() => copyToClipboard(judge.email)} className="text-gray-500 hover:text-white"><FiCopy /></button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="text-green-500 flex items-center gap-1"><FiCheck size={12} /> Active</span>
                                                        </td>
                                                        {userRole === "MASTER" && (
                                                            <td className="p-3 flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setShowPasswordModal(judge.id);
                                                                        setPasswordInput("");
                                                                    }}
                                                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs border border-zinc-600"
                                                                >
                                                                    Edit Password
                                                                </button>
                                                                <button
                                                                    onClick={() => setViewingPassword(judge.judgePassword || "Not viewable (Set prior to update). Edit to reset.")}
                                                                    className="px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 rounded text-xs border border-blue-500/30"
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(judge.id)}
                                                                    className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs border border-red-500/30 flex items-center gap-1"
                                                                >
                                                                    <FiTrash2 size={12} /> Delete
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 font-medium italic">
                                            No judges assigned.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Add/Create Judge Modal */}
            {showAddJudgeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add Judge</h3>
                        <p className="text-sm text-zinc-400 mb-4">
                            Create a new judge account for this event. Email will be auto-generated.
                        </p>

                        {userRole === "MASTER" ? (
                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-1">Set Password</label>
                                <input
                                    type="text"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                                />
                            </div>
                        ) : (
                            <p className="text-yellow-500 text-sm mb-4 bg-yellow-500/10 p-2 rounded">
                                Note: You are creating an account without a known password. A MASTER admin must set the password later for the judge to login.
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddJudgeModal(null)} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">Cancel</button>
                            <button
                                onClick={handleCreateJudge}
                                disabled={!!processing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
                            >
                                {processing ? <FiRefreshCw className="animate-spin" /> : "Create Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Password Modal (Master Only) */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Update Judge Password</h3>
                        <p className="text-xs text-yellow-500 mb-4 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                            Warning: Setting a new password will immediately invalidate the previous password.
                        </p>
                        <input
                            type="text"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 mb-4 text-white focus:outline-none focus:border-red-500"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowPasswordModal(null)} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">Cancel</button>
                            <button
                                onClick={handleUpdatePassword}
                                disabled={!!processing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
                            >
                                {processing ? <FiRefreshCw className="animate-spin" /> : "Update Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Password Modal */}
            {viewingPassword && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold mb-2">Judge Password</h3>
                        <div className="bg-black/50 p-4 rounded-lg mb-4 border border-zinc-800">
                            <code className={`text - xl font - mono tracking - wider ${viewingPassword?.includes("Not viewable") ? "text-yellow-500 text-sm" : "text-green-400"} `}>
                                {viewingPassword}
                            </code>
                        </div>
                        <button
                            onClick={() => setViewingPassword(null)}
                            className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
                            <FiTrash2 /> Confirm Deletion
                        </h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete this judge account? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteJudge}
                                disabled={!!processing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
                            >
                                {processing ? <FiRefreshCw className="animate-spin" /> : "Delete Judge"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

