"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiUpload } from "react-icons/fi";
import { uploadCategoryImage } from "@/actions/upload.action";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
    image?: string;
    order: number;
    active?: boolean;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category?: string;
    order: number;
    active: boolean;
}

export default function ChatbotAdminPage() {
    const [activeTab, setActiveTab] = useState<'categories' | 'faqs'>('categories');

    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [categoryFormData, setCategoryFormData] = useState({
        name: "",
        image: "",
        order: 0
    });

    // FAQs state
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        category: "",
        order: 0,
        active: true
    });

    useEffect(() => {
        fetchCategories();
        fetchFAQs();
    }, []);

    // Category functions
    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/chatbot/categories');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSaveCategory = async () => {
        if (!categoryFormData.name.trim()) {
            alert('Category name is required!');
            return;
        }

        try {
            let imageUrl = categoryFormData.image || "";

            // Upload image if selected
            if (categoryImage) {
                // Validate file size (10MB max)
                if (categoryImage.size > 10 * 1024 * 1024) {
                    alert('Image size must be less than 10MB');
                    return;
                }

                setUploadingImage(true);
                const formData = new FormData();
                formData.append('file', categoryImage);
                const uploadResult = await uploadCategoryImage(formData);
                setUploadingImage(false);

                if (!uploadResult.success || !uploadResult.url) {
                    toast.error(uploadResult.error || 'Failed to upload image');
                    return;
                }
                imageUrl = uploadResult.url;
            }

            const url = '/api/chatbot/categories';
            const method = editingCategoryId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCategoryId ? {
                    id: editingCategoryId,
                    ...categoryFormData,
                    image: imageUrl
                } : {
                    ...categoryFormData,
                    image: imageUrl
                })
            });

            const data = await res.json();

            if (res.ok) {
                await fetchCategories();
                resetCategoryForm();
                toast.success(editingCategoryId ? 'Category updated!' : 'Category created!');
            } else {
                alert(data.error || 'Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const res = await fetch(`/api/chatbot/categories?id=${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (res.ok) {
                await fetchCategories();
            } else {
                alert(data.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategoryId(category.id);
        setCategoryFormData({
            name: category.name,
            image: category.image || "",
            order: category.order
        });
        setCategoryImage(null);
        setIsAddingCategory(true);
    };

    const resetCategoryForm = () => {
        setEditingCategoryId(null);
        setIsAddingCategory(false);
        setCategoryImage(null);
        setCategoryFormData({
            name: "",
            image: "",
            order: 0
        });
    };

    // FAQ functions
    const fetchFAQs = async () => {
        try {
            const res = await fetch('/api/chatbot/faqs');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFaqs(data);
            }
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
            alert('Question, Answer, and Category are required!');
            return;
        }

        try {
            const url = editingId ? '/api/chatbot/faqs' : '/api/chatbot/faqs';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData)
            });

            if (res.ok) {
                await fetchFAQs();
                resetForm();
            } else {
                alert('Failed to save FAQ');
            }
        } catch (error) {
            console.error('Error saving FAQ:', error);
            alert('Error saving FAQ');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            const res = await fetch(`/api/chatbot/faqs?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchFAQs();
            }
        } catch (error) {
            console.error('Error deleting FAQ:', error);
        }
    };

    const handleEdit = (faq: FAQ) => {
        setEditingId(faq.id);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || "",
            order: faq.order,
            active: faq.active
        });
        setIsAdding(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setIsAdding(false);
        setFormData({
            question: "",
            answer: "",
            category: "",
            order: 0,
            active: true
        });
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Chatbot Management</h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-zinc-800">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'categories'
                            ? 'text-red-500 border-b-2 border-red-500'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'faqs'
                            ? 'text-red-500 border-b-2 border-red-500'
                            : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        FAQs
                    </button>
                </div>

                {/* Categories Tab */}
                {activeTab === 'categories' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-zinc-400">Manage categories for organizing FAQs</p>
                            {!isAddingCategory && (
                                <button
                                    onClick={() => setIsAddingCategory(true)}
                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <FiPlus /> Add Category
                                </button>
                            )}
                        </div>

                        {/* Add/Edit Category Form */}
                        {isAddingCategory && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
                                <h2 className="text-xl font-bold mb-4">
                                    {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                                </h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm mb-2">Category Name *</label>
                                            <input
                                                type="text"
                                                value={categoryFormData.name}
                                                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                                                placeholder="e.g., Events, Registration"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-2">Order</label>
                                            <input
                                                type="number"
                                                value={categoryFormData.order === 0 ? '' : categoryFormData.order}
                                                onChange={(e) => setCategoryFormData({ ...categoryFormData, order: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2">
                                            Category Image (Optional)
                                            <span className="text-xs text-zinc-500 ml-2">Max 10MB</span>
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setCategoryImage(e.target.files?.[0] || null)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-sm"
                                        />
                                        {categoryFormData.image && !categoryImage && (
                                            <p className="text-xs text-green-500 mt-1">Current: {categoryFormData.image.substring(0, 50)}...</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveCategory}
                                            disabled={uploadingImage}
                                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <FiSave /> {uploadingImage ? 'Uploading...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={resetCategoryForm}
                                            disabled={uploadingImage}
                                            className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <FiX /> Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Categories List */}
                        <div className="space-y-3">
                            {categories.length === 0 ? (
                                <p className="text-center text-zinc-500 py-8">No categories yet. Add your first one!</p>
                            ) : (
                                categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center"
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold">{category.name}</h3>
                                            <p className="text-xs text-zinc-600">Order: {category.order}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="p-2 bg-red-600 hover:bg-red-700 rounded"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* FAQs Tab */}
                {activeTab === 'faqs' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-zinc-400">
                                {categories.length === 0 ? (
                                    <span className="text-yellow-500">⚠️ Please create categories first</span>
                                ) : (
                                    'Manage FAQ questions and answers'
                                )}
                            </p>
                            {!isAdding && categories.length > 0 && (
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <FiPlus /> Add FAQ
                                </button>
                            )}
                        </div>

                        {/* Add/Edit FAQ Form */}
                        {isAdding && (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
                                <h2 className="text-xl font-bold mb-4">
                                    {editingId ? 'Edit FAQ' : 'Add New FAQ'}
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm mb-2">Question *</label>
                                        <input
                                            type="text"
                                            value={formData.question}
                                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                                            placeholder="Enter question..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2">Answer *</label>
                                        <textarea
                                            value={formData.answer}
                                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 h-32"
                                            placeholder="Enter answer..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm mb-2">
                                                Category <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                                                required
                                            >
                                                <option value="">Select category...</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-2">Order</label>
                                            <input
                                                type="number"
                                                value={formData.order === 0 ? '' : formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-2">Status</label>
                                            <select
                                                value={formData.active ? "active" : "inactive"}
                                                onChange={(e) => setFormData({ ...formData, active: e.target.value === "active" })}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
                                        >
                                            <FiSave /> Save
                                        </button>
                                        <button
                                            onClick={resetForm}
                                            className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded flex items-center gap-2"
                                        >
                                            <FiX /> Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FAQ List */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-center text-zinc-500">Loading...</p>
                            ) : faqs.length === 0 ? (
                                <p className="text-center text-zinc-500">No FAQs yet. Add your first one!</p>
                            ) : (
                                faqs.map((faq) => (
                                    <div
                                        key={faq.id}
                                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                                                    <span className={`text-xs px-2 py-1 rounded ${faq.active ? 'bg-green-900 text-green-300' : 'bg-zinc-700 text-zinc-400'}`}>
                                                        {faq.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {faq.category && (
                                                        <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">
                                                            {faq.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-zinc-400 whitespace-pre-wrap">{faq.answer}</p>
                                                <p className="text-xs text-zinc-600 mt-2">Order: {faq.order}</p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleEdit(faq)}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(faq.id)}
                                                    className="p-2 bg-red-600 hover:bg-red-700 rounded"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
