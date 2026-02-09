"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiCalendar,
  FiChevronRight,
  FiChevronLeft,
  FiCheck
} from "react-icons/fi";
import { useSession, signOut } from "@/lib/auth-client";
import SignInOAuthButton from "./signInOAuthButton";
import { BRANCHES } from "@/lib/constants";
import SearchableSelect from "./SearchableSelect";
import { COUNTRIES_WITH_DIAL, PROGRAMS_OF_STUDY, getCountryFlag } from "@/lib/registration-data";

type College = "KL_UNIVERSITY" | "OTHER" | "INTERNATIONAL" | "";

interface RegistrationData {
  college: College;
  collegeName?: string;
  name: string;
  email: string;
  phone: string;
  collageId: string;
  branch: string;
  year: number;
  gender: string;
  isInternational?: boolean;
  country?: string;
  state?: string;
  city?: string;
  /** International: dial code for phone (e.g. +1) */
  phoneCountryCode?: string;
  /** International: rest of phone number without country code */
  phoneNumber?: string;
}

const COLLEGES = [
  { label: "KL University", value: "KL University" },
  { label: "Other College (India)", value: "Other College" },
  { label: "International Student", value: "International Student" },
];

const GENDERS = [
  "Male",
  "Female",
  "Other"
];



interface MultiStepRegisterProps {
  existingUserData?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    collage?: string | null;
    collageId?: string | null;
    branch?: string | null;
    year?: number | null;
    gender?: string | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    isInternational?: boolean;
  } | null;
  /** Server-computed missing fields (e.g. State, City/Town) so we can scroll to them for KL users */
  missingFields?: string[];
}

