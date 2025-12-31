"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX } from "react-icons/fi";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
}

const FAQAdminPage = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<FAQ>>({
        question: "",
        answer: "",
        category: "General",
        order: 0,
    });

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            const res = await fetch("/api/faqs");
            if (res.ok) {
                const data = await res.json();
                setFaqs(data);
            }
        } catch (error) {
            toast.error("Failed to fetch FAQs");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;

        try {
            const res = await fetch(`/api/faqs/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setFaqs(faqs.filter((f) => f.id !== id));
                toast.success("FAQ deleted");
            } else {
                toast.error("Failed to delete FAQ");
            }
        } catch (error) {
            toast.error("Error deleting FAQ");
        }
    };

    const handleCreate = async () => {
        if (!formData.question || !formData.answer) {
            toast.error("Question and Answer are required");
            return;
        }

        try {
            const res = await fetch("/api/faqs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const newFaq = await res.json();
                setFaqs([...faqs, newFaq]);
                setIsCreating(false);
                setFormData({ question: "", answer: "", category: "General", order: 0 });
                toast.success("FAQ created successfully");
            } else {
                toast.error("Failed to create FAQ");
            }
        } catch (error) {
            toast.error("Error creating FAQ");
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const res = await fetch(`/api/faqs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updatedFaq = await res.json();
                setFaqs(faqs.map((f) => (f.id === id ? updatedFaq : f)));
                setIsEditing(null);
                setFormData({ question: "", answer: "", category: "General", order: 0 });
                toast.success("FAQ updated successfully");
            } else {
                toast.error("Failed to update FAQ");
            }
        } catch (error) {
            toast.error("Error updating FAQ");
        }
    };

    const startEdit = (faq: FAQ) => {
        setIsEditing(faq.id);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            order: faq.order,
        });
        setIsCreating(false);
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setIsCreating(false);
        setFormData({ question: "", answer: "", category: "General", order: 0 });
    };

    return (
        <div className="p-6 md:p-10 min-h-screen bg-black text-white">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Manage FAQs</h1>
                    <button
                        onClick={() => {
                            setIsCreating(true);
                            setIsEditing(null);
                            setFormData({ question: "", answer: "", category: "General", order: 0 });
                        }}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiPlus /> New FAQ
                    </button>
                </div>

                {/* Create Form */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h2 className="text-xl font-semibold mb-4 text-red-400">Add New FAQ</h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Question"
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                    />
                                    <textarea
                                        placeholder="Answer"
                                        rows={4}
                                        value={formData.answer}
                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                    />
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            placeholder="Category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-1/2 bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Order"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                            className="w-1/2 bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleCreate}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Create FAQ
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-zinc-500">Loading FAQs...</div>
                    ) : faqs.length === 0 ? (
                        <div className="text-zinc-500 text-center py-10 bg-zinc-900/30 rounded-xl border-2 border-dashed border-zinc-800">
                            No FAQs found. Create one to get started.
                        </div>
                    ) : (
                        faqs.map((faq) => (
                            <motion.div
                                key={faq.id}
                                layout
                                className={`bg-zinc-900/50 border ${isEditing === faq.id ? "border-red-500/50" : "border-zinc-800"
                                    } rounded-xl p-6 transition-all`}
                            >
                                {isEditing === faq.id ? (
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={formData.question}
                                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                            className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                        />
                                        <textarea
                                            rows={4}
                                            value={formData.answer}
                                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                            className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                        />
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={formData.category || ""}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-1/2 bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                            />
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                                className="w-1/2 bg-black/50 border border-zinc-700 rounded-lg p-3 focus:border-red-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleUpdate(faq.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <FiSave /> Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <FiX /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                                                    Order: {faq.order}
                                                </span>
                                                <span className="text-xs font-medium bg-red-900/30 text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                                                    {faq.category || "General"}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg text-zinc-100">{faq.question}</h3>
                                            <p className="text-zinc-400 leading-relaxed">{faq.answer}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => startEdit(faq)}
                                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(faq.id)}
                                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FAQAdminPage;
