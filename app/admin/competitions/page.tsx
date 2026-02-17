"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  deleteEvent,
  deleteRegistration,
} from "@/actions/events.action";
import { uploadCategoryImage } from "@/actions/upload.action";
import { useSession } from "@/lib/auth-client";
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
  whatsappLink?: string | null;
  brochureLink?: string | null;
  isGroupEvent: boolean;
  allowSubmissions?: boolean;
  virtualEnabled?: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  createdAt?: Date;
  updatedAt?: Date;
  individualRegistrations?: Array<{
    paymentStatus?: string;
    isVirtual?: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      collage: string | null;
      branch: string | null;
      year: number | null;
      collageId: string | null;
      isInternational?: boolean;
      country?: string | null;
    };
  }>;
  submissions?: Array<{
    id: string;
    userId: string;
    submissionLink: string;
    youtubeChannelName: string | null;
    notes: string | null;
    updatedAt?: Date;
    user?: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  groupRegistrations?: Array<{
    id: string;
    groupName: string | null;
    mentorName: string | null;
    mentorPhone: string | null;
    members: any; // key-value JSON
    registrationDetails?: Record<string, any> | null;
    paymentStatus?: string;
    isVirtual?: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      collage: string | null;
      collageId: string | null;
      state: string | null;
      city: string | null;
      isInternational?: boolean;
      country?: string | null;
    };
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
  const { data: session } = useSession();
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

  // Student Details Modal State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);

  // Group Details Modal State
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);

  // Event Registrations modal tab: KL University | Other College | International
  const [registrationsTab, setRegistrationsTab] = useState<"kl" | "other" | "international">("kl");

  // Submissions modal state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedEventForSubmissions, setSelectedEventForSubmissions] = useState<Event | null>(null);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  const getSubmissionForStudent = (studentId: string) => {
    if (!selectedEventForRegistrations?.submissions) return null;
    return selectedEventForRegistrations.submissions.find(
      (s) => s.userId === studentId
    );
  };

  useEffect(() => {
    fetchCategoriesWithEvents();
  }, []);

  useEffect(() => {
    if (showRegistrationsModal && selectedEventForRegistrations) {
      setRegistrationsTab("kl");
    }
  }, [showRegistrationsModal, selectedEventForRegistrations?.id]);

  const fetchCategoriesWithEvents = async () => {
    setLoading(true);
    try {
      const result = await getCategories(true);
      if (result.success && result.data) {
        const data = result.data as Category[];
        setCategories(data);
        // Update selected event if open
        if (selectedEventForRegistrations) {
          const updatedCategory = data.find((c: Category) => c.Event.some((e: Event) => e.id === selectedEventForRegistrations.id));
          const updatedEvent = updatedCategory?.Event.find((e: Event) => e.id === selectedEventForRegistrations.id);
          if (updatedEvent) setSelectedEventForRegistrations(updatedEvent);
        }
        if (selectedEventForSubmissions) {
          const updatedCategory = data.find((c: Category) => c.Event.some((e: Event) => e.id === selectedEventForSubmissions.id));
          const updatedEvent = updatedCategory?.Event.find((e: Event) => e.id === selectedEventForSubmissions.id);
          if (updatedEvent) setSelectedEventForSubmissions(updatedEvent);
        }
        return data;
      } else if (!result.success) {
        toast.error(result.error || "Failed to fetch categories");
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  const handleDeleteRegistration = async (id: string, type: "INDIVIDUAL" | "GROUP") => {
    if (!confirm("Are you sure you want to delete this registration? This action cannot be undone.")) return;

    toast.loading("Deleting registration...");
    const result = await deleteRegistration(id, type);
    toast.dismiss();

    if (result.success) {
      toast.success("Registration deleted");
      fetchCategoriesWithEvents();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const fetchSchedules = async () => {
    const result = await getSchedules();
    if (result.success && result.data) {
      setSchedules(result.data);
    }
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (
      showCategoryModal ||
      showDeleteCategoryModal ||
      showScheduleModal ||
      showDeleteEventModal ||
      showRegistrationsModal ||
      showSubmissionsModal ||
      showEventForm ||
      showStudentDetailsModal ||
      showGroupDetailsModal
    ) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [
    showCategoryModal,
    showDeleteCategoryModal,
    showScheduleModal,
    showDeleteEventModal,
    showRegistrationsModal,
    showSubmissionsModal,
    showEventForm,
    showStudentDetailsModal,
    showGroupDetailsModal,
  ]);

  const handleScheduleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 10MB.");
        e.target.value = "";
        return;
      }
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 10MB.");
        e.target.value = "";
        return;
      }
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
      toast.success(result.message ?? "Category deleted successfully");
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
      toast.success(result.message ?? "Event deleted successfully");
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
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="text-zinc-400 hover:text-red-500 transition-colors p-1">
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
                </div>
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
              <div 
                className="flex flex-wrap gap-2 pl-9 sm:pl-0"
                onClick={(e) => e.stopPropagation()}
              >
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-semibold text-lg">
                              {event.name}
                            </h3>
                            {event.virtualEnabled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/50">
                                Virtual Enabled
                              </span>
                            )}
                          </div>
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
                          {event.allowSubmissions && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={async () => {
                                const data = await fetchCategoriesWithEvents();
                                const updatedCategory = data?.find((c: Category) =>
                                  c.Event.some((e: Event) => e.id === event.id)
                                );
                                const updatedEvent = updatedCategory?.Event.find((e: Event) => e.id === event.id) ?? event;
                                setSelectedEventForSubmissions(updatedEvent);
                                setShowSubmissionsModal(true);
                              }}
                              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors whitespace-nowrap flex items-center gap-1"
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
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              <span className="sm:hidden lg:inline">Submissions</span>
                              <span className="hidden sm:inline lg:hidden">Subs</span>
                            </motion.button>
                          )}
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
                  {selectedEventForRegistrations.isGroupEvent && <span className="ml-2 bg-red-600/20 text-red-500 text-xs px-2 py-0.5 rounded font-bold uppercase">Group Event</span>}
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

            {/* Tabs: KL University | Other College | International */}
            <div className="px-8 pt-4 pb-2 border-b border-zinc-800 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setRegistrationsTab("kl")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${registrationsTab === "kl"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    }`}
                >
                  KL University
                </button>
                <button
                  onClick={() => setRegistrationsTab("other")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${registrationsTab === "other"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    }`}
                >
                  Other College
                </button>
                <button
                  onClick={() => setRegistrationsTab("international")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${registrationsTab === "international"
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    }`}
                >
                  International / Virtual
                </button>
              </div>
            </div>

            {/* Content - Scrollable (data-lenis-prevent enables native trackpad scroll) */}
            <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0" data-lenis-prevent>
              {(() => {
                // Only show registrations that have been approved (payment approved in Registrations Management)
                const allGroupRegs = selectedEventForRegistrations.groupRegistrations || [];
                const allIndividualRegs = selectedEventForRegistrations.individualRegistrations || [];
                const groupRegistrations = allGroupRegs.filter((g: any) => g.paymentStatus === "APPROVED");
                const individualRegistrations = allIndividualRegs.filter((r: any) => r.paymentStatus === "APPROVED");

                // Filter out students who are team leads (already in groupRegistrations)
                const teamLeadIds = new Set(groupRegistrations.map(g => g.user.id));
                const soloStudents = individualRegistrations.filter(reg => !teamLeadIds.has(reg.user.id));

                const isInternational = (user: any) => !!user?.isInternational;
                const isKLStudent = (user: any) => {
                  return (
                    user.email?.toLowerCase().endsWith("@kluniversity.in") ||
                    user.collage?.toLowerCase().includes("kl university") ||
                    user.collage?.toLowerCase().includes("koneru") ||
                    user.collage?.toLowerCase().includes("klef") ||
                    user.collage?.toLowerCase() === "kl" ||
                    user.collage?.toLowerCase().startsWith("kl ") ||
                    user.collage?.toLowerCase().endsWith(" kl") ||
                    user.collage?.toLowerCase().includes(" kl ") ||
                    user.collage?.toLowerCase().includes("k l university") ||
                    user.collage?.toLowerCase().includes("k.l. university")
                  );
                };

                // Split: International (virtual), domestic KL vs Other
                const internationalGroups = groupRegistrations.filter(g => isInternational(g.user));
                const internationalSolo = soloStudents.filter(s => isInternational(s.user));
                const domesticGroups = groupRegistrations.filter(g => !isInternational(g.user));
                const domesticSolo = soloStudents.filter(s => !isInternational(s.user));

                const klGroups = domesticGroups.filter(g => isKLStudent(g.user));
                const otherGroups = domesticGroups.filter(g => !isKLStudent(g.user));
                const klSolo = domesticSolo.filter(s => isKLStudent(s.user));
                const otherSolo = domesticSolo.filter(s => !isKLStudent(s.user));

                const hasInternational = internationalGroups.length > 0 || internationalSolo.length > 0;
                const hasKL = klGroups.length > 0 || klSolo.length > 0;
                const hasOther = otherGroups.length > 0 || otherSolo.length > 0;

                if (!hasKL && !hasOther && !hasInternational) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-zinc-400">No registrations yet</p>
                    </div>
                  );
                }

                const groupsForTab = registrationsTab === "kl" ? klGroups : registrationsTab === "other" ? otherGroups : internationalGroups;
                const soloForTab = registrationsTab === "kl" ? klSolo : registrationsTab === "other" ? otherSolo : internationalSolo;

                const renderRegistrationContent = () => {
                  if (groupsForTab.length === 0 && soloForTab.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-zinc-400">
                          No registrations in {registrationsTab === "kl" ? "KL University" : registrationsTab === "other" ? "Other College" : "International / Virtual"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      {/* Group Registrations */}
                      {groupsForTab.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              Group Registrations
                            </h3>
                            <p className="text-zinc-400 text-sm">
                              Total Teams: <span className="text-white font-semibold">{groupsForTab.length}</span>
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {groupsForTab.map((group: any, index: number) => {
                              const isVirtual = !!group.isVirtual || !!group.user?.isInternational;
                              return (
                                <div
                                  key={group.id}
                                  onClick={() => {
                                    setSelectedGroup(group);
                                    setShowGroupDetailsModal(true);
                                  }}
                                  className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-red-600/50 transition-all cursor-pointer group hover:bg-zinc-800/80"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 font-bold">
                                        {index + 1}
                                      </div>
                                      <div>
                                        <h4 className="text-white font-bold text-lg flex items-center gap-2 flex-wrap">
                                          {group.groupName}
                                          {isVirtual && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">
                                              Virtual Participation
                                            </span>
                                          )}
                                        </h4>
                                        <p className="text-zinc-400 text-sm flex items-center gap-2 flex-wrap mt-1">
                                          <span className="bg-zinc-700/50 px-2 py-0.5 rounded text-xs text-zinc-300">Lead: {group.user.name}</span>
                                          {group.user.isInternational && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">
                                              International
                                            </span>
                                          )}
                                          <span className="text-zinc-500">•</span>
                                          <span>{group.members ? (group.members as any[]).length + 1 : 1} Members</span>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-red-500 text-sm group-hover:underline">View Details &rarr;</span>
                                      {session?.user.role === "MASTER" && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRegistration(group.id, "GROUP");
                                          }}
                                          className="text-zinc-500 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                                          title="Delete Registration"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Individual Registrations */}
                      {soloForTab.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Individual Registrations
                            </h3>
                            <p className="text-zinc-400 text-sm">
                              Count: <span className="text-white font-semibold">{soloForTab.length}</span>
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {soloForTab.map((reg: any, index: number) => {
                              const student = reg.user;
                              const isVirtual = !!reg.isVirtual || !!student.isInternational;
                              return (
                                <div
                                  key={student.id}
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowStudentDetailsModal(true);
                                  }}
                                  className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 hover:border-red-600/50 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-semibold flex items-center gap-2 flex-wrap">
                                        {student.name || "No name"}
                                        {isVirtual && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-700/50">
                                            Virtual Participation
                                          </span>
                                        )}
                                        {getSubmissionForStudent(student.id) && (
                                          <span title="Submission Available" className="text-green-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                          </span>
                                        )}
                                      </h4>
                                      <p className="text-zinc-400 text-sm truncate">{student.email}</p>
                                      {student.phone && (
                                        <p className="text-zinc-400 text-sm mt-1">{student.phone}</p>
                                      )}
                                    </div>
                                    {session?.user.role === "MASTER" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteRegistration(reg.id, "INDIVIDUAL");
                                        }}
                                        className="text-zinc-500 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                                        title="Delete Registration"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                };

                return renderRegistrationContent();
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedEventForSubmissions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000000] p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-xl w-full max-w-4xl border border-zinc-800 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Event Submissions</h2>
                <p className="text-zinc-400 mt-1">
                  {selectedEventForSubmissions.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const data = await fetchCategoriesWithEvents();
                    const updatedCategory = data?.find((c: Category) =>
                      c.Event.some((e: Event) => e.id === selectedEventForSubmissions.id)
                    );
                    const updatedEvent = updatedCategory?.Event.find((e: Event) => e.id === selectedEventForSubmissions.id);
                    if (updatedEvent) setSelectedEventForSubmissions(updatedEvent);
                    toast.success("Submissions refreshed");
                  }}
                  className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setShowSubmissionsModal(false);
                    setSelectedEventForSubmissions(null);
                    setExpandedSubmissionId(null);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0" data-lenis-prevent>
              {(() => {
                const submissions = selectedEventForSubmissions.submissions || [];
                if (submissions.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-zinc-400">No submissions yet</p>
                      <p className="text-zinc-500 text-sm mt-1">Participants can submit their work from My Competitions or Profile.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                      <h3 className="text-white font-bold text-lg">
                        {submissions.length} Submission{submissions.length !== 1 ? "s" : ""}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {submissions.map((sub: any, index: number) => {
                        const participant = sub.user;
                        const groupReg = selectedEventForSubmissions.groupRegistrations?.find(
                          (g: any) => g.user.id === sub.userId
                        );
                        const isTeamSubmission = !!groupReg;
                        const memberList = groupReg?.members
                          ? (Array.isArray(groupReg.members) ? groupReg.members : Object.values(groupReg.members))
                          : [];
                        const totalMembers = memberList.length + 1; // +1 for lead
                        const isExpanded = expandedSubmissionId === sub.id;

                        return (
                          <div
                            key={sub.id}
                            className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden"
                          >
                            {/* Collapsed header - click to expand/collapse */}
                            <button
                              type="button"
                              onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                              className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-zinc-800/80 transition-colors"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-500 font-bold shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-bold text-lg">
                                    {isTeamSubmission ? (groupReg.groupName || "Unnamed Team") : (participant?.name || "Unknown")}
                                  </h4>
                                  <p className="text-zinc-400 text-sm flex items-center gap-2 flex-wrap mt-1">
                                    <span className="bg-zinc-700/50 px-2 py-0.5 rounded text-xs text-zinc-300">
                                      Lead: {participant?.name || "Unknown"}
                                    </span>
                                    {isTeamSubmission && (
                                      <>
                                        <span className="text-zinc-500">•</span>
                                        <span>{totalMembers} Members</span>
                                      </>
                                    )}
                                    <span className="text-zinc-500">•</span>
                                    <span className="text-zinc-400 truncate">{participant?.email}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-emerald-400 text-sm font-medium">
                                  {isExpanded ? "Hide" : "View Submission"}
                                </span>
                                <motion.svg
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-5 h-5 text-zinc-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </motion.svg>
                              </div>
                            </button>

                            {/* Expanded content - full details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-0 space-y-4 border-t border-zinc-700">
                                    {/* Submission details */}
                                    <div className="pl-4 ml-2 space-y-2 text-sm border-l-2 border-emerald-600/30 pt-4">
                                      <h5 className="text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2">Submission Details</h5>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-zinc-500">Video:</span>
                                        <a
                                          href={sub.submissionLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-400 hover:text-emerald-300 break-all"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {sub.submissionLink}
                                        </a>
                                      </div>
                                      {sub.youtubeChannelName && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-zinc-500">Channel:</span>
                                          <span className="text-zinc-300">{sub.youtubeChannelName}</span>
                                        </div>
                                      )}
                                      {sub.notes && (
                                        <div>
                                          <span className="text-zinc-500">Notes:</span>
                                          <p className="text-zinc-300 mt-0.5">{sub.notes}</p>
                                        </div>
                                      )}
                                      {sub.updatedAt && (
                                        <div className="text-zinc-500 text-xs">
                                          Updated: {new Date(sub.updatedAt).toLocaleString()}
                                        </div>
                                      )}
                                    </div>

                                    {/* Team member details - for group submissions */}
                                    {isTeamSubmission && (memberList.length > 0 || totalMembers > 0) && (
                                      <div className="pl-4">
                                        <h5 className="text-zinc-400 font-semibold text-xs uppercase tracking-wider mb-3">Team Members</h5>
                                        <div className="space-y-2">
                                          <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">1</div>
                                            <div>
                                              <p className="text-white font-medium">{participant?.name || "Unknown"} (Lead)</p>
                                              <p className="text-xs text-zinc-400">{participant?.email}</p>
                                            </div>
                                          </div>
                                          {memberList.map((member: any, idx: number) => (
                                            <div key={idx} className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700 flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm shrink-0">{idx + 2}</div>
                                              <div>
                                                <p className="text-white font-medium">{member.name || "Unknown"}</p>
                                                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-zinc-400 mt-0.5">
                                                  {member.email && <span>{member.email}</span>}
                                                  {member.phone && <><span>•</span><span>{member.phone}</span></>}
                                                  {member.gender && <><span>•</span><span>{member.gender}</span></>}
                                                </div>
                                                {(member.inGameName || member.inGameId || member.riotId) && (
                                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-amber-400/90 mt-1.5">
                                                    {member.inGameName && <span>IGN: {member.inGameName}</span>}
                                                    {member.inGameId && <span>ID: {member.inGameId}</span>}
                                                    {member.riotId && <span>Riot: {member.riotId}</span>}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Schedule Management Modal */}
      {
        showScheduleModal && (
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

              <div className="px-8 py-6 overflow-y-auto flex-1 min-h-0" data-lenis-prevent>
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
        )
      }
      {/* Multi-Step Event Form Modal */}
      {
        showEventForm && (
          <MultiStepEventForm
            categoryId={selectedCategoryId}
            editingEvent={editingEvent}
            onClose={handleEventFormClose}
            onSuccess={handleEventFormSuccess}
          />
        )
      }
      {/* Student Details Modal */}
      {
        showStudentDetailsModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onWheel={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-xl w-full max-w-lg border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Student Details</h2>
                <button
                  onClick={() => {
                    setShowStudentDetailsModal(false);
                    setSelectedStudent(null);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain" data-lenis-prevent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 text-2xl font-bold border border-red-500/30">
                    {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedStudent.name || "No name"}</h3>
                    <p className="text-zinc-400">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-zinc-500">Phone:</span>
                    <span className="text-white col-span-2 font-medium">{selectedStudent.phone || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-zinc-500">College:</span>
                    <span className="text-white col-span-2 font-medium">{selectedStudent.collage || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-zinc-500">Branch:</span>
                    <span className="text-white col-span-2 font-medium">{selectedStudent.branch || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-zinc-500">Year:</span>
                    <span className="text-white col-span-2 font-medium">{selectedStudent.year || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-zinc-500">College ID:</span>
                    <span className="text-white col-span-2 font-medium font-mono bg-zinc-800 px-2 py-0.5 rounded w-fit">{selectedStudent.collageId || "N/A"}</span>
                  </div>

                  {getSubmissionForStudent(selectedStudent.id) && (
                    <div className="pt-4 mt-4 border-t border-zinc-800/50">
                      <h4 className="text-white font-semibold mb-3">Submission</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="text-zinc-500">YouTube Link:</span>
                          <a
                            href={getSubmissionForStudent(selectedStudent.id)?.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 text-blue-400 hover:text-blue-300 break-all hover:underline"
                          >
                            {getSubmissionForStudent(selectedStudent.id)?.submissionLink}
                          </a>
                        </div>
                        {getSubmissionForStudent(selectedStudent.id)?.youtubeChannelName && (
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="text-zinc-500">Channel:</span>
                            <p className="text-zinc-300 col-span-2">{getSubmissionForStudent(selectedStudent.id)?.youtubeChannelName}</p>
                          </div>
                        )}
                        {getSubmissionForStudent(selectedStudent.id)?.notes && (
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <span className="text-zinc-500">Notes:</span>
                            <p className="text-zinc-300 col-span-2 whitespace-pre-wrap">
                              {getSubmissionForStudent(selectedStudent.id)?.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowStudentDetailsModal(false);
                    setSelectedStudent(null);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
      {/* Group Details Modal */}
      {
        showGroupDetailsModal && selectedGroup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onWheel={(e) => e.stopPropagation()}
              className="bg-zinc-900 rounded-xl w-full max-w-2xl border border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedGroup.groupName}</h2>
                  <p className="text-zinc-400 text-sm">Group Details</p>
                </div>
                <button
                  onClick={() => {
                    setShowGroupDetailsModal(false);
                    setSelectedGroup(null);
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain" data-lenis-prevent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Team Lead</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold border border-blue-500/30">
                        {selectedGroup.user.name ? selectedGroup.user.name.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{selectedGroup.user.name}</p>
                        <p className="text-sm text-zinc-400">{selectedGroup.user.email}</p>
                        <p className="text-xs text-zinc-500 mt-1">{selectedGroup.user.phone || "No Phone"}</p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-zinc-500 space-y-1">
                      <p>College: {selectedGroup.user.collage || "N/A"}</p>
                      <p>ID: {selectedGroup.user.collageId || "N/A"}</p>
                      <p>Location: {[selectedGroup.user.city, selectedGroup.user.state].filter(Boolean).join(", ") || "N/A"}</p>
                      {(() => {
                        const rd = (selectedGroup as any).registrationDetails as Record<string, any> | null;
                        const ign = rd?.teamLeadInGameName;
                        if (!ign) return null;
                        const inGameId = rd?.teamLeadInGameId;
                        const riotId = rd?.teamLeadRiotId;
                        return (
                          <div className="mt-2 pt-2 border-t border-zinc-600 space-y-1">
                            <p className="text-amber-400 font-medium">In-game: {ign}</p>
                            {inGameId && <p className="text-amber-400/90">In-game ID: {inGameId}</p>}
                            {riotId && <p className="text-amber-400/90">Riot ID: {riotId}</p>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Mentor / Coordinator</h3>
                    {selectedGroup.mentorName ? (
                      <>
                        <p className="text-white font-medium">{selectedGroup.mentorName}</p>
                        <p className="text-sm text-zinc-400">{selectedGroup.mentorPhone || "No Phone"}</p>
                      </>
                    ) : (
                      <p className="text-zinc-500 italic">No mentor details provided</p>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="bg-red-600 w-1 h-6 rounded-full block"></span>
                  Team Members
                </h3>

                <div className="space-y-3">
                  {(() => {
                    const raw = selectedGroup.members;
                    const memberList = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? Object.values(raw) : []);
                    return memberList.length > 0 ? (
                      memberList.map((member: any, idx: number) => (
                        <div key={idx} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-white font-medium">{member.name}</p>
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                                <span>{member.gender}</span>
                                <span>•</span>
                                <span>{member.phone}</span>
                              </div>
                              {(member.inGameName || member.inGameId || member.riotId) && (
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-amber-400/90 mt-1.5">
                                  {member.inGameName && <span>IGN: {member.inGameName}</span>}
                                  {member.inGameId && <span>ID: {member.inGameId}</span>}
                                  {member.riotId && <span>Riot: {member.riotId}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 italic">No additional members found in record.</p>
                    );
                  })()}
                </div>
              </div>

              <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => {
                    setShowGroupDetailsModal(false);
                    setSelectedGroup(null);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )
      }
    </div >
  );
}
