"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    createContactCategory,
    updateContactCategory,
    deleteContactCategory,
    createCoordinator,
    updateCoordinator,
    deleteCoordinator,
} from "@/actions/contact.action";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiX,
    FiSave,
    FiChevronDown,
    FiChevronUp,
    FiUser,
    FiPhone,
    FiMail,
} from "react-icons/fi";

interface Coordinator {
    id: string;
    name: string;
    phone: string;
    email: string;
    image: string | null;
    order: number;
    categoryId: string;
}

interface Category {
    id: string;
    name: string;
    order: number;
    coordinators: Coordinator[];
}

interface ContactManagementClientProps {
    initialCategories: Category[];
}

export default function ContactManagementClient({
    initialCategories,
}: ContactManagementClientProps) {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const router = useRouter();

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryFormData, setCategoryFormData] = useState({ name: "", order: 0 });

    // Coordinator Modal State
    const [isCoordinatorModalOpen, setIsCoordinatorModalOpen] = useState(false);
    const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(
        null
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [coordinatorFormData, setCoordinatorFormData] = useState({
        name: "",
        phone: "",
        email: "",
        order: 0,
    });

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(initialCategories.map((c) => c.id))
    );

    const toggleCategory = (id: string) => {
        const newSet = new Set(expandedCategories);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedCategories(newSet);
    };

    // --- Category Handlers ---

    const openCategoryModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryFormData({ name: category.name, order: category.order });
        } else {
            setEditingCategory(null);
            setCategoryFormData({ name: "", order: categories.length + 1 });
        }
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const result = await updateContactCategory(
                    editingCategory.id,
                    categoryFormData.name,
                    isNaN(categoryFormData.order) ? 0 : categoryFormData.order
                );
                if (result.success) {
                    toast.success("Category updated");
                    router.refresh();
                } else {
                    toast.error("Failed to update category");
                }
            } else {
                const result = await createContactCategory(
                    categoryFormData.name,
                    isNaN(categoryFormData.order) ? 0 : categoryFormData.order
                );
                if (result.success) {
                    toast.success("Category created");
                    router.refresh();
                } else {
                    toast.error("Failed to create category");
                }
            }
            setIsCategoryModalOpen(false);
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Delete this category and all its coordinators?")) return;
        try {
            const result = await deleteContactCategory(id);
            if (result.success) {
                toast.success("Category deleted");
                router.refresh();
            } else {
                toast.error("Failed to delete category");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    // --- Coordinator Handlers ---

    const openCoordinatorModal = (categoryId: string, coordinator?: Coordinator) => {
        setSelectedCategoryId(categoryId);
        if (coordinator) {
            setEditingCoordinator(coordinator);
            setCoordinatorFormData({
                name: coordinator.name,
                phone: coordinator.phone,
                email: coordinator.email,
                order: coordinator.order,
            });
        } else {
            setEditingCoordinator(null);
            setCoordinatorFormData({
                name: "",
                phone: "",
                email: "",
                order: 0,
            });
        }
        setIsCoordinatorModalOpen(true);
    };

    const handleCoordinatorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId && !editingCoordinator) return;

        try {
            if (editingCoordinator) {
                const result = await updateCoordinator(editingCoordinator.id, {
                    ...coordinatorFormData,
                    order: isNaN(coordinatorFormData.order) ? 0 : coordinatorFormData.order,
                });
                if (result.success) {
                    toast.success("Coordinator updated");
                    router.refresh();
                } else {
                    toast.error("Failed to update coordinator");
                }
            } else {
                const result = await createCoordinator(selectedCategoryId!, {
                    ...coordinatorFormData,
                    order: isNaN(coordinatorFormData.order) ? 0 : coordinatorFormData.order,
                });
                if (result.success) {
                    toast.success("Coordinator added");
                    router.refresh();
                } else {
                    toast.error("Failed to add coordinator");
                }
            }
            setIsCoordinatorModalOpen(false);
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDeleteCoordinator = async (id: string) => {
        if (!confirm("Delete this coordinator?")) return;
        try {
            const result = await deleteCoordinator(id);
            if (result.success) {
                toast.success("Coordinator deleted");
                router.refresh();
            } else {
                toast.error("Failed to delete coordinator");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl text-zinc-400">Manage Categories & Coordinators</h2>
                <button
                    onClick={() => openCategoryModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                    <FiPlus /> Add Category
                </button>
            </div>

            <div className="space-y-6">
                {categories.map((category) => (
                    <motion.div
                        key={category.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                    >
                        <div
                            className="p-4 bg-zinc-800/50 flex justify-between items-center cursor-pointer hover:bg-zinc-800 transition-colors"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <div className="flex items-center gap-3">
                                {expandedCategories.has(category.id) ? (
                                    <FiChevronUp className="text-zinc-500" />
                                ) : (
                                    <FiChevronDown className="text-zinc-500" />
                                )}
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                                    {category.name}
                                </h3>
                                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                                    Order: {category.order}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openCategoryModal(category);
                                    }}
                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                >
                                    <FiEdit2 />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.id);
                                    }}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                    <FiTrash2 />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openCoordinatorModal(category.id);
                                    }}
                                    className="ml-2 flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg"
                                >
                                    <FiPlus /> Add Person
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedCategories.has(category.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                        {category.coordinators.length === 0 ? (
                                            <p className="text-zinc-500 text-sm italic col-span-full text-center py-4">
                                                No coordinators added yet.
                                            </p>
                                        ) : (
                                            category.coordinators.map((coordinator) => (
                                                <div
                                                    key={coordinator.id}
                                                    className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 relative group"
                                                >
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openCoordinatorModal(category.id, coordinator)}
                                                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                                                        >
                                                            <FiEdit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCoordinator(coordinator.id)}
                                                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                                            <FiUser className="text-zinc-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white">{coordinator.name}</p>
                                                            <div className="mt-2 space-y-1">
                                                                <a
                                                                    href={`tel:${coordinator.phone}`}
                                                                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                                                                >
                                                                    <FiPhone size={12} /> {coordinator.phone}
                                                                </a>
                                                                <a
                                                                    href={`mailto:${coordinator.email}`}
                                                                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                                                                >
                                                                    <FiMail size={12} /> {coordinator.email}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Category Modal */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingCategory ? "Edit Category" : "New Category"}
                                </h3>
                                <button onClick={() => setIsCategoryModalOpen(false)}>
                                    <FiX className="text-zinc-500 hover:text-white" />
                                </button>
                            </div>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={categoryFormData.name}
                                        onChange={(e) =>
                                            setCategoryFormData({ ...categoryFormData, name: e.target.value })
                                        }
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={isNaN(categoryFormData.order) ? "" : categoryFormData.order}
                                        onChange={(e) =>
                                            setCategoryFormData({
                                                ...categoryFormData,
                                                order: parseInt(e.target.value),
                                            })
                                        }
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryModalOpen(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <FiSave /> Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Coordinator Modal */}
            <AnimatePresence>
                {isCoordinatorModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingCoordinator ? "Edit Coordinator" : "Add Coordinator"}
                                </h3>
                                <button onClick={() => setIsCoordinatorModalOpen(false)}>
                                    <FiX className="text-zinc-500 hover:text-white" />
                                </button>
                            </div>
                            <form onSubmit={handleCoordinatorSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={coordinatorFormData.name}
                                        onChange={(e) =>
                                            setCoordinatorFormData({
                                                ...coordinatorFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={coordinatorFormData.phone}
                                        onChange={(e) =>
                                            setCoordinatorFormData({
                                                ...coordinatorFormData,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={coordinatorFormData.email}
                                        onChange={(e) =>
                                            setCoordinatorFormData({
                                                ...coordinatorFormData,
                                                email: e.target.value,
                                            })
                                        }
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={isNaN(coordinatorFormData.order) ? "" : coordinatorFormData.order}
                                        onChange={(e) =>
                                            setCoordinatorFormData({
                                                ...coordinatorFormData,
                                                order: parseInt(e.target.value),
                                            })
                                        }
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsCoordinatorModalOpen(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <FiSave /> Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
