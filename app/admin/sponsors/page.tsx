"use client";

import { useEffect, useState } from "react";
import { getAllSponsors, createSponsor, updateSponsor, deleteSponsor, uploadSponsorImage } from "@/actions/admin/sponsors.action";
import { toast } from "sonner";
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

interface Sponsor {
    id: string;
    name: string;
    description: string;
    amount: number;
    image?: string | null;
    website?: string | null;
    borderColor: string;
    gradient: string;
    order: number;
    isActive: boolean;
}

export default function AdminSponsorsPage() {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        amount: 0,
        image: "",
        website: "",
        borderColor: "#dc2626",
        gradient: "linear-gradient(145deg,#dc2626,#000)",
        order: 0,
    });

    useEffect(() => {
        loadSponsors();
    }, []);

    const loadSponsors = async () => {
        setLoading(true);
        const result = await getAllSponsors();
        if (result.success) {
            setSponsors(result.sponsors || []);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSponsor) {
            const result = await updateSponsor(editingSponsor.id, formData);
            if (result.success) {
                toast.success(result.message);
                loadSponsors();
                closeModal();
            } else {
                toast.error(result.error);
            }
        } else {
            const result = await createSponsor(formData);
            if (result.success) {
                toast.success(result.message);
                loadSponsors();
                closeModal();
            } else {
                toast.error(result.error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this sponsor?")) return;

        const result = await deleteSponsor(id);
        if (result.success) {
            toast.success(result.message);
            loadSponsors();
        } else {
            toast.error(result.error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadSponsorImage(formData);
        if (result.success) {
            setFormData(prev => ({ ...prev, image: result.url! }));
            toast.success("Image uploaded successfully");
        } else {
            toast.error(result.error);
        }
        setUploading(false);
    };

    const openModal = (sponsor?: Sponsor) => {
        if (sponsor) {
            setEditingSponsor(sponsor);
            setFormData({
                name: sponsor.name,
                description: sponsor.description,
                amount: sponsor.amount,
                image: sponsor.image || "",
                website: sponsor.website || "",
                borderColor: sponsor.borderColor,
                gradient: sponsor.gradient,
                order: sponsor.order,
            });
        } else {
            setEditingSponsor(null);
            setFormData({
                name: "",
                description: "",
                amount: 0,
                image: "",
                website: "",
                borderColor: "#dc2626",
                gradient: "linear-gradient(145deg,#dc2626,#000)",
                order: 0,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSponsor(null);
    };

    return (
        <div className="px-4 py-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Sponsors Management</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                    <FiPlus /> Add Sponsor
                </button>
            </div>

            {/* Sponsors Table */}
            {loading ? (
                <div className="text-center text-white py-12">Loading...</div>
            ) : sponsors.length === 0 ? (
                <div className="text-center text-gray-400 py-12 bg-gray-800 rounded-lg border border-gray-700">
                    No sponsors found. Add your first sponsor!
                </div>
            ) : (
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Image</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Order</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {sponsors.map((sponsor) => (
                                    <tr key={sponsor.id} className="hover:bg-gray-700/50">
                                        <td className="px-4 py-4">
                                            {sponsor.image ? (
                                                <img src={sponsor.image} alt={sponsor.name} className="w-16 h-16 object-cover rounded" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs">
                                                    No Image
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-white font-semibold">{sponsor.name}</td>
                                        <td className="px-4 py-4 text-gray-300 max-w-xs truncate">{sponsor.description}</td>
                                        <td className="px-4 py-4 text-green-400 font-semibold">
                                            ₹{sponsor.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-4 text-gray-300">{sponsor.order}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(sponsor)}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sponsor.id)}
                                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">
                                        {editingSponsor ? "Edit Sponsor" : "Add Sponsor"}
                                    </h2>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-white">
                                        <FiX size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                                        <textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Amount (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md cursor-pointer transition-colors"
                                            >
                                                <FiUpload /> {uploading ? "Uploading..." : "Upload Image"}
                                            </label>
                                            {formData.image && (
                                                <img src={formData.image} alt="Preview" className="w-16 h-16 object-cover rounded" />
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                                            placeholder="https://example.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Border Color</label>
                                            <input
                                                type="color"
                                                value={formData.borderColor}
                                                onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                                                className="w-full h-10 bg-gray-700 rounded-md border border-gray-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                                            <input
                                                type="number"
                                                value={formData.order}
                                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                                className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                        >
                                            {editingSponsor ? "Update Sponsor" : "Create Sponsor"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
