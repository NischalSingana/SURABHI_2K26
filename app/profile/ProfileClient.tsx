"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiBook,
  FiCalendar,
  FiCreditCard,
  FiEdit2,
  FiSave,
  FiX,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiMapPin,
  FiTrash2,
  FiLogOut,
  FiZap,
  FiAward,
  FiVideo,
} from "react-icons/fi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { updateProfile } from "@/actions/profile.action";
import { unregisterFromEvent } from "@/actions/events.action";
import Image from "next/image";
import { BRANCHES, INDIAN_STATES } from "@/lib/constants";


interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  collage: string | null;
  collageId: string | null;
  branch: string | null;
  year: number | null;
  isApproved: boolean;
  paymentStatus: string;
  role: string;
  gender: string | null;
  state: string | null;
  city: string | null;
  isInternational?: boolean;
  country: string | null;
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: Date | string;
  image: string;
  venue: string;
  startTime: string;
  endTime: string;
  meetingLink?: string | null;
  meetingTime?: string | null;
  meetingTimezone?: string | null;
  meetingDate?: string | Date | null;
  isVirtual?: boolean;
  Category: {
    id: string;
    name: string;
  };
  slug: string;
  registrationStatus?: string;
  isResultPublished?: boolean;
}

interface ProfileClientProps {
  user: User;
  registeredEvents: Event[];
  ipAddress: string;
  userAgent: string;
  hasGoogleAccount: boolean;
  hasMicrosoftAccount: boolean;
}

