"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteEvent,
} from "@/actions/events.action";
import { uploadCategoryImage } from "@/actions/upload.action";
import { createSchedule, getSchedules, deleteSchedule } from "@/actions/schedule.action";
import MultiStepEventForm from "@/components/ui/MultiStepEventForm";

interface Event {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  date: string | Date;
  image: string;
  venue: string;
  startTime: string;
  endTime: string;
  participantLimit: number;
  termsandconditions: string;
  registrationLink: string;
  isGroupEvent: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  createdAt?: Date;
  updatedAt?: Date;
  registeredStudents?: Array<{
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    collage: string | null;
  }>;
}

interface Category {
  id: string;
  name: string;
  image?: string | null;
  video?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  Event: Event[];
}

interface Schedule {
  id: string;
  image: string;
}

export default function EventsManagement() {
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [categoryName, setCategoryName] = useState("");
  const [categoryVideo, setCategoryVideo] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [uploadingCategory, setUploadingCategory] = useState(false);

  // Event deletion modal states
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  // Registrations modal states
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] =
    useState<Event | null>(null);

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Schedule modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleImage, setScheduleImage] = useState<File | null>(null);
  const [scheduleImagePreview, setScheduleImagePreview] = useState("");
  const [uploadingSchedule, setUploadingSchedule] = useState(false);

  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchCategoriesWithEvents();
  }, []);

  const fetchCategoriesWithEvents = async () => {
    setLoading(true);
    const result = await getCategories();
    if (result.success && result.data) {
      setCategories(result.data);
    } else {
      toast.error(result.error || "Failed to fetch categories");
    }
    setLoading(false);
  };

  const fetchSchedules = async () => {
    const result = await getSchedules();
    if (result.success && result.data) {
      setSchedules(result.data);
    }
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showCategoryModal || showDeleteCategoryModal || showScheduleModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCategoryModal, showDeleteCategoryModal, showScheduleModal]);

  const handleScheduleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScheduleImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScheduleImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleImage) return;

    setUploadingSchedule(true);
    setStatusMessage("Uploading to Storage...");
    try {
      const formData = new FormData();
      formData.append("file", scheduleImage);
      const uploadResult = await uploadCategoryImage(formData);

      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || "Failed to upload image");
        setUploadingSchedule(false);
        setStatusMessage("");
        return;
      }

      setStatusMessage("Saving to Database...");
      const result = await createSchedule(uploadResult.url);
      if (result.success) {
        toast.success("Schedule uploaded successfully");
        setScheduleImage(null);
        setScheduleImagePreview("");
        fetchSchedules();
      } else {
        toast.error(result.error || "Failed to create schedule entry");
      }
    } catch (error) {
      toast.error("An error occurred while uploading schedule");
    } finally {
      setUploadingSchedule(false);
      setStatusMessage("");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const result = await deleteSchedule(id);
    if (result.success) {
      toast.success("Schedule deleted successfully");
      fetchSchedules();
    } else {
      toast.error(result.error || "Failed to delete schedule");
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCategoryImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // ... (existing helper functions)

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      let imageUrl: string | undefined = editingCategory?.image || undefined;

      // Upload image if selected
      if (categoryImage) {
        setUploadingCategory(true);
        const formData = new FormData();
        formData.append("file", categoryImage);
        const uploadResult = await uploadCategoryImage(formData);
        setUploadingCategory(false);

        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload image");
          return;
        }
        imageUrl = uploadResult.url;
      }

      let result;
      if (editingCategory) {
        result = await updateCategory(editingCategory.id, categoryName, imageUrl, categoryVideo);
      } else {
        result = await createCategory(categoryName, imageUrl, categoryVideo);
      }

      if (result.success) {
        toast.success(editingCategory ? "Category updated successfully" : "Category created successfully");
        setCategoryName("");
        setCategoryVideo("");
        setCategoryImage(null);
        setCategoryImagePreview("");
        setEditingCategory(null);
        setShowCategoryModal(false);
        fetchCategoriesWithEvents();
      } else {
        toast.error(result.error || `Failed to ${editingCategory ? "update" : "create"} category`);
      }
    } catch (error) {
      toast.error(`An error occurred while ${editingCategory ? "updating" : "creating"} category`);
      setUploadingCategory(false);
    }
  };

  const startEditingCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryVideo(category.video || "");
    setCategoryImagePreview(category.image || "");
    setShowCategoryModal(true);
  };

  const handleEventFormSuccess = () => {
    fetchCategoriesWithEvents();
  };

  const handleEventFormClose = () => {
    setShowEventForm(false);
    setSelectedCategoryId("");
    setEditingEvent(null);
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  const confirmDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteEventModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    const result = await deleteCategory(categoryToDelete.id);
    if (result.success) {
      toast.success("Category deleted successfully");
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      fetchCategoriesWithEvents();
    } else {
      toast.error(result.error || "Failed to delete category");
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    const result = await deleteEvent(eventToDelete.id);
    if (result.success) {
      toast.success("Event deleted successfully");
      setShowDeleteEventModal(false);
      setEventToDelete(null);
      fetchCategoriesWithEvents();
    } else {
      toast.error(result.error || "Failed to delete event");
    }
  };

  const openEventForm = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const startEditingEvent = (event: Event) => {
    setEditingEvent(event);
    setSelectedCategoryId(event.categoryId);
    setShowEventForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <div className="text-white text-xl">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black px-3 sm:px-4 py-6 pt-24 sm:pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Events Management
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base">
            Manage categories and events for Surabhi 2025
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCategoryModal(true)}
            className="flex-1 sm:flex-none justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Category
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowScheduleModal(true);
              fetchSchedules();
            }}
            className="flex-1 sm:flex-none justify-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Manage Schedule
          </motion.button>
        </div>
      </div>

      {/* Categories with nested events - Branch Structure */}
      <div className="space-y-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-red-600/30 transition-all"
          >
            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-800/50 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleCategory(category.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedCategories.has(category.id) ? "rotate-90" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.button>
                {(category.image || category.Event[0]?.image) && (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 shrink-0 relative">
                    <Image
                      src={category.image || category.Event[0]?.image || ""}
                      alt={category.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    {category.name}
                  </h2>
                  <p className="text-zinc-400 text-xs sm:text-sm">
                    {category.Event.length} event(s)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-9 sm:pl-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openEventForm(category.id)}
                  className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 shadow-lg shadow-red-600/20"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Event
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startEditingCategory(category)}
                  className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs sm:text-sm transition-colors flex items-center gap-1 shadow-lg shadow-black/20"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => confirmDeleteCategory(category)}
                  className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm transition-colors"
                >
                  Delete
                </motion.button>
              </div>
            </div>

            {/* Events List (shown when expanded) */}
            {expandedCategories.has(category.id) && (
              <div className="p-3 sm:p-4 space-y-3 bg-zinc-900">
                {category.Event.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">
                    No events in this category yet
                  </p>
                ) : (
                  category.Event.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 sm:p-4 bg-zinc-800 rounded-lg border-l-4 border-red-600 hover:bg-zinc-700/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        {/* Event Image */}
                        <div className="shrink-0 w-full sm:w-auto">
                          <div className="w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 relative">
                            <Image
                              src={event.image || "https://via.placeholder.com/128x128?text=No+Image"}
                              alt={event.name || "Event Image"}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="text-white font-semibold text-lg">
                            {event.name}
                          </h3>
                          <p className="text-zinc-300 mt-2 text-sm line-clamp-2">
                            {event.description}
                          </p>
                          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-zinc-400">Date:</span>
                              <p className="text-white">
                                {new Date(event.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-400">Time:</span>
                              <p className="text-white">
                                {event.startTime} - {event.endTime}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-400">Venue:</span>
                              <p className="text-white">{event.venue}</p>
                            </div>
                            <div>
                              <span className="text-zinc-400">Limit:</span>
                              <p className="text-white">
                                {event.participantLimit} participants
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedEventForRegistrations(event);
                              setShowRegistrationsModal(true);
                            }}
                            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors whitespace-nowrap flex items-center gap-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            <span className="sm:hidden lg:inline">Registrations</span>
                            <span className="hidden sm:inline lg:hidden">Regs</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startEditingEvent(event)}
                            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors whitespace-nowrap"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => confirmDeleteEvent(event)}
                            className="flex-1 sm:flex-none justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors whitespace-nowrap"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-zinc-400 text-lg">
              No categories yet. Click "Add Category" to get started.
            </p>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-800 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h2>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-zinc-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-zinc-300 mb-2">
                  Category Video Link (YouTube)
                </label>
                <input
                  type="text"
                  value={categoryVideo}
                  onChange={(e) => setCategoryVideo(e.target.value)}
                  placeholder="e.g., https://youtube.com/..."
                  className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>
              <div className="mb-4">
                <label className="block text-zinc-300 mb-2">
                  Category Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryImageSelect}
                  className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
                />
                {categoryImagePreview && (
                  <div className="mt-3 relative w-full h-32 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700">
                    <img
                      src={categoryImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryImage(null);
                        setCategoryImagePreview("");
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryName("");
                    setCategoryVideo("");
                    setCategoryImage(null);
                    setCategoryImagePreview("");
                    setEditingCategory(null);
                  }}
                  disabled={uploadingCategory}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingCategory}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingCategory ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    editingCategory ? "Update" : "Create"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-800 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-zinc-300 mb-6">
              Are you sure you want to delete the category{" "}
              <span className="font-semibold text-white">
                "{categoryToDelete.name}"
              </span>
              ?
              {categoryToDelete.Event.length > 0 && (
                <span className="block mt-2 text-red-400 font-medium">
                  ⚠️ This category has {categoryToDelete.Event.length} event(s)
                  and cannot be deleted.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteCategoryModal(false);
                  setCategoryToDelete(null);
                }}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              {categoryToDelete.Event.length === 0 && (
                <button
                  onClick={handleDeleteCategory}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteEventModal && eventToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-800 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-zinc-300 mb-6">
              Are you sure you want to delete the event{" "}
              <span className="font-semibold text-white">
                "{eventToDelete.name}"
              </span>
              ?
              <span className="block mt-2 text-zinc-400 text-sm">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteEventModal(false);
                  setEventToDelete(null);
                }}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEventForRegistrations && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl w-full max-w-4xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Event Registrations
                </h2>
                <p className="text-zinc-400 mt-1">
                  {selectedEventForRegistrations.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedEventForRegistrations(null);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="px-8 py-6 overflow-y-auto flex-1">
              {selectedEventForRegistrations.registeredStudents &&
                selectedEventForRegistrations.registeredStudents.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-zinc-400">
                      Total Registrations:{" "}
                      <span className="text-white font-semibold">
                        {
                          selectedEventForRegistrations.registeredStudents
                            .length
                        }
                      </span>{" "}
                      / {selectedEventForRegistrations.participantLimit}
                    </p>
                  </div>

                  {/* Students List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEventForRegistrations.registeredStudents.map(
                      (student: any, index: number) => (
                        <div
                          key={student.id}
                          className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-red-600/50 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-semibold">
                                {student.name || "No name"}
                              </h4>
                              <p className="text-zinc-400 text-sm truncate">
                                {student.email}
                              </p>
                              {student.phone && (
                                <p className="text-zinc-400 text-sm mt-1">
                                  {student.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-400">No registrations yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl w-full max-w-4xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-bold text-white">Manage Schedule</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 py-6 overflow-y-auto flex-1">
              {/* Upload Form */}
              <div className="mb-8 bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-4">Add New Schedule Image</h3>
                <form onSubmit={handleUploadSchedule}>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-zinc-400 mb-2 text-sm">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScheduleImageSelect}
                        className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!scheduleImage || uploadingSchedule}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploadingSchedule ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
                    </button>
                  </div>
                  {scheduleImagePreview && (
                    <div className="mt-4 w-full h-48 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700 relative">
                      <img src={scheduleImagePreview} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </form>
              </div>

              {/* Existing Schedules */}
              <h3 className="text-lg font-semibold text-white mb-4">Current Schedules</h3>
              {schedules.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No schedule images uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden group relative">
                      <div className="aspect-[3/4] relative">
                        <Image
                          src={schedule.image}
                          alt="Schedule"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Multi-Step Event Form Modal */}
      {showEventForm && (
        <MultiStepEventForm
          categoryId={selectedCategoryId}
          editingEvent={editingEvent}
          onClose={handleEventFormClose}
          onSuccess={handleEventFormSuccess}
        />
      )}
    </div>
  );
}
