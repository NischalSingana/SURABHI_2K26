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
  FiShield,
  FiInfo,
  FiHome,
  FiGift,
  FiCoffee,
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
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleNumberOfGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleGenderConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, genderConfirmed: e.target.checked });
  };

  const canProceedToConfirm = () => {
    if (!formData.bookingType) return false;
    if (!formData.name || !formData.email || !formData.phone) return false;

    if (formData.bookingType === "GROUP") {
      if (!formData.genderConfirmed) return false;
      if (formData.numberOfGuests < 2) return false;
    }

    return true;
  };

  const handleSubmit = async () => {
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
        setIsSuccess(true);
        toast.success("Accommodation confirmed!");
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
    { number: 3, title: "Confirm" },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden p-6">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-500/10 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center relative z-10"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="text-4xl text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">You're All Set!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Your accommodation has been successfully confirmed. We look forward to hosting you at Surabhi 2026.
          </p>
          <div className="p-4 bg-zinc-800/50 rounded-xl mb-6 border border-zinc-800">
            <p className="text-sm text-green-400 font-medium flex items-center justify-center gap-2">
              <FiGift /> Complimentary Food Included
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row relative overflow-hidden pt-20 lg:pt-24">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Left Panel - Info & Value Props */}
      <div className="w-full lg:w-1/3 lg:min-h-[calc(100vh-6rem)] lg:sticky lg:top-24 bg-zinc-900/30 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-zinc-800 p-8 flex flex-col justify-between z-10">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/20">
              <FiHome className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Student Stay</h1>
              <p className="text-zinc-500 text-sm">Official Accommodation</p>
            </div>
          </motion.div>

          <div className="space-y-6">
            {/* Free Accommodation Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-2xl border border-zinc-700/50 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <FiGift size={64} />
              </div>
              <h3 className="font-semibold text-white text-lg mb-1">100% Free Stay</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                We provide free accommodation for all out-station participants registered for Surabhi events.
              </p>
              <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/20">
                ZERO COST
              </span>
            </motion.div>

            {/* Food Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-2xl border border-zinc-700/50 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <FiCoffee size={64} />
              </div>
              <h3 className="font-semibold text-white text-lg mb-1">Complimentary Food</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Delicious breakfast, lunch, and dinner is on us. Enjoy a comfortable stay with full hospitality.
              </p>
            </motion.div>

            {/* Rules */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-800/30 p-5 rounded-2xl border border-zinc-700/30"
            >
              <h3 className="font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <FiShield className="text-purple-400" /> Key Guidelines
              </h3>
              <ul className="space-y-3 text-zinc-400 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" />
                  Separate hostels for Boys and Girls.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" />
                  Strictly no mixed-gender groups.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" />
                  Carry valid college ID card.
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        <div className="hidden lg:block mt-8 pl-1">
          <p className="text-zinc-600 text-xs">Need help? <a href="mailto:surabhi@kluniversity.in" className="text-zinc-400 hover:text-white transition-colors">surabhi@kluniversity.in</a></p>
        </div>
      </div>

      {/* Right Panel - Form Wizard */}
      <div className="flex-1 flex flex-col p-6 lg:p-12 z-10 overflow-y-auto">
        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto w-full mb-12">
          <div className="flex justify-between items-center relative px-2">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-zinc-800 -z-10 rounded-full" />
            <div
              className="absolute left-0 top-1/2 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 -z-10 transition-all duration-500 rounded-full"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center gap-2 relative">
                <div
                  onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 bg-black ${currentStep === step.number
                    ? "border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-110"
                    : step.number < currentStep
                      ? "border-purple-500 text-purple-500 cursor-pointer"
                      : "border-zinc-800 text-zinc-600"
                    }`}
                >
                  {step.number < currentStep ? <FiCheck size={18} /> : step.number}
                </div>
                <span className={`text-xs font-semibold tracking-wider uppercase ${currentStep >= step.number ? "text-white" : "text-zinc-600"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3">Select Gender</h2>
                  <p className="text-zinc-400">To ensure proper hostel allocation, please select your gender.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Male Option */}
                  <button
                    onClick={() => handleGenderSelect("MALE")}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] group text-left h-48 flex flex-col justify-between ${formData.gender === "MALE"
                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                      : "border-zinc-800 bg-zinc-900 hover:border-blue-500/50"
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${formData.gender === "MALE" ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:bg-blue-500/20 group-hover:text-blue-400"}`}>
                      <FiUser size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Male Hostel</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Boys Accommodation</p>
                    </div>
                  </button>

                  {/* Female Option */}
                  <button
                    onClick={() => handleGenderSelect("FEMALE")}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] group text-left h-48 flex flex-col justify-between ${formData.gender === "FEMALE"
                      ? "border-pink-500 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.15)]"
                      : "border-zinc-800 bg-zinc-900 hover:border-pink-500/50"
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${formData.gender === "FEMALE" ? "bg-pink-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:bg-pink-500/20 group-hover:text-pink-400"}`}>
                      <FiUser size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Female Hostel</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Girls Accommodation</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3">Your Details</h2>
                  <p className="text-zinc-400">Fill in your information to reserve your spot.</p>
                </div>

                <div className="space-y-6">
                  {/* Booking Type */}
                  <div className="p-1 bg-zinc-900 border border-zinc-800 rounded-xl grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleBookingTypeSelect("INDIVIDUAL")}
                      className={`py-3 rounded-lg font-medium transition-all duration-300 ${formData.bookingType === "INDIVIDUAL"
                        ? "bg-zinc-800 text-white shadow-lg"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                      Individual
                    </button>
                    <button
                      onClick={() => handleBookingTypeSelect("GROUP")}
                      className={`py-3 rounded-lg font-medium transition-all duration-300 ${formData.bookingType === "GROUP"
                        ? "bg-zinc-800 text-white shadow-lg"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                      Group Booking
                    </button>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700"
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700"
                        placeholder="Email Address"
                      />
                    </div>
                    <div className="relative group">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>

                  {/* Group Options */}
                  <AnimatePresence>
                    {formData.bookingType === "GROUP" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4 mt-2">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-zinc-400">Number of Guests</label>
                            <span className="text-xl font-bold text-white">{formData.numberOfGuests}</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            value={formData.numberOfGuests}
                            onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <p className="text-xs text-zinc-500 text-right">Max 10 guests allowed per group</p>

                          <div className="pt-2 border-t border-zinc-800/50 mt-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                              <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${formData.genderConfirmed ? "bg-purple-500 border-purple-500" : "border-zinc-600 bg-zinc-800"}`}>
                                {formData.genderConfirmed && <FiCheck size={14} className="text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={formData.genderConfirmed}
                                onChange={handleGenderConfirmChange}
                                className="hidden"
                              />
                              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                I confirm that <strong className="text-white">all guests are {formData.gender === 'MALE' ? 'Male' : 'Female'}</strong>. Mixed gender accommodation is not allowed.
                              </span>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <FiChevronLeft /> Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedToConfirm()}
                      className="flex-1 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      Continue <FiChevronRight />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3">Review & Confirm</h2>
                  <p className="text-zinc-400">One last step to secure your free stay.</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/50">
                  <div className="p-6">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Guest Details</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.gender === 'MALE' ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-500'}`}>
                        <FiUser size={24} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{formData.name}</p>
                        <p className="text-zinc-500 text-sm">{formData.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-500 mb-1">Phone</p>
                        <p className="text-white font-medium">{formData.phone}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 mb-1">Guests</p>
                        <p className="text-white font-medium">{formData.numberOfGuests} {formData.gender === 'MALE' ? 'Males' : 'Females'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-zinc-900 to-black">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-400">Accommodation Fee</span>
                      <span className="text-zinc-400 line-through">₹500.00</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800/50 pb-4 mb-4">
                      <span className="text-zinc-400">Food & Amenities</span>
                      <span className="text-zinc-400 line-through">₹200.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-white">Total to Pay</span>
                      <div className="text-right">
                        <span className="block text-2xl font-bold text-green-500">₹0.00</span>
                        <span className="text-[10px] text-green-500/80 uppercase tracking-widest font-bold">Free of Cost</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <FiChevronLeft /> Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Confirm Booking <FiCheck />
                      </>
                    )}
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
