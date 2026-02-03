"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiLink,
  FiFileText,
  FiImage,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiX,
  FiMinus,
  FiPlus,
} from "react-icons/fi";
import { createEvent, updateEvent } from "@/actions/events.action";
import { uploadEventImage } from "@/actions/upload.action";

interface Event {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  date: string | Date;
  image: string;
  venue: string;
  isGroupEvent: boolean;
  allowSubmissions?: boolean;
  virtualEnabled?: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  startTime: string;
  endTime: string;
  participantLimit: number;
  termsandconditions: string;
  virtualTermsAndConditions?: string | null;
  registrationLink: string;
  whatsappLink?: string | null;
  brochureLink?: string | null;
}

interface MultiStepEventFormProps {
  categoryId: string;
  editingEvent?: Event | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MultiStepEventForm({
  categoryId,
  editingEvent,
  onClose,
  onSuccess,
}: MultiStepEventFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: editingEvent?.categoryId || categoryId,
    name: editingEvent?.name || "",
    description: editingEvent?.description || "",
    date: editingEvent
      ? new Date(editingEvent.date).toISOString().split("T")[0]
      : "",
    image: editingEvent?.image || "",
    venue: editingEvent?.venue || "",
    isGroupEvent: editingEvent?.isGroupEvent || false,
    allowSubmissions: !!editingEvent?.allowSubmissions,
    virtualEnabled: !!editingEvent?.virtualEnabled,
    minTeamSize: editingEvent?.minTeamSize?.toString() || "2",
    maxTeamSize: editingEvent?.maxTeamSize?.toString() || "5",
    startTime: editingEvent?.startTime || "",
    endTime: editingEvent?.endTime || "",
    participantLimit: editingEvent?.participantLimit.toString() || "",
    termsandconditions: editingEvent?.termsandconditions || "",
    virtualTermsAndConditions: editingEvent?.virtualTermsAndConditions || "",
    registrationLink: editingEvent?.registrationLink || "",
    whatsappLink: editingEvent?.whatsappLink || "",
    brochureLink: editingEvent?.brochureLink || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    editingEvent?.image || ""
  );

  // Terms list state management
  const [termsList, setTermsList] = useState<string[]>(
    formData.termsandconditions
      ? formData.termsandconditions.split(/\r?\n/).filter(t => t.trim())
      : [""]
  );

  // Virtual terms list state management
  const [virtualTermsList, setVirtualTermsList] = useState<string[]>(
    formData.virtualTermsAndConditions
      ? formData.virtualTermsAndConditions.split(/\r?\n/).filter(t => t.trim())
      : [""]
  );