export default function ProfileClient({
  user,
  registeredEvents,
  ipAddress,
  userAgent,
  hasGoogleAccount,
  // hasMicrosoftAccount, // eslint-disable-line @typescript-eslint/no-unused-vars
}: ProfileClientProps) {
  const router = useRouter();
  const { refetch: refetchSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "events" | "pass">("profile");
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [eventToUnregister, setEventToUnregister] = useState<Event | null>(
    null
  );
  const [unregistering, setUnregistering] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [hasPass, setHasPass] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    screenshot: File | null;
    utrId: string;
    payeeName: string;
  }>({ screenshot: null, utrId: "", payeeName: "" });
  const [passToken, setPassToken] = useState<string | null>(null);
  const [passPaymentStatus, setPassPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check if user already has a visitor pass
    const checkPass = async () => {
      const { checkVisitorPassStatus } = await import("@/actions/pass.action");
      const status = await checkVisitorPassStatus();
      if (status.success && status.hasPass) {
        setHasPass(true);
        setPassToken(status.passToken || null);
        setPassPaymentStatus(status.paymentStatus || null);
      }
    };
    if (hasGoogleAccount) {
      checkPass();
    }
  }, [hasGoogleAccount]);

  useEffect(() => {
    if (user.isInternational && activeTab === "pass") {
      setActiveTab("profile");
    }
  }, [user.isInternational, activeTab]);

  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    collage: user.collage || "",
    collageId: user.collageId || "",
    branch: user.branch || "",
    year: user.year || 1,
    gender: user.gender || "",
    state: user.state || "",
    city: user.city || "",
    country: user.country || "",
  });

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // Use window.location for immediate redirect and full page refresh
          window.location.href = "/";
        },
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(formData);

    if (result.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Refetch session from DB (bypass cookie cache) so UI reflects changes immediately
      await refetchSession({ query: { disableCookieCache: true } });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update profile");
    }

    setSaving(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      phone: user.phone || "",
      collage: user.collage || "",
      collageId: user.collageId || "",
      branch: user.branch || "",
      year: user.year || 1,
      gender: user.gender || "",
      state: user.state || "",
      city: user.city || "",
      country: user.country || "",
    });
    setIsEditing(false);
  };

  const handleUnregister = async () => {
    if (!eventToUnregister) return;

    setUnregistering(true);
    const result = await unregisterFromEvent(eventToUnregister.id);

    if (result.success) {
      toast.success("Successfully unregistered from event");
      setShowUnregisterModal(false);
      setEventToUnregister(null);
      // Refresh the page to update the events list
      window.location.reload();
    } else {
      toast.error(result.error || "Failed to unregister");
    }

    setUnregistering(false);
  };

  const handleGeneratePass = async () => {
    if (showPaymentModal) {
      if (!paymentDetails.screenshot || !paymentDetails.utrId || !paymentDetails.payeeName) {
        toast.error("Please fill all payment details");
        return;
      }
    }

    setPaymentProcessing(true);
    const loadingToast = toast.loading("Processing visitor pass...");

    try {
      let paymentData = undefined;

      if (paymentDetails.screenshot) {
        const formData = new FormData();
        formData.append("file", paymentDetails.screenshot);

        const { uploadPaymentScreenshot } = await import("@/actions/upload.action");
        const uploadResult = await uploadPaymentScreenshot(formData);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload screenshot");
        }

        paymentData = {
          paymentScreenshot: uploadResult.url!,
          utrId: paymentDetails.utrId,
          payeeName: paymentDetails.payeeName,
        };
      }

      const { generateVisitorPass } = await import("@/actions/pass.action");
      const result = await generateVisitorPass(paymentData);

      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success(result.message || "Pass generated successfully!");
        setShowPaymentModal(false);
        setHasPass(true);
        
        if (result.passToken) {
          setPassToken(result.passToken);
          setPassPaymentStatus("APPROVED");
          const response = await fetch(`/api/pass/download/${result.passToken}`);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `surabhi-2026-visitor-pass.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } else {
          setPassPaymentStatus("PENDING");
          setPassToken(null);
          
          // Refresh status to get latest data from server
          const { checkVisitorPassStatus } = await import("@/actions/pass.action");
          const status = await checkVisitorPassStatus();
          if (status.success && status.hasPass) {
            setHasPass(true);
            setPassToken(status.passToken || null);
            setPassPaymentStatus(status.paymentStatus || "PENDING");
          }
        }
      } else {
        toast.error(result.error || "Failed to generate pass");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 md:gap-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">My Profile</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          {activeTab === "profile" && !isEditing && (user.email?.endsWith("@kluniversity.in") || user.isInternational) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiEdit2 />
              Edit Profile
            </motion.button>
          )}



          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <FiLogOut />
              Logout
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs - scrollable on very narrow phones, iPhone 14 Pro Max–style on larger */}
      <div className="profile-tabs-scroll flex gap-2.5 sm:gap-4 mb-6 sm:mb-8 border-b border-zinc-800 overflow-x-auto -mx-1 px-1 pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 font-medium text-base transition-all whitespace-nowrap shrink-0 ${activeTab === "profile"
            ? "text-red-500 border-b-2 border-red-500"
            : "text-zinc-400 hover:text-white"
            }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-3 sm:px-6 py-2.5 sm:py-3 font-medium text-base transition-all whitespace-nowrap shrink-0 ${activeTab === "events"
            ? "text-red-500 border-b-2 border-red-500"
            : "text-zinc-400 hover:text-white"
            }`}
        >
          My Events ({registeredEvents.length})
        </button>
        {/* HIDDEN: Visitor pass – only show tab for existing pass holders. To show for new users, change to: hasGoogleAccount && !user.isInternational */}
        {hasGoogleAccount && !user.isInternational && hasPass && (
          <button
            onClick={() => setActiveTab("pass")}
            className={`px-3 sm:px-6 py-2.5 sm:py-3 font-medium text-base transition-all whitespace-nowrap shrink-0 ${activeTab === "pass"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-zinc-400 hover:text-white"
              }`}
          >
            Visitor Pass
          </button>
        )}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Image - circular on all phones (iPhone 14 Pro Max–style) */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 sm:p-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <div
                className="profile-avatar-circle relative w-24 h-24 min-w-[6rem] min-h-[6rem] shrink-0 aspect-square rounded-full overflow-hidden bg-zinc-800 border-2 border-red-600 isolate"
                style={{ aspectRatio: "1" }}
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    fill
                    sizes="96px"
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl text-zinc-400">
                    <FiUser />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                  {user.name || "No name set"}
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.name || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Email
                </label>
                <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                  {user.email}
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.phone || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Gender
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.gender || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Academic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  College
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.collage}
                    onChange={(e) =>
                      setFormData({ ...formData, collage: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.collage || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  College ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.collageId}
                    onChange={(e) =>
                      setFormData({ ...formData, collageId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.collageId || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Branch
                </label>
                {isEditing ? (
                  <>
                    <div className="relative">
                      <select
                        id="branch"
                        name="branch"
                        value={BRANCHES.includes(formData.branch) ? formData.branch : (formData.branch ? "Other" : "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            setFormData({ ...formData, branch: "Other" });
                          } else {
                            setFormData({ ...formData, branch: val });
                          }
                        }}
                        className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        <option value="">Select Branch</option>
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
                  </>
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.branch || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">Year</label>
                {isEditing ? (
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                    <option value={5}>5th Year</option>
                  </select>
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.year
                      ? `${user.year}${user.year === 1
                        ? "st"
                        : user.year === 2
                          ? "nd"
                          : user.year === 3
                            ? "rd"
                            : "th"
                      } Year`
                      : "Not provided"}
                  </p>
                )}
              </div>


              {/* Country - International students */}
              {(user.isInternational || user.country) && (
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="e.g. United States, United Kingdom"
                    />
                  ) : (
                    <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                      {user.country || "Not provided"}
                    </p>
                  )}
                </div>
              )}

              {/* State and City - Domestic */}
              {!user.isInternational && (
              <>
              <div>
                <label className="block text-zinc-400 text-sm mb-2">State</label>
                {isEditing ? (
                  <select
                    value={INDIAN_STATES.includes(formData.state || "") ? formData.state : ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.state || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">City/Town</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Enter City/Town"
                  />
                ) : (
                  <p className="text-white font-medium px-4 py-3 bg-zinc-800/50 rounded-lg">
                    {user.city || "Not provided"}
                  </p>
                )}
              </div>
              </>
              )}
            </div>
          </div>




          {/* Session Information */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              Session Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className=" text-zinc-400 text-sm mb-2 flex items-center gap-2">
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
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  IP Address
                </label>
                <p className="text-white font-mono text-sm px-4 py-3 bg-zinc-800/50 rounded-lg break-all">
                  {ipAddress}
                </p>
              </div>
              <div>
                <label className=" text-zinc-400 text-sm mb-2 flex items-center gap-2">
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
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  User Agent
                </label>
                <p className="text-white font-mono text-xs px-4 py-3 bg-zinc-800/50 rounded-lg break-all">
                  {userAgent}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiSave />
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FiX />
                Cancel
              </motion.button>
            </div>
          )}
        </motion.div>
      )
      }


      {/* Visitor Pass Tab – HIDDEN for new users. Only existing pass holders see this. To show for new users, remove "&& hasPass" from condition */}
      {activeTab === "pass" && hasGoogleAccount && !user.isInternational && hasPass && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl border border-zinc-800 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20 border border-red-500/20">
                  <FiZap className="text-white text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Visitor Pass</h3>
                  <p className="text-zinc-400 text-sm max-w-lg mb-2">
                    Access to Surabhi 2026 main fest days (March 6th & 7th).
                  </p>
                  {registeredEvents.length > 0 || hasPass ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                      <FiCheckCircle /> {hasPass ? "Pass Active" : "Eligible for Free Pass"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                      Price: ₹350 (2 Days)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (hasPass && passToken && passPaymentStatus === "APPROVED") {
                      // Already has approved pass, just download
                      window.open(`/api/pass/download/${passToken}`, '_blank');
                    } else if (hasPass && passPaymentStatus === "PENDING") {
                      // Pass is pending, show info message
                      toast.info("Please wait for admin to review and approve your registration. You'll receive an email when confirmed.");
                      return;
                    } else if (registeredEvents.length > 0) {
                      // Free pass logic - verify again just in case
                      handleGeneratePass();
                    } else {
                      // Paid pass - open modal
                      setShowPaymentModal(true);
                    }
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${hasPass && passPaymentStatus === "PENDING"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/30"
                    : registeredEvents.length > 0 || (hasPass && passPaymentStatus === "APPROVED")
                      ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                      : "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-red-600/25"
                    }`}
                >
                  {hasPass && passPaymentStatus === "PENDING" ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-lg" />
                        Pending Approval
                      </div>
                      <span className="text-xs text-amber-400/70 font-normal text-center">
                        It may take up to 24 hours to verify your payment. You will receive an email once approved.
                      </span>
                    </div>
                  ) : registeredEvents.length > 0 || (hasPass && passPaymentStatus === "APPROVED") ? (
                    <>
                      <FiBook className="text-lg" />
                      Download Pass
                    </>
                  ) : (
                    <>
                      <FiCreditCard className="text-lg" />
                      Buy Pass Now
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden px-4 bg-black/80 backdrop-blur-sm pt-28 pb-20 flex flex-col items-center min-h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md md:max-w-5xl shadow-2xl my-auto md:my-8 shrink-0 max-h-[90vh] flex flex-col"
            >
              <div 
                className="p-6 overflow-y-auto flex-1" 
                style={{ WebkitOverflowScrolling: 'touch' }}
                data-lenis-prevent
                onWheel={(e) => {
                  // Allow native scrolling within modal
                  e.stopPropagation();
                }}
              >
                <h2 className="text-2xl font-bold text-white mb-1">
                  Visitor Pass Payment
                </h2>
                <p className="text-zinc-400 text-sm mb-6">Complete payment to get your visitor pass</p>

                {/* ID Card Mandatory Warning */}
                <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="text-red-500 text-xl font-bold shrink-0">⚠️</div>
                    <div>
                      <h3 className="text-red-400 font-bold text-sm md:text-base mb-1 uppercase tracking-wide">
                        Important Notice
                      </h3>
                      <p className="text-red-300 text-xs md:text-sm font-medium leading-relaxed">
                        COLLEGE PHYSICAL ID CARD MANDATORY FOR ENTRY TO THE FEST
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-800/30 p-5 rounded-lg border border-zinc-800/50 mb-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* QR Code */}
                    <div className="shrink-0 flex flex-col items-center gap-3">
                      <div className="bg-white p-2 rounded-xl w-56 h-56 md:w-64 md:h-64 relative shadow-lg shadow-black/50">
                        <Image
                          src="/images/paymentQR.png"
                          alt="Payment QR"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                      <div className="text-center space-y-2 max-w-[250px]">
                        <p className="text-2xl md:text-3xl font-black text-white tracking-widest">₹350</p>
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Proof (Max 5MB) *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size exceeds 5MB limit");
                                e.target.value = "";
                                return;
                              }
                              setPaymentDetails({ ...paymentDetails, screenshot: file });
                            }
                          }}
                          className="w-full text-sm md:text-base text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs md:file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600 transition-colors cursor-pointer border border-zinc-700 rounded-lg p-1.5 bg-zinc-900/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">UTR ID</label>
                        <input
                          type="text"
                          placeholder="UTR / UPI Ref ID"
                          value={paymentDetails.utrId}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, utrId: e.target.value })}
                          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm md:text-base text-white focus:border-red-500 outline-none placeholder:text-zinc-600 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">PAYER NAME</label>
                        <input
                          type="text"
                          placeholder="Name as per your Bank records"
                          value={paymentDetails.payeeName}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, payeeName: e.target.value })}
                          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm md:text-base text-white focus:border-red-500 outline-none placeholder:text-zinc-600 transition-all"
                        />
                      </div>

                      <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20 mt-2 space-y-2">
                        <div className="flex gap-2 text-left">
                          <span className="text-yellow-500 text-[10px] md:text-xs flex-shrink-0">•</span>
                          <p className="text-[10px] md:text-xs text-yellow-500 leading-relaxed font-medium uppercase">
                            PLEASE PAY THE FULL AMOUNT AS SHOWN. YOUR PAYMENT WILL BE VERIFIED ALONG WITH UTR ID AND ONLY THEN YOUR PASS WILL BE APPROVED.
                          </p>
                        </div>
                        <div className="flex gap-2 text-left">
                          <span className="text-yellow-500 text-[10px] md:text-xs flex-shrink-0">•</span>
                          <p className="text-[10px] md:text-xs text-yellow-500 leading-relaxed font-medium uppercase">
                            The amount once paid will not be refunded under any circumstances.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={paymentProcessing}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm md:text-base font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePass}
                    disabled={paymentProcessing}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm md:text-base font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : "Submit Payment"}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Events Tab */}
      {
        activeTab === "events" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {registeredEvents.length === 0 ? (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
                <FiCalendar className="text-6xl text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No Events Registered
                </h3>
                <p className="text-zinc-400 mb-6">
                  You have not registered for any events yet
                </p>
                <Link
                  href="/competitions"
                  className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Browse Events
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registeredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-red-600/50 transition-all flex flex-col"
                  >
                    <div className="relative h-40 md:h-48 shrink-0">
                      <Image
                        src={event.image}
                        alt={event.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        quality={80}
                      />
                      <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.Category.name}
                      </div>
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <FiCheckCircle size={14} />
                        Registered
                      </div>
                    </div>
                    <div className="p-4 md:p-6 flex flex-col grow">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {event.name}
                      </h3>
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <FiCalendar className="text-red-500" />
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <FiClock className="text-red-500" />
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <FiMapPin className="text-red-500" />
                          {event.venue}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 mb-2 mt-auto">
                        {/* Join Meeting Button - Show for virtual participants */}
                        {event.isVirtual && event.meetingLink && (event.registrationStatus === 'APPROVED' || !event.registrationStatus) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (event.meetingLink) {
                                window.open(event.meetingLink, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="sm:col-span-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <FiVideo size={16} />
                            Join Meeting
                            {event.meetingDate && event.meetingTime && event.meetingTimezone && (
                              <span className="text-xs opacity-90 ml-1">
                                ({new Date(event.meetingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {event.meetingTime} {event.meetingTimezone})
                              </span>
                            )}
                          </motion.button>
                        )}
                        {user.isApproved && event.registrationStatus === 'APPROVED' && !event.isVirtual && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/ticket/download?eventId=${event.id}`);
                                if (!response.ok) {
                                  const error = await response.json();
                                  toast.error(error.error || 'Failed to download ticket');
                                  return;
                                }
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `surabhi-2026-ticket-${event.name.replace(/\s+/g, '-')}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                                toast.success('Ticket downloaded successfully!');
                              } catch {
                                toast.error('Failed to download ticket');
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <FiCreditCard size={16} />
                            Ticket
                          </motion.button>
                        )}
                        {(event.registrationStatus === 'PENDING' || !event.registrationStatus) && (
                          <div className="flex-1 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                            <FiClock size={16} />
                            Pending
                          </div>
                        )}
                        {event.registrationStatus === 'REJECTED' && (
                          <div className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                            <FiXCircle size={16} />
                            Rejected
                          </div>
                        )}

                        {/* View Results Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (event.isResultPublished) {
                              router.push(`/results?category=${event.Category.id}&event=${event.slug}`);
                            } else {
                              toast.info("Evaluations not released yet");
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <FiAward size={16} />
                          Results
                        </motion.button>

                        {/* Hide unregister for other college & KL; show only for International */}
                        {user.isInternational && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setEventToUnregister(event);
                              setShowUnregisterModal(true);
                            }}
                            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <FiTrash2 size={16} />
                            Unregister
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )
      }

      {/* Unregister Confirmation Modal */}
      <AnimatePresence>
        {showUnregisterModal && eventToUnregister && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800 shadow-2xl"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white">
                  Confirm Unregister
                </h2>
              </div>

              {/* Content */}
              <div className="px-8 py-6">
                <p className="text-zinc-300 mb-4">
                  Are you sure you want to unregister from{" "}
                  <span className="font-semibold text-white">
                    &quot;{eventToUnregister.name}&quot;
                  </span>
                  ?
                </p>
                <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <FiCalendar className="text-red-500" />
                    {new Date(eventToUnregister.date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <FiMapPin className="text-red-500" />
                    {eventToUnregister.venue}
                  </div>
                </div>
                <p className="text-zinc-400 text-sm">
                  ⚠️ This action cannot be undone. You will need to register
                  again if you change your mind.
                </p>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => {
                    setShowUnregisterModal(false);
                    setEventToUnregister(null);
                  }}
                  disabled={unregistering}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnregister}
                  disabled={unregistering}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {unregistering ? (
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
                      Unregistering...
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      Unregister
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}
