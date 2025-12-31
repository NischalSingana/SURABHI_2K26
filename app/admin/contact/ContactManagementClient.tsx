"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FAQ, createFaq, updateFaq, deleteFaq } from "@/actions/faq.action";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";

interface ContactManagementClientProps {
    initialFaqs: FAQ[];
}

export default function ContactManagementClient({
    initialFaqs,
}: ContactManagementClientProps) {
    const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        category: "",
        order: 0,
    });
    const router = useRouter();

    const handleOpenModal = (faq?: FAQ) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category || "",
                order: faq.order,
            });
        } else {
            setEditingFaq(null);
            setFormData({
                question: "",
                answer: "",
                category: "",
                order: faqs.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFaq(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFaq) {
                const result = await updateFaq(editingFaq.id, formData);
                if (result.success && result.data) {
                    setFaqs(faqs.map((f) => (f.id === editingFaq.id ? result.data! : f)));
                    toast.success("FAQ updated successfully");
                    handleCloseModal();
                } else {
                    toast.error(result.error || "Failed to update FAQ");
                }
            } else {
                const result = await createFaq(formData);
                if (result.success && result.data) {
                    setFaqs([...faqs, result.data]);
                    toast.success("FAQ created successfully");
                    handleCloseModal();
                } else {
                    toast.error(result.error || "Failed to create FAQ");
                }
            }
            router.refresh();
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(id);
            const result = await deleteFaq(id);
            if (result.success) {
                setFaqs(faqs.filter((f) => f.id !== id));
                toast.success("FAQ deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to delete FAQ");
            }
        } catch (error) {
            toast.error("An error occurred during deletion");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">FAQ Management</h2>
                    <p className="text-gray-400">Manage frequently asked questions displayed on the contact page.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-600/20"
                >
                    <FiPlus size={20} />
                    <span>Add New FAQ</span>
                </button>
            </div>

            {/* FAQ List */}
            <div className="grid gap-4">
                {faqs.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-gray-400">No FAQs found. Create one to get started.</p>
                    </div>
                ) : (
                    faqs.map((faq) => (
                        <motion.div
                            key={faq.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-mono bg-white/10 text-gray-400 px-2 py-1 rounded">
                                            Order: {faq.order}
                                        </span>
                                        {faq.category && (
                                            <span className="text-xs font-medium bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">
                                                {faq.category}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                                    <p className="text-gray-300 text-sm whitespace-pre-line">{faq.answer}</p>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(faq)}
                                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <FiEdit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm("Are you sure you want to delete this FAQ?")) {
                                                handleDelete(faq.id);
                                            }
                                        }}
                                        disabled={isDeleting === faq.id}
                                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {isDeleting === faq.id ? (
                                            <div className="w-4.5 h-4.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <FiTrash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] overflow-y-auto bg-[#1a0f0f] border border-red-500/20 rounded-2xl shadow-2xl z-50 p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingFaq ? "Edit FAQ" : "Create New FAQ"}
                                </h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Question
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                                        placeholder="e.g., How do I register?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Answer
                                    </label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                                        placeholder="Enter the detailed answer..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Category (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                                            placeholder="e.g., Registration"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Order
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-600/20"
                                    >
                                        <FiSave size={18} />
                                        {editingFaq ? "Save Changes" : "Create FAQ"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