const MultiStepRegister = ({ existingUserData, missingFields = [] }: MultiStepRegisterProps = {}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const stateCitySectionRef = useRef<HTMLDivElement>(null);

  // If user has existing data and is authenticated, start on step 3 so they can complete missing fields
  useEffect(() => {
    if (session?.user && existingUserData && existingUserData.collage && currentStep === 1 && !hasAutoAdvanced) {
      // Ensure college field is set based on existingUserData
      let detectedCollege: College = "";
      let detectedCollegeName = "";
      if (existingUserData.isInternational) {
        detectedCollege = "INTERNATIONAL";
        detectedCollegeName = "International Student";
      } else if (existingUserData.collage === "KL University") {
        detectedCollege = "KL_UNIVERSITY";
        detectedCollegeName = "KL University";
      } else if (existingUserData.collage) {
        detectedCollege = "OTHER";
        detectedCollegeName = existingUserData.collage;
      }

      if (detectedCollege) {
        setFormData(prev => ({
          ...prev,
          college: detectedCollege,
          collegeName: detectedCollegeName,
          isInternational: existingUserData.isInternational || false,
          state: existingUserData.state ?? prev.state,
          city: existingUserData.city ?? prev.city,
          name: existingUserData.name ?? prev.name,
          email: existingUserData.email ?? prev.email,
          phone: existingUserData.phone ?? prev.phone,
          collageId: existingUserData.collageId ?? prev.collageId,
          branch: existingUserData.branch ?? prev.branch,
          year: existingUserData.year ?? prev.year,
          gender: existingUserData.gender ?? prev.gender,
        }));
      }

      setCurrentStep(3);
      setHasAutoAdvanced(true);
    }
  }, [session?.user, existingUserData, currentStep, hasAutoAdvanced]);

  // Initialize form data with existing user data if available
  const getInitialFormData = (): RegistrationData => {
    const defaultData: RegistrationData = {
      college: "",
      collegeName: "",
      name: "",
      email: "",
      phone: "",
      collageId: "",
      branch: "",
      year: 1,
      gender: "",
      country: "",
      state: "",
      city: "",
      phoneCountryCode: "+1",
      phoneNumber: "",
    };

    if (!existingUserData) return defaultData;

    // Parse international phone number if exists
    let phoneCountryCode = "+1";
    let phoneNumber = "";
    const phone = existingUserData.phone || "";
    
    if (existingUserData.isInternational && phone && phone.startsWith("+")) {
      const match = COUNTRIES_WITH_DIAL.slice()
        .sort((a, b) => b.dialCode.length - a.dialCode.length)
        .find((c) => phone.startsWith(c.dialCode));
      if (match) {
        phoneCountryCode = match.dialCode;
        phoneNumber = phone.replace(match.dialCode, "").trim();
      } else {
        phoneNumber = phone;
      }
    } else if (phone) {
      phoneNumber = phone;
    }

    // Determine college type
    let college: College = "";
    let collegeName = "";
    if (existingUserData.isInternational) {
      college = "INTERNATIONAL";
      collegeName = "International Student";
    } else if (existingUserData.collage === "KL University") {
      college = "KL_UNIVERSITY";
      collegeName = "KL University";
    } else if (existingUserData.collage) {
      college = "OTHER";
      collegeName = existingUserData.collage;
    }

    return {
      ...defaultData,
      college,
      collegeName,
      name: existingUserData.name || "",
      email: existingUserData.email || "",
      phone: phone || "",
      phoneCountryCode,
      phoneNumber,
      collageId: existingUserData.collageId || "",
      branch: existingUserData.branch || "",
      year: existingUserData.year || 1,
      gender: existingUserData.gender || "",
      country: existingUserData.country || "",
      state: existingUserData.state || "",
      city: existingUserData.city || "",
      isInternational: existingUserData.isInternational || false,
    };
  };

  const [formData, setFormData] = useState<RegistrationData>(getInitialFormData());

  // Validation Functions
  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    if (!phone || !phone.trim()) {
      return { valid: false, error: "Phone number is required" };
    }
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!/^\d{10}$/.test(cleaned)) {
      return { valid: false, error: "Phone number must be exactly 10 digits" };
    }
    return { valid: true };
  };

  const validateInternationalPhone = (phone: string): { valid: boolean; error?: string } => {
    if (!phone || !phone.trim()) {
      return { valid: false, error: "Phone number is required" };
    }
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!/^\d{6,15}$/.test(cleaned)) {
      return { valid: false, error: "Phone number must be 6-15 digits" };
    }
    return { valid: true };
  };

  const validateName = (name: string): { valid: boolean; error?: string } => {
    if (!name || !name.trim()) {
      return { valid: false, error: "Name is required" };
    }
    if (name.trim().length < 2) {
      return { valid: false, error: "Name must be at least 2 characters" };
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
      return { valid: false, error: "Name can only contain letters, spaces, dots, hyphens, and apostrophes" };
    }
    return { valid: true };
  };

  const validateCollegeName = (name: string): { valid: boolean; error?: string } => {
    if (!name || !name.trim()) {
      return { valid: false, error: "College/Institution name is required" };
    }
    if (name.trim().length < 3) {
      return { valid: false, error: "College/Institution name must be at least 3 characters" };
    }
    if (name.trim().length > 100) {
      return { valid: false, error: "College/Institution name must not exceed 100 characters" };
    }
    return { valid: true };
  };

  const validateCollegeId = (id: string): { valid: boolean; error?: string } => {
    if (!id || !id.trim()) {
      return { valid: false, error: "College ID is required" };
    }
    if (id.trim().length < 4) {
      return { valid: false, error: "College ID must be at least 4 characters" };
    }
    if (!/^[a-zA-Z0-9\-/]+$/.test(id.trim())) {
      return { valid: false, error: "College ID can only contain letters, numbers, hyphens, and slashes" };
    }
    return { valid: true };
  };

  const validateStateRegion = (state: string): { valid: boolean; error?: string } => {
    if (!state || !state.trim()) {
      return { valid: false, error: "State/Region is required" };
    }
    if (state.trim().length < 2) {
      return { valid: false, error: "State/Region must be at least 2 characters" };
    }
    return { valid: true };
  };

  const validateCity = (city: string): { valid: boolean; error?: string } => {
    if (!city || !city.trim()) {
      return { valid: false, error: "City/Town is required" };
    }
    if (city.trim().length < 2) {
      return { valid: false, error: "City/Town must be at least 2 characters" };
    }
    return { valid: true };
  };

  // Auto-detect college from localStorage or existingUserData and skip to registration
  useEffect(() => {
    if (session?.user && currentStep === 1 && !hasAutoAdvanced) {
      // Check if we have saved college selection from OAuth flow
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

        // DISABLED: Automatic redirect causes issues - users should navigate manually
        // Skip directly to step 3 (registration form)
        // setTimeout(() => {
        //   setCurrentStep(3);
        // }, 100);
      } else if (existingUserData && existingUserData.collage) {
        // If user has existing data but no saved college selection, auto-detect from existingUserData
        // This handles the case when KLU students are redirected to complete their profile
        setHasAutoAdvanced(true);
        
        let detectedCollege: College = "";
        let detectedCollegeName = "";
        if (existingUserData.isInternational) {
          detectedCollege = "INTERNATIONAL";
          detectedCollegeName = "International Student";
        } else if (existingUserData.collage === "KL University") {
          detectedCollege = "KL_UNIVERSITY";
          detectedCollegeName = "KL University";
        } else if (existingUserData.collage) {
          detectedCollege = "OTHER";
          detectedCollegeName = existingUserData.collage;
        }

        if (detectedCollege) {
          setFormData(prev => ({
            ...prev,
            college: detectedCollege,
            collegeName: detectedCollegeName,
            name: session.user.name || prev.name || "",
            email: session.user.email || prev.email || "",
            isInternational: existingUserData.isInternational ?? false,
            state: existingUserData.state ?? prev.state ?? "",
            city: existingUserData.city ?? prev.city ?? "",
            phone: existingUserData.phone ?? prev.phone,
            collageId: existingUserData.collageId ?? prev.collageId,
            branch: existingUserData.branch ?? prev.branch,
            year: existingUserData.year ?? prev.year,
            gender: existingUserData.gender ?? prev.gender,
          }));

          // Auto-advance to step 3 if user is authenticated and has incomplete data
          // This ensures KLU students can see and fill in state/city fields
          setTimeout(() => {
            setCurrentStep(3);
          }, 100);
        }
      }
    }
  }, [session?.user?.id, currentStep, hasAutoAdvanced, existingUserData]);

  // Scroll to State/City when they are missing so KL users can fill them (e.g. redirect with prefilled data)
  const needsStateOrCity = missingFields.some((f) => f === "State" || f === "City/Town");
  useEffect(() => {
    if (currentStep === 3 && needsStateOrCity && stateCitySectionRef.current) {
      const t = setTimeout(() => {
        stateCitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return () => clearTimeout(t);
    }
  }, [currentStep, needsStateOrCity]);

  // Prevent navigation away from registration page until complete
  useEffect(() => {
    // Only apply lock if user is authenticated, on step 3, and registration not complete
    if (session?.user && currentStep === 3 && !registrationComplete) {
      // Warn user before leaving/refreshing page
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
        return ""; // Required for some browsers
      };

      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
  }, [session?.user, currentStep, registrationComplete]);


  // Check if user is already registered on component mount
  const hasCheckedRegistration = useRef(false);

  useEffect(() => {
    const checkExistingRegistration = async () => {
      if (!session?.user || hasCheckedRegistration.current) {
        // If no session or already checked, skip
        return;
      }

      // Mark as checked to prevent multiple calls
      hasCheckedRegistration.current = true;

      try {
        const response = await fetch("/api/check-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });

        if (response.ok) {
          const data = await response.json();
          // Don't redirect or show error - just pre-fill data if available
          // Backend will handle duplicate registration attempts
          if (data.userData) {
            const ud = data.userData as { collage?: string; phone?: string; collageId?: string; branch?: string; year?: number; gender?: string; isInternational?: boolean; country?: string; state?: string; city?: string };
            const phone = ud.phone || "";
            let phoneCountryCode = "+1";
            let phoneNumber = "";
            if (ud.isInternational && phone && phone.startsWith("+")) {
              const match = COUNTRIES_WITH_DIAL.slice()
                .sort((a, b) => b.dialCode.length - a.dialCode.length)
                .find((c) => phone.startsWith(c.dialCode));
              if (match) {
                phoneCountryCode = match.dialCode;
                phoneNumber = phone.replace(match.dialCode, "").trim();
              } else {
                phoneNumber = phone;
              }
            } else if (phone) {
              phoneNumber = phone;
            }
            setFormData((prev) => ({
              ...prev,
              collegeName: ud.collage || prev.collegeName,
              phone: phone || prev.phone,
              phoneCountryCode,
              phoneNumber,
              collageId: ud.collageId || prev.collageId,
              branch: ud.branch || prev.branch,
              year: ud.year ?? prev.year,
              gender: ud.gender || prev.gender,
              isInternational: ud.isInternational ?? prev.isInternational,
              country: ud.country || prev.country || "",
              state: ud.state || prev.state || "",
              city: ud.city || prev.city || "",
            }));
          }
        }
      } catch (error) {
        console.error("Registration check error:", error);
        // On error, allow user to continue with registration
      }
    };

    checkExistingRegistration();
  }, [session?.user?.id]);

  const handleCollegeSelect = async (college: string) => {
    const collegeType: College = college === "KL University" ? "KL_UNIVERSITY" : college === "International Student" ? "INTERNATIONAL" : "OTHER";

    // If user is already authenticated but switching college type, sign them out
    if (session?.user && formData.college && formData.college !== collegeType) {
      try {
        toast.info("Switching college type. Please sign in with the appropriate account.");

        // Save to localStorage first
        localStorage.setItem("selectedCollege", collegeType);
        localStorage.setItem("selectedCollegeName", college);

        // Sign out the user using auth-client
        await signOut();

        // Update state and go to Step 2 - the page will reload automatically after signOut
        return;
      } catch (error) {
        console.error("Sign out error:", error);
      }
    }

    // If it's OTHER college, preserve existing college name if autofilled
    let finalCollegeName = college;
    if (collegeType === "OTHER") {
      if (formData.collegeName && formData.collegeName !== "Other College") {
        finalCollegeName = formData.collegeName;
      }
    }
    if (collegeType === "INTERNATIONAL") {
      finalCollegeName = "International Student";
    }

    // Save to localStorage before OAuth redirect
    localStorage.setItem("selectedCollege", collegeType);
    localStorage.setItem("selectedCollegeName", finalCollegeName);

    setFormData({ ...formData, college: collegeType, collegeName: finalCollegeName });
    setCurrentStep(2);
  };


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

      // Validate name
      const nameValidation = validateName(formData.name);
      if (!nameValidation.valid) {
        toast.error(nameValidation.error);
        setIsSubmitting(false);
        return;
      }

      // Validate KL University email domain (not for international)
      if (formData.college === "KL_UNIVERSITY") {
        const emailDomain = formData.email.split("@")[1];
        if (emailDomain !== "kluniversity.in") {
          toast.error("Please login with your official KL University email ID (@kluniversity.in)");
          setIsSubmitting(false);
          return;
        }
      }

      // Validate phone number
      if (formData.college === "INTERNATIONAL") {
        const phoneValidation = validateInternationalPhone(formData.phoneNumber || "");
        if (!phoneValidation.valid) {
          toast.error(phoneValidation.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const phoneValidation = validatePhone(formData.phone);
        if (!phoneValidation.valid) {
          toast.error(phoneValidation.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate college name for OTHER and INTERNATIONAL
      if (formData.college === "OTHER" || formData.college === "INTERNATIONAL") {
        const collegeNameValidation = validateCollegeName(formData.collegeName);
        if (!collegeNameValidation.valid) {
          toast.error(collegeNameValidation.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate college ID (not for international)
      if (formData.college !== "INTERNATIONAL") {
        const collegeIdValidation = validateCollegeId(formData.collageId);
        if (!collegeIdValidation.valid) {
          toast.error(collegeIdValidation.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate state for all users
      const stateValidation = validateStateRegion(formData.state || "");
      if (!stateValidation.valid) {
        toast.error(stateValidation.error);
        setIsSubmitting(false);
        return;
      }

      // Validate city for KL and Other college students
      if (formData.college !== "INTERNATIONAL") {
        const cityValidation = validateCity(formData.city || "");
        if (!cityValidation.valid) {
          toast.error(cityValidation.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Validate country for international
      if (formData.college === "INTERNATIONAL") {
        if (!formData.country || !formData.country.trim()) {
          toast.error("Please select your country");
          setIsSubmitting(false);
          return;
        }
      }

      const submitData = new FormData();
      const dataToSubmit = { ...formData };
      if (formData.college === "INTERNATIONAL") {
        const fullPhone = [formData.phoneCountryCode || "+1", (formData.phoneNumber || "").trim()].filter(Boolean).join(" ").trim() || formData.phone;
        dataToSubmit.phone = fullPhone;
        submitData.set("isInternational", "true");
      }
      Object.entries(dataToSubmit).forEach(([key, value]) => {
        if (value !== null && value !== "" && key !== "phoneCountryCode" && key !== "phoneNumber") {
          submitData.append(key, String(value));
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

      // Mark registration as complete to allow navigation
      setRegistrationComplete(true);

      toast.success(result.message || "Registration successful!");

      // Reload the page to refresh session data
      // This ensures the ConditionalNavbar gets the updated user data
      // and removes the navigation lock
      setTimeout(() => {
        window.location.href = "/"; // Use window.location to force a full page reload
      }, 1000); // Increased delay to show success message
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
    // International: name, email, phone, country, state, institution, program, gender
    if (formData.college === "INTERNATIONAL") {
      const fullPhone = [formData.phoneCountryCode || "+1", (formData.phoneNumber || "").trim()].filter(Boolean).join(" ").trim();
      const institution = formData.collegeName && formData.collegeName.trim() !== "" && formData.collegeName !== "International Student";
      const program = formData.branch && formData.branch.trim() && formData.branch !== "Other";
      return !!(
        fullPhone &&
        formData.country &&
        formData.state?.trim() &&
        formData.gender &&
        institution &&
        program
      );
    }

    const basicFieldsFilled =
      formData.phone &&
      formData.collageId &&
      formData.branch &&
      formData.year &&
      formData.gender &&
      formData.state?.trim() &&
      formData.city?.trim();

    if (formData.college === "OTHER") {
      return (
        basicFieldsFilled &&
        formData.collegeName &&
        formData.collegeName !== "Other College"
      );
    }

    return basicFieldsFilled;
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div className="w-full min-h-screen py-12 bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Surabhi 2026 Registration</h1>
          <p className="text-base text-zinc-400">Complete your registration in 3 simple steps</p>
          {session?.user && currentStep === 3 && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-300 text-base font-medium">
                ⚠️ Please complete all fields to finish registration. You cannot navigate away until registration is complete.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full px-6 mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-6 h-1.5 bg-zinc-800" style={{ left: '8.33%', right: '8.33%' }} />

            {/* Animated Progress Line */}
            <div
              className="absolute top-6 left-0 h-1.5 bg-green-500 transition-all duration-500"
              style={{
                left: '8.33%',
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '41.67%' : '83.33%'
              }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-full mb-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep > 1
                      ? "bg-green-500 text-white"
                      : currentStep === 1
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-500"
                      }`}
                  >
                    {currentStep > 1 ? <FiCheck /> : 1}
                  </div>
                </div>
                <span className="text-base text-zinc-400 text-center">College Selection</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-full mb-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep > 2
                      ? "bg-green-500 text-white"
                      : currentStep === 2
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-500"
                      }`}
                  >
                    {currentStep > 2 ? <FiCheck /> : 2}
                  </div>
                </div>
                <span className="text-base text-zinc-400 text-center">Authentication</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-full mb-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep > 3
                      ? "bg-green-500 text-white"
                      : currentStep === 3
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-500"
                      }`}
                  >
                    {currentStep > 3 ? <FiCheck /> : 3}
                  </div>
                </div>
                <span className="text-base text-zinc-400 text-center">Complete Profile</span>
              </div>
            </div>
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
                  <p className="text-base text-zinc-400">
                    Choose your institution to continue registration
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {COLLEGES.map((college) => (
                      <motion.button
                        key={college.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCollegeSelect(college.value)}
                        className="p-8 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-red-600 hover:bg-red-600/10 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-white">
                            {college.label}
                          </span>
                          <FiChevronRight className="text-zinc-400 text-2xl" />
                        </div>
                        {college.value === "KL University" && (
                          <p className="text-base text-zinc-400 mt-3">
                            Microsoft authentication required
                          </p>
                        )}
                        {college.value === "International Student" && (
                          <p className="text-base text-zinc-400 mt-3">
                            Free registration · Google sign-in · Virtual participation
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
                      <p className="text-base text-zinc-400">
                        Sign in to continue registration for {formData.collegeName}
                      </p>
                    </div>

                    <div className="space-y-6">
                      {formData.college === "KL_UNIVERSITY" && (
                        <>
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                            <p className="text-red-400 text-base font-medium">
                              Important: All KL University students must login with
                              their official college email ID (@kluniversity.in)
                            </p>
                          </div>

                          <SignInOAuthButton provider="microsoft" signup={true} collegeType="KL_UNIVERSITY" />
                        </>
                      )}

                      {formData.college === "OTHER" && (
                        <SignInOAuthButton provider="google" signup={true} collegeType="OTHER" />
                      )}

                      {formData.college === "INTERNATIONAL" && (
                        <>
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <p className="text-green-300 text-base font-medium">
                              Free registration for international students. Sign in with Google to continue. All competitions are virtual with virtual evaluation by judges.
                            </p>
                          </div>
                          <SignInOAuthButton provider="google" signup={true} collegeType="INTERNATIONAL" />
                        </>
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
                              isInternational: savedCollege === "INTERNATIONAL",
                            }));
                          }
                          setCurrentStep(3);
                        }}
                        className="w-full px-8 py-4 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium flex items-center justify-center gap-2"
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
                  <p className="text-base text-zinc-400">
                    Fill in the remaining details to complete registration
                  </p>
                  {(formData.phone || formData.collageId || formData.branch) && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        ℹ️ Some fields are pre-filled with your existing data. Please fill in any empty fields to complete your registration.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-8 pr-2">
                  {/* International Student: Free registration, virtual participation */}
                  {formData.college === "INTERNATIONAL" && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-green-300 text-sm font-medium">
                        ✓ Free registration. All competitions are virtual for international students; evaluations will be conducted virtually by judges.
                      </p>
                    </div>
                  )}

                  {/* College Name - Only for Other College */}
                  {formData.college === "OTHER" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        College Name *
                      </label>
                      <div className="relative">
                        <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                        <input
                          type="text"
                          name="collegeName"
                          value={formData.collegeName === "Other College" ? "" : formData.collegeName}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 100) {
                              setFormData({ ...formData, collegeName: value });
                            }
                          }}
                          required
                          maxLength={100}
                          className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          placeholder="Enter your college name"
                        />
                        {formData.collegeName && formData.collegeName !== "Other College" && formData.collegeName.length < 3 && (
                          <p className="text-xs text-amber-400 mt-1">College name must be at least 3 characters</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Name (Editable for Google, Read-only for Microsoft) */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => {
                          if (formData.college === "KL_UNIVERSITY") return;
                          const value = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
                          if (value.length <= 50) {
                            setFormData({ ...formData, name: value });
                          }
                        }}
                        readOnly={formData.college === "KL_UNIVERSITY"}
                        maxLength={50}
                        className={`w-full pl-12 pr-4 py-3 text-base border border-zinc-700 rounded-lg text-white ${formData.college === "KL_UNIVERSITY"
                          ? "bg-zinc-800/50 cursor-not-allowed"
                          : "bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          }`}
                        placeholder="Enter your full name"
                      />
                      {formData.name && formData.name.length < 2 && formData.college !== "KL_UNIVERSITY" && (
                        <p className="text-xs text-amber-400 mt-1">Name must be at least 2 characters</p>
                      )}
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Phone - Domestic: single input; International: country code dropdown + number */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Phone Number * {formData.college === "INTERNATIONAL" && "(with country code)"}
                    </label>
                    {formData.college === "INTERNATIONAL" ? (
                      <div className="flex gap-2">
                        <div className="w-[200px] shrink-0">
                          <SearchableSelect
                            options={COUNTRIES_WITH_DIAL.map((c) => ({
                              value: c.dialCode,
                              label: `${getCountryFlag(c.iso2)} ${c.iso3} (${c.dialCode})`,
                            }))}
                            value={formData.phoneCountryCode || "+1"}
                            onChange={(v) => setFormData((prev) => ({ ...prev, phoneCountryCode: v }))}
                            placeholder="Country / Code"
                            searchPlaceholder="Search country or code..."
                            required
                            displayLabel={true}
                            matchInputHeight
                          />
                        </div>
                        <div className="relative flex-1">
                          <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg pointer-events-none" />
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              if (value.length <= 15) {
                                setFormData((prev) => ({ ...prev, phoneNumber: value }));
                              }
                            }}
                            required
                            maxLength={15}
                            className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                            placeholder="e.g. 2345678900"
                          />
                          {formData.phoneNumber && (formData.phoneNumber.length < 6 || formData.phoneNumber.length > 15) && (
                            <p className="text-xs text-amber-400 mt-1">
                              {formData.phoneNumber.length < 6 ? `${6 - formData.phoneNumber.length} more digits needed` : "Maximum 15 digits"}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 10) {
                              setFormData({ ...formData, phone: value });
                            }
                          }}
                          required
                          maxLength={10}
                          className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          placeholder="10-digit mobile number"
                        />
                        {formData.phone && formData.phone.length !== 10 && (
                          <p className="text-xs text-amber-400 mt-1">{formData.phone.length}/10 digits</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* State - For KL and Other College (mandatory) */}
                  {formData.college !== "INTERNATIONAL" && (
                    <div ref={stateCitySectionRef} className="space-y-6">
                      {needsStateOrCity && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <p className="text-amber-300 text-sm font-medium">
                            Please fill in State and City / Town below to complete your profile.
                          </p>
                        </div>
                      )}
                      <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        State *
                      </label>
                      <div className="relative">
                        <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                        <input
                          type="text"
                          name="state"
                          value={formData.state || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 50) {
                              setFormData({ ...formData, state: value });
                            }
                          }}
                          required
                          maxLength={50}
                          className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          placeholder="Enter your state (e.g., Andhra Pradesh, Karnataka)"
                        />
                        {formData.state && formData.state.length < 2 && (
                          <p className="text-xs text-amber-400 mt-1">State must be at least 2 characters</p>
                        )}
                      </div>
                      </div>
                      {/* City/Town - For KL and Other College (mandatory) */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          City / Town *
                        </label>
                        <div className="relative">
                          <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                          <input
                            type="text"
                            name="city"
                            value={formData.city || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 50) {
                                setFormData({ ...formData, city: value });
                              }
                            }}
                            required
                            maxLength={50}
                            className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                            placeholder="Enter your city or town"
                          />
                          {formData.city && formData.city.length < 2 && (
                            <p className="text-xs text-amber-400 mt-1">City/Town must be at least 2 characters</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Country - International only: searchable dropdown */}
                  {formData.college === "INTERNATIONAL" && (
                    <SearchableSelect
                      label="Country"
                      options={COUNTRIES_WITH_DIAL.map((c) => ({
                        value: c.name,
                        label: `${getCountryFlag(c.iso2)} ${c.name}`,
                      }))}
                      value={formData.country || ""}
                      onChange={(v) => setFormData((prev) => ({ ...prev, country: v }))}
                      placeholder="Select your country"
                      searchPlaceholder="Search country..."
                      required
                    />
                  )}

                  {/* State/Region - International only, mandatory */}
                  {formData.college === "INTERNATIONAL" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        State / Region *
                      </label>
                      <div className="relative">
                        <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                        <input
                          type="text"
                          name="state"
                          value={formData.state || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 50) {
                              setFormData({ ...formData, state: value });
                            }
                          }}
                          required
                          maxLength={50}
                          className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          placeholder="e.g. California, England"
                        />
                        {formData.state && formData.state.length < 2 && (
                          <p className="text-xs text-amber-400 mt-1">State/Region must be at least 2 characters</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Institution / University - International: mandatory, manual text input */}
                  {formData.college === "INTERNATIONAL" && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Institution / University *
                      </label>
                      <div className="relative">
                        <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                        <input
                          type="text"
                          name="collegeName"
                          value={formData.collegeName === "International Student" ? "" : (formData.collegeName || "")}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 100) {
                              setFormData({ ...formData, collegeName: value });
                            }
                          }}
                          required
                          maxLength={100}
                          className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                          placeholder="Enter your institution or university name"
                        />
                        {formData.collegeName && formData.collegeName !== "International Student" && formData.collegeName.length < 3 && (
                          <p className="text-xs text-amber-400 mt-1">Institution name must be at least 3 characters</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Program of study - International: searchable dropdown + Other */}
                  {formData.college === "INTERNATIONAL" && (
                    <div className="space-y-2">
                      <SearchableSelect
                        label="Program of Study"
                        options={PROGRAMS_OF_STUDY.map((name) => ({ value: name, label: name }))}
                        value={PROGRAMS_OF_STUDY.includes(formData.branch || "") ? (formData.branch || "") : (formData.branch ? "Other" : "")}
                        onChange={(v) => setFormData((prev) => ({ ...prev, branch: v }))}
                        placeholder="Select or search your program"
                        searchPlaceholder="Search program..."
                        required
                      />
                      {(formData.branch === "Other" || (formData.branch && !PROGRAMS_OF_STUDY.includes(formData.branch))) && (
                        <div className="relative">
                          <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                          <input
                            type="text"
                            value={PROGRAMS_OF_STUDY.includes(formData.branch || "") ? "" : (formData.branch || "")}
                            onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value || "Other" }))}
                            className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                            placeholder="Enter your program of study"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* College ID - Not for International */}
                  {formData.college !== "INTERNATIONAL" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      College ID / Roll Number *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                      <input
                        type="text"
                        name="collageId"
                        value={formData.collageId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9\-/]/g, '').toUpperCase();
                          if (value.length <= 20) {
                            setFormData({ ...formData, collageId: value });
                          }
                        }}
                        required
                        maxLength={20}
                        className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                        placeholder="Enter your college ID"
                      />
                      {formData.collageId && formData.collageId.length < 4 && (
                        <p className="text-xs text-amber-400 mt-1">College ID must be at least 4 characters</p>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Branch - Not for International */}
                  {formData.college !== "INTERNATIONAL" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Branch / Department *
                    </label>
                    <div className="relative">
                      <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
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
                        className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all appearance-none"
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
                          className="w-full px-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                          autoFocus
                          required
                        />
                      </div>
                    )}
                  </div>
                  )}

                  {/* Year - Optional for International */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Year of Study *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required={formData.college !== "INTERNATIONAL"}
                        className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all appearance-none"
                      >
                        {formData.college === "INTERNATIONAL" && <option value={0}>Prefer not to say</option>}
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                        <option value={5}>5th Year</option>
                      </select>
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Gender *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg" />
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 text-base bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all appearance-none"
                      >
                        <option value="">Select Gender</option>
                        {GENDERS.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

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
                    className="w-full px-8 py-4 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
