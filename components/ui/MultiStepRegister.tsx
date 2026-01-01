"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiCalendar,
  FiCreditCard,
  FiUpload,
  FiChevronRight,
  FiChevronLeft,
  FiCheck
} from "react-icons/fi";
import { useSession } from "@/lib/auth-client";
import SignInOAuthButton from "./signInOAuthButton";

type College = "KL_UNIVERSITY" | "OTHER" | "";

interface RegistrationData {
  college: College;
  collegeName?: string;
  name: string;
  email: string;
  phone: string;
  collageId: string;
  branch: string;
  year: number;
  transactionId: string;
  paymentProof: File | null;
}

const COLLEGES = [
  "KL University",
  "Other College"
];

const BRANCHES = [
  "Computer Science Engineering",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Artificial Intelligence and Machine Learning",
  "Data Science",
  "Other"
];

const MultiStepRegister = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    college: "",
    collegeName: "",
    name: "",
    email: "",
    phone: "",
    collageId: "",
    branch: "",
    year: 1,
    transactionId: "",
    paymentProof: null,
  });

  // Auto-fill data after OAuth login
  useEffect(() => {
    if (session?.user && currentStep === 2 && !hasAutoAdvanced) {
      // User is logged in at step 2, check if we have saved college selection
      const savedCollege = localStorage.getItem("selectedCollege");
      const savedCollegeName = localStorage.getItem("selectedCollegeName");

      if (savedCollege && savedCollegeName) {
        // Mark as auto-advanced first to prevent re-triggering
        setHasAutoAdvanced(true);

        // Restore college selection and fill in user data
        setFormData(prev => ({
          ...prev,
          college: savedCollege as College,
          collegeName: savedCollegeName,
          name: session.user.name || "",
          email: session.user.email || "",
        }));

        // Small delay to ensure state is updated before moving to step 3
        setTimeout(() => {
          setCurrentStep(3);
        }, 100);
      }
    }
  }, [session?.user?.id, currentStep, hasAutoAdvanced]);

  // Check if user is already registered on component mount
  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!session?.user) {
        // If no session, do not clear any saved college selection
        return;
      }

      try {
        const response = await fetch("/api/check-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.isRegistered) {
            toast.error("Account already registered. You cannot register again.");
            // Do not clear localStorage before redirecting
            router.push("/profile");
          }
        }
      } catch (error) {
        // Silently fail - user can continue
      }
    };

    checkExistingRegistration();
  }, [session, router]);

  const handleCollegeSelect = (college: string) => {
    const collegeType = college === "KL University" ? "KL_UNIVERSITY" : "OTHER";

    // Save to localStorage before OAuth redirect
    localStorage.setItem("selectedCollege", collegeType);
    localStorage.setItem("selectedCollegeName", college);

    setFormData({ ...formData, college: collegeType, collegeName: college });
    setCurrentStep(2);
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, paymentProof: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate college name is set
      if (!formData.collegeName) {
        toast.error("College selection is missing. Please start over.");
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === "paymentProof" && value instanceof File) {
            submitData.append(key, value);
          } else {
            submitData.append(key, String(value));
          }
        }
      });

      // TODO: Replace with your actual API endpoint
      const response = await fetch("/api/register", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const result = await response.json();

      // Clear localStorage after successful registration
      localStorage.removeItem("selectedCollege");
      localStorage.removeItem("selectedCollegeName");

      toast.success(result.message || "Registration successful!");
      router.push("/profile");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  const canProceedToStep3 = () => {
    return formData.name && formData.email;
  };

  const canSubmit = () => {
    const basicFieldsFilled =
      formData.phone &&
      formData.collageId &&
      formData.branch &&
      formData.year;

    // KL University students don't need payment fields
    if (formData.college === "KL_UNIVERSITY") {
      return basicFieldsFilled;
    }

    // Other college students need payment fields
    return (
      basicFieldsFilled &&
      formData.transactionId &&
      formData.paymentProof
    );
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div className="w-full min-h-screen py-10 bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Surabhi 2025 Registration</h1>
          <p className="text-zinc-400">Complete your registration in 3 simple steps</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full px-6 mb-8">
        <div className="max-w-4xl mx-auto">
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
            <span>College Selection</span>
            <span>Authentication</span>
            <span>Complete Profile</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 w-full px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: College Selection */}
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
                    Select Your College
                  </h2>
                  <p className="text-zinc-400">
                    Choose your institution to continue registration
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {COLLEGES.map((college) => (
                      <motion.button
                        key={college}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCollegeSelect(college)}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${college === "KL University"
                          ? "border-orange-500 bg-orange-500/10 hover:bg-orange-500/20"
                          : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">
                            {college}
                          </span>
                          <FiChevronRight className="text-zinc-400" />
                        </div>
                        {college === "KL University" && (
                          <p className="text-sm text-orange-300 mt-2">
                            Microsoft authentication required
                          </p>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: OAuth Authentication */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {!session?.user ? (
                  <>
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Authenticate Your Account
                      </h2>
                      <p className="text-zinc-400">
                        Sign in to continue registration for {formData.collegeName}
                      </p>
                    </div>

                    <div className="space-y-6">
                      {formData.college === "KL_UNIVERSITY" && (
                        <>
                          <div className="">
                            <p className="text-red-500 text-sm font-medium">
                              Important: All KL University students must login with
                              their official college email ID (@kluniversity.in)
                            </p>
                          </div>

                          <SignInOAuthButton provider="microsoft" signup={true} />
                        </>
                      )}

                      {formData.college === "OTHER" && (
                        <SignInOAuthButton provider="google" signup={true} />
                      )}

                      <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full px-8 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <FiChevronLeft />
                        Back to College Selection
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Authentication Successful
                      </h2>
                      <p className="text-zinc-400">
                        Welcome, {session.user.name}! Click next to complete your profile.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-green-300 text-sm font-medium">
                          ✓ Authenticated as {session.user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          // Fill in user data before proceeding
                          const savedCollege = localStorage.getItem("selectedCollege");
                          const savedCollegeName = localStorage.getItem("selectedCollegeName");

                          if (savedCollege && savedCollegeName) {
                            setFormData(prev => ({
                              ...prev,
                              college: savedCollege as College,
                              collegeName: savedCollegeName,
                              name: session.user.name || "",
                              email: session.user.email || "",
                            }));
                          }
                          setCurrentStep(3);
                        }}
                        className="w-full px-8 py-4 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        Next: Complete Profile
                        <FiChevronRight />
                      </button>

                      <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full px-8 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <FiChevronLeft />
                        Back to College Selection
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Complete Profile */}
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
                    Complete Your Profile
                  </h2>
                  <p className="text-zinc-400">
                    Fill in the remaining details to complete registration
                  </p>
                </div>

                <div className="space-y-6 pr-2">
                  {/* College Name - Only for Other College */}
                  {formData.college === "OTHER" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        College Name *
                      </label>
                      <div className="relative">
                        <FiBook className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                          type="text"
                          name="collegeName"
                          value={formData.collegeName === "Other College" ? "" : formData.collegeName}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          placeholder="Enter your college name"
                        />
                      </div>
                    </div>
                  )}

                  {/* Name (Read-only) */}
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
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
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
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white cursor-not-allowed"
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

                  {/* College ID */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      College ID / Roll Number *
                    </label>
                    <div className="relative">
                      <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        name="collageId"
                        value={formData.collageId}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Enter your college ID"
                      />
                    </div>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Branch / Department *
                    </label>
                    <div className="relative">
                      <FiBook className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <select
                        name="branch"
                        value={BRANCHES.includes(formData.branch) ? formData.branch : (formData.branch ? "Other" : "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            // If user selected "Other", clear the actual value so input shows up empty? 
                            // Or keep it "Other" to trigger input display.
                            // Let's set it to "Other" initially. If they type, it overwrites.
                            setFormData({ ...formData, branch: "Other" });
                          } else {
                            handleInputChange(e);
                          }
                        }}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
                      >
                        <option value="">Select your branch</option>
                        {BRANCHES.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Show input if "Other" is selected or if value is not in the list (custom) */}
                    {((formData.branch === "Other") || (!BRANCHES.includes(formData.branch) && formData.branch !== "")) && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={formData.branch === "Other" ? "" : formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          placeholder="Enter your specific course/branch"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          autoFocus
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Year of Study *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Fields - Only for non-KL students */}
                  {formData.college !== "KL_UNIVERSITY" && (
                    <>
                      {/* Transaction ID */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Payment Transaction ID *
                        </label>
                        <div className="relative">
                          <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            name="transactionId"
                            value={formData.transactionId}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="Enter transaction ID"
                          />
                        </div>
                      </div>

                      {/* Payment Proof */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Payment Proof (Screenshot) *
                        </label>
                        <div className="relative">
                          <FiUpload className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white hover:file:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          />
                        </div>
                        {formData.paymentProof && (
                          <p className="text-sm text-green-400 mt-2">
                            ✓ {formData.paymentProof.name}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Info message for KL students */}
                  {formData.college === "KL_UNIVERSITY" && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <p className="text-green-300 text-sm font-medium">
                        ✓ No payment required for KL University students
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!canSubmit() || isSubmitting}
                    className="w-full px-8 py-4 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Submitting..." : "Complete Registration"}
                    <FiCheck />
                  </motion.button>

                  <button
                    onClick={() => {
                      setCurrentStep(2);
                    }}
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

export default MultiStepRegister;