  // Sync termsList to formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      termsandconditions: termsList.join('\n')
    }));
  }, [termsList]);

  // Sync virtualTermsList to formData
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      virtualTermsAndConditions: virtualTermsList.join('\n')
    }));
  }, [virtualTermsList]);

  // Sync formData when editingEvent changes (e.g. open Edit modal or switch event)
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        categoryId: editingEvent.categoryId,
        name: editingEvent.name || "",
        description: editingEvent.description || "",
        date: new Date(editingEvent.date).toISOString().split("T")[0],
        image: editingEvent.image || "",
        venue: editingEvent.venue || "",
        isGroupEvent: editingEvent.isGroupEvent || false,
        allowSubmissions: !!editingEvent.allowSubmissions,
        virtualEnabled: !!editingEvent.virtualEnabled,
        minTeamSize: editingEvent.minTeamSize?.toString() || "2",
        maxTeamSize: editingEvent.maxTeamSize?.toString() || "5",
        startTime: editingEvent.startTime || "",
        endTime: editingEvent.endTime || "",
        participantLimit: editingEvent.participantLimit?.toString() || "",
        termsandconditions: editingEvent.termsandconditions || "",
        virtualTermsAndConditions: editingEvent.virtualTermsAndConditions || "",
        registrationLink: editingEvent.registrationLink || "",
        whatsappLink: editingEvent.whatsappLink || "",
        brochureLink: editingEvent.brochureLink || "",
      });
      setImagePreview(editingEvent.image || "");
      setTermsList(
        editingEvent.termsandconditions
          ? editingEvent.termsandconditions.split(/\r?\n/).filter((t) => t.trim())
          : [""]
      );
      setVirtualTermsList(
        editingEvent.virtualTermsAndConditions
          ? editingEvent.virtualTermsAndConditions.split(/\r?\n/).filter((t) => t.trim())
          : [""]
      );
    }
  }, [editingEvent?.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    // Save original body overflow
    const originalOverflow = document.body.style.overflow;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Cleanup: restore original overflow when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 10MB.");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const canProceedToStep2 = () => {
    return formData.name && formData.description && formData.date;
  };

  const canProceedToStep3 = () => {
    return (
      formData.venue &&
      formData.startTime &&
      formData.endTime &&
      formData.participantLimit
    );
  };

  const canSubmit = () => {
    return (
      formData.termsandconditions &&
      (imagePreview || editingEvent)
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let imageUrl = formData.image;

      // Upload new image if selected
      if (selectedFile) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);

        const uploadResult = await uploadEventImage(uploadFormData);

        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload image");
          setUploading(false);
          setIsSubmitting(false);
          return;
        }
        imageUrl = uploadResult.url || "";
      }



      setUploading(false);

      if (!imageUrl) {
        toast.error("Please upload an image");
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        ...formData,
        image: imageUrl,
        minTeamSize: parseInt(formData.minTeamSize as unknown as string) || 1,
        maxTeamSize: parseInt(formData.maxTeamSize as unknown as string) || 1,
        participantLimit: formData.participantLimit,
      };

      const result = editingEvent
        ? await updateEvent({ id: editingEvent.id, eventData })
        : await createEvent(eventData);

      if (result.success) {
        toast.success(
          editingEvent
            ? "Event updated successfully"
            : "Event created successfully"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to save event");
      }
    } catch (error) {
      toast.error("An error occurred while saving the event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 rounded-2xl w-full max-w-4xl border border-zinc-800 shadow-2xl"
        style={{
          maxHeight: '90vh',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
              <p className="text-zinc-400 mt-1">
                Complete the form in 3 simple steps
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar - Fixed */}
        <div className="px-8 py-6 border-b border-zinc-800">
          <div className="flex items-center justify-between relative">
            {/* Connecting Lines Layer */}
            <div className="absolute top-5 left-0 w-full -translate-y-1/2 flex px-12 z-0">
              <div className={`flex-1 h-0.5 transition-all duration-300 ${currentStep >= 2 ? "bg-orange-500" : "bg-zinc-800"}`} />
              <div className={`flex-1 h-0.5 transition-all duration-300 ${currentStep >= 3 ? "bg-orange-500" : "bg-zinc-800"}`} />
            </div>

            {/* Steps Layer */}
            <div className="relative z-10 flex justify-between w-full text-center">
              {[
                { step: 1, label: "Basic Info" },
                { step: 2, label: "Event Details" },
                { step: 3, label: "Additional Info" }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-3 w-32">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border-4 ${currentStep > item.step
                      ? "bg-orange-500 border-orange-500 text-white"
                      : currentStep === item.step
                        ? "bg-zinc-900 border-orange-500 text-orange-500"
                        : "bg-zinc-900 border-zinc-700 text-zinc-500"
                      }`}
                  >
                    {currentStep > item.step ? <FiCheck /> : item.step}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= item.step ? "text-white" : "text-zinc-500"
                    }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content - Scrollable */}
        <div
          className="px-8 py-6"
          data-lenis-prevent
          style={{
            overflowY: 'scroll',
            overflowX: 'hidden',
            minHeight: 0,
            height: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Basic Information
                  </h3>
                  <p className="text-zinc-400">
                    Enter the event name, description, and date
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Enter event name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    rows={4}
                    placeholder="Describe your event"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Event Date *
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <FiX />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2()}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next
                    <FiChevronRight />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Event Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Event Details
                  </h3>
                  <p className="text-zinc-400">
                    Specify venue, timing, and participant limit
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Venue *
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Event location"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Event Type
                    </label>
                    <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isGroupEvent}
                          onChange={(e) =>
                            setFormData({ ...formData, isGroupEvent: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        <span className="ml-3 text-sm font-medium text-zinc-300">
                          {formData.isGroupEvent ? "Group Event" : "Individual Event"}
                        </span>
                      </label>
                    </div>
                  </div>

                  {formData.isGroupEvent && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Min Team Size
                        </label>
                        <div className="relative flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(formData.minTeamSize as unknown as string) || 0;
                              setFormData({ ...formData, minTeamSize: Math.max(0, val - 1).toString() });
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white p-3 rounded-l-lg border-y border-l border-zinc-600 transition-colors"
                          >
                            <FiMinus size={16} />
                          </button>
                          <div className="relative flex-1">
                            <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10" />
                            <input
                              type="number"
                              min="2"
                              value={formData.minTeamSize}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minTeamSize: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border-y border-zinc-700 text-white focus:outline-none focus:ring-0 text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(formData.minTeamSize as unknown as string) || 0;
                              setFormData({ ...formData, minTeamSize: (val + 1).toString() });
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white p-3 rounded-r-lg border-y border-r border-zinc-600 transition-colors"
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Max Team Size
                        </label>
                        <div className="relative flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(formData.maxTeamSize as unknown as string) || 0;
                              setFormData({ ...formData, maxTeamSize: Math.max(0, val - 1).toString() });
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white p-3 rounded-l-lg border-y border-l border-zinc-600 transition-colors"
                          >
                            <FiMinus size={16} />
                          </button>
                          <div className="relative flex-1">
                            <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10" />
                            <input
                              type="number"
                              min={formData.minTeamSize}
                              value={formData.maxTeamSize}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  maxTeamSize: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border-y border-zinc-700 text-white focus:outline-none focus:ring-0 text-center"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseInt(formData.maxTeamSize as unknown as string) || 0;
                              setFormData({ ...formData, maxTeamSize: (val + 1).toString() });
                            }}
                            className="bg-zinc-700 hover:bg-zinc-600 text-white p-3 rounded-r-lg border-y border-r border-zinc-600 transition-colors"
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Start Time *
                    </label>
                    <div className="relative">
                      <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      End Time *
                    </label>
                    <div className="relative">
                      <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Participant Limit *
                  </label>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(formData.participantLimit) || 0;
                        setFormData({ ...formData, participantLimit: Math.max(0, val - 1).toString() });
                      }}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white p-3 rounded-l-lg border-y border-l border-zinc-600 transition-colors"
                    >
                      <FiMinus size={16} />
                    </button>
                    <div className="relative flex-1">
                      <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10" />
                      <input
                        type="number"
                        name="participantLimit"
                        value={formData.participantLimit}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border-y border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-0 text-center"
                        placeholder="Maximum participants"
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(formData.participantLimit) || 0;
                        setFormData({ ...formData, participantLimit: (val + 1).toString() });
                      }}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white p-3 rounded-r-lg border-y border-r border-zinc-600 transition-colors"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <FiChevronLeft />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3()}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next
                    <FiChevronRight />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Additional Information
                  </h3>
                  <p className="text-zinc-400">
                    Upload image, add terms, and registration link
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Event Image *
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 z-10" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white hover:file:bg-orange-600 file:cursor-pointer"
                      />
                    </div>
                    {imagePreview && (
                      <div className="relative w-full h-48 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-700">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreview("");
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    )}
                    <p className="text-zinc-500 text-sm">
                      {editingEvent && !selectedFile
                        ? "Upload a new image to replace the current one"
                        : "Supported: JPG, PNG, WebP, GIF (Max 10MB)"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Submissions
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.allowSubmissions}
                        onChange={(e) =>
                          setFormData({ ...formData, allowSubmissions: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      <span className="ml-3 text-sm font-medium text-zinc-300">
                        {formData.allowSubmissions ? "Enabled submissions upload" : "Disabled submissions upload"}
                      </span>
                    </label>
                  </div>
                  <p className="text-zinc-500 text-sm mt-2">
                    If enabled, participants will see the “Submit Work” option in “My Competitions”.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Virtual Participation
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-lg border border-zinc-700">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.virtualEnabled}
                        onChange={(e) =>
                          setFormData({ ...formData, virtualEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      <span className="ml-3 text-sm font-medium text-zinc-300">
                        {formData.virtualEnabled ? "Virtual participation enabled" : "Physical participation only"}
                      </span>
                    </label>
                  </div>
                  <p className="text-zinc-500 text-sm mt-2">
                    Allows eligible students (Google OAuth, outside AP/Telangana) to register virtually at ₹150 instead of ₹350.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Terms and Conditions *
                  </label>
                  <div className="space-y-3">
                    {termsList.map((term, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <input
                            type="text"
                            value={term}
                            onChange={(e) => {
                              const newTerms = [...termsList];
                              newTerms[index] = e.target.value;
                              setTermsList(newTerms);
                            }}
                            className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder={`Point ${index + 1}`}
                            required={index === 0} // Only first point is strictly required
                          />
                        </div>
                        {termsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newTerms = termsList.filter((_, i) => i !== index);
                              setTermsList(newTerms);
                            }}
                            className="p-3 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-all"
                          >
                            <FiMinus size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTermsList([...termsList, ""])}
                      className="text-sm text-orange-500 hover:text-orange-400 font-medium flex items-center gap-2 mt-2 px-1"
                    >
                      <FiPlus /> Add Another Point
                    </button>
                  </div>
                </div>

                {/* Virtual Terms - Only show when virtual enabled */}
                {formData.virtualEnabled && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Virtual Participation Terms <span className="text-zinc-500 text-xs">(Optional - if different from physical)</span>
                    </label>
                    <p className="text-zinc-500 text-xs mb-3">
                      Specific terms and conditions for virtual participants. Leave empty to use same terms as physical participation.
                    </p>
                    <div className="space-y-3">
                      {virtualTermsList.map((term, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <input
                              type="text"
                              value={term}
                              onChange={(e) => {
                                const newTerms = [...virtualTermsList];
                                newTerms[index] = e.target.value;
                                setVirtualTermsList(newTerms);
                              }}
                              className="w-full pl-8 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                              placeholder={`Virtual Point ${index + 1}`}
                            />
                          </div>
                          {virtualTermsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newTerms = virtualTermsList.filter((_, i) => i !== index);
                                setVirtualTermsList(newTerms);
                              }}
                              className="p-3 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-all"
                            >
                              <FiMinus size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVirtualTermsList([...virtualTermsList, ""])}
                        className="text-sm text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-2 mt-2 px-1"
                      >
                        <FiPlus /> Add Virtual Point
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Registration Link <span className="text-zinc-500 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="url"
                      name="registrationLink"
                      value={formData.registrationLink}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="https://example.com/register"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    WhatsApp Group Link <span className="text-zinc-500 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
                    <input
                      type="url"
                      name="whatsappLink"
                      value={formData.whatsappLink}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Brochure Link (PDF/Drive) <span className="text-zinc-500 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                    <input
                      type="url"
                      name="brochureLink"
                      value={formData.brochureLink}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://example.com/brochure.pdf"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FiChevronLeft />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit() || isSubmitting || uploading}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Uploading...
                      </>
                    ) : isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>
                        {editingEvent ? "Update Event" : "Create Event"}
                        <FiCheck />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
