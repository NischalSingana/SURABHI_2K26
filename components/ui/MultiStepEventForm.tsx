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
  startTime: string;
  endTime: string;
  participantLimit: number;
  termsandconditions: string;
  registrationLink: string;
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
    startTime: editingEvent?.startTime || "",
    endTime: editingEvent?.endTime || "",
    participantLimit: editingEvent?.participantLimit.toString() || "",
    termsandconditions: editingEvent?.termsandconditions || "",
    registrationLink: editingEvent?.registrationLink || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    editingEvent?.image || ""
  );

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
      formData.registrationLink &&
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
        setUploading(false);

        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload image");
          setIsSubmitting(false);
          return;
        }
        imageUrl = uploadResult.url || "";
      }

      if (!imageUrl) {
        toast.error("Please upload an image");
        setIsSubmitting(false);
        return;
      }

      const eventData = { ...formData, image: imageUrl };

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
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep > step
                    ? "bg-green-500 text-white"
                    : currentStep === step
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-500"
                    }`}
                >
                  {currentStep > step ? <FiCheck /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${currentStep > step ? "bg-green-500" : "bg-zinc-800"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Basic Info</span>
            <span>Event Details</span>
            <span>Additional Info</span>
          </div>
        </div>

        {/* Step Content - Scrollable */}
        <div
          className="px-8 py-6"
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
                  <div className="relative">
                    <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="number"
                      name="participantLimit"
                      value={formData.participantLimit}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Maximum participants"
                      min="1"
                      required
                    />
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
                        : "Supported: JPG, PNG, WebP, GIF (Max 5MB)"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Terms and Conditions *
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-3 text-zinc-500" />
                    <textarea
                      name="termsandconditions"
                      value={formData.termsandconditions}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      rows={4}
                      placeholder="Enter terms and conditions"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Registration Link *
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
                      required
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
