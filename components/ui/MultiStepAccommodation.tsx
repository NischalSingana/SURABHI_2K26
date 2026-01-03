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
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { createAccommodationBooking } from "@/actions/accommodation.action";
import Image from "next/image";

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
    // Smooth auto-advance
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleBookingTypeSelect = (bookingType: BookingType) => {
    const newFormData = {
      ...formData,
      bookingType,
      numberOfGuests: bookingType === "INDIVIDUAL" ? 1 : 2,
      genderConfirmed: false,
    };
    setFormData(newFormData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberOfGuestsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value === "") {
      setFormData({ ...formData, numberOfGuests: 0 });
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setFormData({
        ...formData,
        numberOfGuests: Math.max(2, Math.min(10, numValue)),
      });
    }
  };

  const handleGenderConfirmChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, genderConfirmed: e.target.checked });
  };

  const canProceedToStep3 = () => {
    if (!formData.bookingType) return false;
    if (!formData.name || !formData.email || !formData.phone) return false;

    if (formData.bookingType === "GROUP") {
      if (!formData.genderConfirmed) return false;
      if (formData.numberOfGuests < 2) return false;
    }

    return true;
  };

  const handlePayment = async () => {
    setIsSubmitting(true);
    try {
      const result = await createAccommodationBooking({
        gender: formData.gender as "MALE" | "FEMALE",
        bookingType: formData.bookingType as "INDIVIDUAL" | "GROUP",
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        numberOfGuests: formData.numberOfGuests,
      });

      if (result.success) {
        toast.success("Booking submitted successfully!");
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
        toast.error(result.error || "Failed to submit bookings");
      }
    } catch (error) {
      toast.error("Booking failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Gender" },
    { number: 2, title: "Details" },
    { number: 3, title: "Payment" },
  ];

  const totalAmount = formData.numberOfGuests * 500;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col md:flex-row relative overflow-hidden pt-20 md:pt-24">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Left Panel - Info & Rules (Sticky on Desktop) */}
      <div className="w-full md:w-1/3 min-h-[30vh] md:h-[calc(100vh-6rem)] md:sticky md:top-24 bg-zinc-900/50 backdrop-blur-xl border-b md:border-b-0 md:border-r border-zinc-800 p-8 flex flex-col justify-between z-10 rounded-br-2xl md:rounded-r-2xl border-r-0 md:border-r">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
              <FiShield className="text-white text-xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Accommodation</h1>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
              <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                <FiInfo /> Important Rules
              </h3>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 bg-zinc-500 rounded-full" />
                  Separate accommodation for Boys and Girls.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 bg-zinc-500 rounded-full" />
                  Mixed gender groups are strictly prohibited.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 bg-zinc-500 rounded-full" />
                  Check-in starts 24 hours before event.
                </li>
              </ul>
            </div>

            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
              <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <FiCreditCard /> Pricing
              </h3>
              <p className="text-2xl font-bold text-white">₹500 <span className="text-sm font-normal text-zinc-500">/ person per day</span></p>
              <p className="text-xs text-zinc-500 mt-2">Includes stay and basic amenities.</p>
            </div>
          </div>
        </div>

        <div className="hidden md:block pl-16">
          <p className="text-zinc-500 text-xs">For support contact: <span className="text-white">surabhi@kluniversity.in</span></p>
        </div>
      </div>

      {/* Right Panel - Form Wizard */}
      <div className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 z-10 overflow-y-auto">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto w-full mb-12">
          <div className="flex justify-between items-center relative">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-zinc-800 -z-10" />
            <div
              className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-red-600 to-orange-500 -z-10 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center gap-2 bg-[#0a0e1a] px-2">
                <div
                  onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${currentStep === step.number
                    ? "border-red-500 bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : step.number < currentStep
                      ? "border-green-500 bg-green-500 text-white cursor-pointer"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                    }`}
                >
                  {step.number < currentStep ? <FiCheck size={16} /> : step.number}
                </div>
                <span className={`text-xs font-medium ${currentStep >= step.number ? "text-white" : "text-zinc-600"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">Select Gender</h2>
                  <p className="text-zinc-400">Please select your gender for room allocation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Male Card */}
                  <button
                    onClick={() => handleGenderSelect("MALE")}
                    className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden text-left ${formData.gender === "MALE"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-800"
                      }`}
                  >
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${formData.gender === "MALE" ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400 group-hover:bg-blue-500/20 group-hover:text-blue-500"
                        }`}>
                        <FiUser size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Male</h3>
                        <p className="text-sm text-zinc-400">Boys Hostel</p>
                      </div>
                    </div>
                  </button>

                  {/* Female Card */}
                  <button
                    onClick={() => handleGenderSelect("FEMALE")}
                    className={`group relative p-8 rounded-2xl border-2 transition-all duration-300 overflow-hidden text-left ${formData.gender === "FEMALE"
                      ? "border-pink-500 bg-pink-500/10"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-pink-500/50 hover:bg-zinc-800"
                      }`}
                  >
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${formData.gender === "FEMALE" ? "bg-pink-500 text-white" : "bg-zinc-800 text-zinc-400 group-hover:bg-pink-500/20 group-hover:text-pink-500"
                        }`}>
                        <FiUser size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Female</h3>
                        <p className="text-sm text-zinc-400">Girls Hostel</p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">Your Details</h2>
                  <p className="text-zinc-400">Provide your contact info and booking preferences.</p>
                </div>

                {/* Booking Type Toggle */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-900 border border-zinc-700 p-1.5 rounded-xl">
                  <button
                    onClick={() => handleBookingTypeSelect("INDIVIDUAL")}
                    className={`py-3 rounded-lg font-medium transition-all ${formData.bookingType === "INDIVIDUAL"
                      ? "bg-zinc-800 text-white shadow-lg"
                      : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => handleBookingTypeSelect("GROUP")}
                    className={`py-3 rounded-lg font-medium transition-all ${formData.bookingType === "GROUP"
                      ? "bg-zinc-800 text-white shadow-lg"
                      : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Group
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block pl-1">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-3.5 text-zinc-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-zinc-600"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block pl-1">Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-3.5 text-zinc-500" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-zinc-600"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block pl-1">Phone</label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-3.5 text-zinc-500" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-zinc-600"
                          placeholder="10 digit number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group Specific Fields */}
                  <AnimatePresence>
                    {formData.bookingType === "GROUP" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-2 overflow-hidden"
                      >
                        <div className="relative p-6 bg-red-900/10 border border-red-500/20 rounded-xl">
                          <label className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 block">Group Size</label>
                          <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                              <FiUsers className="absolute left-4 top-3.5 text-zinc-500" />
                              <input
                                type="number"
                                min="2"
                                max="10"
                                value={formData.numberOfGuests}
                                onChange={handleNumberOfGuestsChange}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 transition-all"
                              />
                            </div>
                            <div className="text-sm text-zinc-400 w-1/2">
                              Min 2 - Max 10 Guests
                            </div>
                          </div>

                          <div className="mt-4 flex items-start gap-3">
                            <div className="relative flex items-center h-6">
                              <input
                                type="checkbox"
                                id="genderConfirm"
                                checked={formData.genderConfirmed}
                                onChange={handleGenderConfirmChange}
                                className="h-5 w-5 rounded border-zinc-600 bg-zinc-900 text-red-600 focus:ring-red-500 focus:ring-offset-zinc-900"
                              />
                            </div>
                            <label htmlFor="genderConfirm" className="text-sm text-zinc-300">
                              I confirm that <b className="text-white">ALL {formData.numberOfGuests} guests</b> are {formData.gender === 'MALE' ? 'Male' : 'Female'}.
                              Mixed gender groups are <span className="text-red-400 font-semibold underline decoration-wavy">Strictly Not Allowed</span>.
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
                  >
                    <FiChevronLeft /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                  >
                    Next Step <FiChevronRight />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">Review & Pay</h2>
                  <p className="text-zinc-400">Review your details and complete the booking.</p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-zinc-800 pb-3">Booking Summary</h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500">Name</p>
                      <p className="text-white font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Contact</p>
                      <p className="text-white font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Type</p>
                      <p className="text-white font-medium capitalize">{formData.bookingType.toLowerCase()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Guests</p>
                      <p className="text-white font-medium">{formData.numberOfGuests} {formData.gender === 'MALE' ? '(Male)' : '(Female)'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-zinc-400">Total Amount</span>
                    <span className="text-3xl font-bold text-white">₹{totalAmount}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-6">Tax inclusive for {formData.numberOfGuests} person(s)</p>

                  <div className="bg-orange-600/10 border border-orange-600/20 rounded-lg p-4 mb-6 flex gap-3">
                    <FiCreditCard className="text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-orange-200 font-medium mb-1">Payment Gateway Offline</p>
                      <p className="text-orange-200/60 leading-relaxed">
                        Online payments are currently disabled. Proceeding will save your booking request. We will contact you for payment collection.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
                    >
                      <FiChevronLeft /> Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiCheck /> Confirm Booking
                        </>
                      )}
                    </button>
                  </div>
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
