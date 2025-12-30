"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiUsers,
  FiChevronRight,
  FiChevronLeft,
  FiCheck,
  FiCreditCard,
  FiAlertCircle,
} from "react-icons/fi";
import { createAccommodationBooking } from "@/actions/accommodation.action";

type Gender = "MALE" | "FEMALE" | "";
type BookingType = "INDIVIDUAL" | "GROUP" | "";

interface AccommodationData {
  gender: Gender;
  bookingType: BookingType;
  name: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  genderConfirmed: boolean;
}

const MultiStepAccommodation = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AccommodationData>({
    gender: "",
    bookingType: "",
    name: "",
    email: "",
    phone: "",
    numberOfGuests: 1,
    genderConfirmed: false,
  });

  const handleGenderSelect = (gender: Gender) => {
    setFormData({ ...formData, gender, genderConfirmed: false });
    setCurrentStep(2);
  };

  const handleBookingTypeSelect = (bookingType: BookingType) => {
    const newFormData = {
      ...formData,
      bookingType,
      numberOfGuests: bookingType === "INDIVIDUAL" ? 1 : 2,
      genderConfirmed: false
    };
    setFormData(newFormData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberOfGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input (when user is typing)
    if (value === '') {
      setFormData({ ...formData, numberOfGuests: 0 });
      return;
    }

    // Parse and clamp between 2 and 10
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setFormData({ ...formData, numberOfGuests: Math.max(2, Math.min(10, numValue)) });
    }
  };

  const handleGenderConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, genderConfirmed: e.target.checked });
  };

  const canProceedToStep3 = () => {
    if (!formData.bookingType) return false;
    if (!formData.name || !formData.email || !formData.phone) return false;

    if (formData.bookingType === "GROUP") {
      // For group bookings, need gender confirmation
      if (!formData.genderConfirmed) return false;
      if (formData.numberOfGuests < 2) return false;
    }

    return true;
  };

  const handlePayment = async () => {
    setIsSubmitting(true);

    try {
      // Prepare booking data
      const bookingData = {
        gender: formData.gender as "MALE" | "FEMALE",
        bookingType: formData.bookingType as "INDIVIDUAL" | "GROUP",
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        numberOfGuests: formData.numberOfGuests,
      };

      // Submit booking
      const result = await createAccommodationBooking(bookingData);

      if (result.success) {
        toast.success(result.message || "Accommodation booking submitted successfully!");

        // Reset form
        setFormData({
          gender: "",
          bookingType: "",
          name: "",
          email: "",
          phone: "",
          numberOfGuests: 1,
          genderConfirmed: false,
        });
        setCurrentStep(1);
      } else {
        toast.error(result.error || "Failed to submit booking");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Booking failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  const totalMembers = formData.numberOfGuests;
  const genderLabel = formData.gender === "MALE" ? "boys" : "girls";

  return (
    <div className="w-full min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex flex-col py-12 relative overflow-hidden">
      {/* Traditional Indian Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff6b35' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Mandala Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-3 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffa500' fill-opacity='0.4'%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3Ccircle cx='50' cy='50' r='8' fill='none' stroke='%23ffa500' stroke-width='0.5'/%3E%3Ccircle cx='50' cy='50' r='16' fill='none' stroke='%23ffa500' stroke-width='0.5'/%3E%3Cpath d='M50 34 L54 42 L50 38 L46 42 Z' /%3E%3Cpath d='M50 66 L54 58 L50 62 L46 58 Z' /%3E%3Cpath d='M34 50 L42 46 L38 50 L42 54 Z' /%3E%3Cpath d='M66 50 L58 46 L62 50 L58 54 Z' /%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
          backgroundPosition: 'center'
        }}
      />

      {/* Header */}
      <div className="w-full px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">
            Accommodation Booking
          </h1>
          <p className="text-zinc-400">
            Book your accommodation in 3 simple steps
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full px-6 mb-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 mb-1">
            {[
              { step: 1, label: "Gender Selection" },
              { step: 2, label: "Personal Details" },
              { step: 3, label: "Payment" }
            ].map(({ step, label }, index) => {
              // Determine if step is accessible
              const isAccessible =
                step === 1 || // Step 1 always accessible
                (step === 2 && formData.gender) || // Step 2 if gender selected
                (step === 3 && canProceedToStep3()); // Step 3 if can proceed

              const isCompleted = currentStep > step;
              const isCurrent = currentStep === step;

              return (
                <div key={step} className="relative">
                  {/* Step circle and connecting line */}
                  <div className="flex items-center mb-1">
                    <button
                      onClick={() => isAccessible && setCurrentStep(step)}
                      disabled={!isAccessible}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shrink-0 ${isCompleted
                        ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                        : isCurrent
                          ? "bg-orange-500 text-white"
                          : isAccessible
                            ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 cursor-pointer"
                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        } ${isAccessible && !isCurrent ? "hover:scale-110" : ""}`}
                      title={
                        !isAccessible
                          ? step === 2
                            ? "Complete Step 1 first"
                            : "Complete previous steps first"
                          : `Go to Step ${step}`
                      }
                    >
                      {isCompleted ? <FiCheck /> : step}
                    </button>
                    {index < 2 && (
                      <div
                        className={`flex-1 h-1 ml-2 mr-[-2rem] transition-all ${isCompleted ? "bg-green-500" : "bg-zinc-800"
                          }`}
                      />
                    )}
                  </div>
                  {/* Step label */}
                  <div className="text-sm text-zinc-400 text-left">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 w-full px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Gender Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Select Gender
                  </h2>
                  <p className="text-zinc-400">
                    Choose your gender for accommodation allocation
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenderSelect("MALE")}
                    className="group p-8 rounded-xl border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-all text-left relative overflow-hidden"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-radial from-blue-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <FiUser className="text-blue-500" size={32} />
                        </div>
                        <span className="text-2xl font-semibold text-white">
                          Male
                        </span>
                      </div>
                      <FiChevronRight className="text-zinc-400" size={24} />
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenderSelect("FEMALE")}
                    className="group p-8 rounded-xl border-2 border-pink-500 bg-pink-500/10 hover:bg-pink-500/20 transition-all text-left relative overflow-hidden"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-radial from-pink-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center">
                          <FiUser className="text-pink-500" size={32} />
                        </div>
                        <span className="text-2xl font-semibold text-white">
                          Female
                        </span>
                      </div>
                      <FiChevronRight className="text-zinc-400" size={24} />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Personal Details & Number of Guests */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col h-full"
              >
                {/* Header - Fixed */}
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Personal Details
                  </h2>
                  <p className="text-zinc-400">
                    Fill in your details and specify number of guests
                  </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 mb-6">
                  <div className="space-y-6">
                    {/* Booking Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">
                        Booking Type *
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handleBookingTypeSelect("INDIVIDUAL")}
                          className={`group p-4 rounded-lg border-2 transition-all relative overflow-hidden ${formData.bookingType === "INDIVIDUAL"
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                            }`}
                        >
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 bg-gradient-radial from-orange-400/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <FiUser
                            className={`mx-auto mb-2 relative z-10 ${formData.bookingType === "INDIVIDUAL"
                              ? "text-orange-500"
                              : "text-zinc-400"
                              }`}
                            size={24}
                          />
                          <span className="text-white font-medium relative z-10">
                            Individual
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBookingTypeSelect("GROUP")}
                          className={`group p-4 rounded-lg border-2 transition-all relative overflow-hidden ${formData.bookingType === "GROUP"
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                            }`}
                        >
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 bg-gradient-radial from-orange-400/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <FiUsers
                            className={`mx-auto mb-2 relative z-10 ${formData.bookingType === "GROUP"
                              ? "text-orange-500"
                              : "text-zinc-400"
                              }`}
                            size={24}
                          />
                          <span className="text-white font-medium relative z-10">Group</span>
                        </button>
                      </div>
                    </div>

                    {/* Primary Contact Details */}
                    <div className="group bg-zinc-800/30 rounded-lg p-6 border border-zinc-700 relative overflow-hidden transition-all hover:border-zinc-600">
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-radial from-orange-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <h3 className="text-lg font-semibold text-white mb-4 relative z-10">
                        Your Details (Primary Contact)
                      </h3>

                      <div className="space-y-4 relative z-10">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Full Name *
                          </label>
                          <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Email Address *
                          </label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Phone Number *
                          </label>
                          <div className="relative">
                            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              pattern="[0-9]{10}"
                              className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              placeholder="10-digit mobile number"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Number of Guests (for Group bookings) */}
                    {formData.bookingType === "GROUP" && (
                      <div className="group bg-zinc-800/30 rounded-lg p-6 border border-zinc-700 relative overflow-hidden transition-all hover:border-zinc-600">
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-radial from-orange-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Group Details
                          </h3>

                          <div className="space-y-4">
                            {/* Number of Guests Input */}
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Total Number of Guests (including you) *
                              </label>
                              <div className="relative">
                                <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                  type="number"
                                  min="2"
                                  max="10"
                                  value={formData.numberOfGuests === 0 ? '' : formData.numberOfGuests}
                                  onChange={handleNumberOfGuestsChange}
                                  className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                  placeholder="Enter number of guests"
                                />
                              </div>
                              <p className="text-xs text-zinc-500 mt-1">
                                Minimum 2, Maximum 10 guests
                              </p>
                            </div>

                            {/* Gender Confirmation Checkbox */}
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id="genderConfirm"
                                  checked={formData.genderConfirmed}
                                  onChange={handleGenderConfirmChange}
                                  className="mt-1 w-5 h-5 rounded border-orange-500 text-orange-500 focus:ring-orange-500 focus:ring-offset-zinc-900 bg-zinc-800"
                                />
                                <label htmlFor="genderConfirm" className="flex-1 cursor-pointer">
                                  <div className="flex items-center gap-2 mb-1">
                                    <FiAlertCircle className="text-orange-500" size={18} />
                                    <span className="text-white font-medium text-sm">
                                      Gender Confirmation Required
                                    </span>
                                  </div>
                                  <p className="text-zinc-300 text-sm">
                                    I confirm that all {formData.numberOfGuests} guests (including me) are {genderLabel}.
                                    Mixed gender groups are not allowed for accommodation.
                                  </p>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buttons - Fixed at bottom */}
                <div className="mt-8 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3()}
                    className="group w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-radial from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      Next: Payment
                      <FiChevronRight />
                    </span>
                  </motion.button>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full px-8 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <FiChevronLeft />
                    Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Payment & Confirmation
                  </h2>
                  <p className="text-zinc-400">
                    Review your booking details and proceed to payment
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Booking Summary */}
                  <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Booking Summary
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Gender:</span>
                        <span className="text-white font-medium">
                          {formData.gender === "MALE" ? "Male" : "Female"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Booking Type:</span>
                        <span className="text-white font-medium">
                          {formData.bookingType === "INDIVIDUAL"
                            ? "Individual"
                            : "Group"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Total Guests:</span>
                        <span className="text-white font-medium">
                          {totalMembers}
                        </span>
                      </div>

                      <div className="border-t border-zinc-700 pt-3 mt-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-zinc-400">Primary Contact:</span>
                          <span className="text-white font-medium">
                            {formData.name}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-zinc-400">Email:</span>
                          <span className="text-white font-medium">
                            {formData.email}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Phone:</span>
                          <span className="text-white font-medium">
                            {formData.phone}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-zinc-700 pt-3 mt-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-zinc-300 font-semibold">Estimated Amount:</span>
                          <span className="text-orange-500 font-bold">
                            ₹{totalMembers * 500}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          ₹500 per person
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <FiCreditCard className="text-orange-500 mt-1" size={24} />
                      <div>
                        <h4 className="text-white font-semibold mb-2">
                          Payment Gateway Integration Pending
                        </h4>
                        <p className="text-zinc-300 text-sm">
                          The payment gateway will be integrated soon. For now,
                          you can submit your booking details and the payment
                          link will be provided later.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    disabled={isSubmitting}
                    className="group w-full px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-radial from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? (
                        "Processing..."
                      ) : (
                        <>
                          <FiCreditCard />
                          Proceed to Payment
                        </>
                      )}
                    </span>
                  </motion.button>

                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="w-full px-8 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FiChevronLeft />
                    Back
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MultiStepAccommodation;
