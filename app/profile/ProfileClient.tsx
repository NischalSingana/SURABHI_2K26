"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
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
} from "react-icons/fi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
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
  Category: {
    name: string;
  };
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
  hasMicrosoftAccount,
}: ProfileClientProps) {
  const router = useRouter();
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
  const [passToken, setPassToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user already has a visitor pass
    const checkPass = async () => {
      const { checkVisitorPassStatus } = await import("@/actions/pass.action");
      const status = await checkVisitorPassStatus();
      if (status.success && status.hasPass) {
        setHasPass(true);
        setPassToken(status.passToken || null);
      }
    };
    if (hasGoogleAccount) {
      checkPass();
    }
  }, [hasGoogleAccount]);

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
      window.location.reload();
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
    // If opening from modal, set loading state on modal button
    if (showPaymentModal) {
      setPaymentProcessing(true);
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const loadingToast = !showPaymentModal ? toast.loading("Generating Visitor Pass...") : null;

    try {
      const { generateVisitorPass } = await import("@/actions/pass.action");
      const result = await generateVisitorPass();

      if (result.success && result.passToken) {
        if (loadingToast) toast.dismiss(loadingToast);
        toast.success(result.message || "Pass generated successfully!");
        setShowPaymentModal(false);
        setHasPass(true);
        setPassToken(result.passToken);

        // Download PDF
        const response = await fetch(`/api/pass/download/${result.passToken}`);
        if (!response.ok) throw new Error("Failed to download pass");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `surabhi-2026-visitor-pass.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Reload to update UI (show eligible/downloaded status if needed, though button will remain)
      } else {
        if (loadingToast) toast.dismiss(loadingToast);
        toast.error(result.error || "Failed to generate pass");
      }
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getStatusBadge = () => {
    if (user.isApproved) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <FiCheckCircle className="text-green-400" />
          <span className="text-green-300 font-medium">Approved</span>
        </div>
      );
    } else if (user.paymentStatus === "PENDING") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <FiClock className="text-yellow-400" />
          <span className="text-yellow-300 font-medium">Pending Approval</span>
        </div>
      );
    } else if (user.paymentStatus === "REJECTED") {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <FiXCircle className="text-red-400" />
          <span className="text-red-300 font-medium">Rejected</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">My Profile</h1>
          <div className="flex items-center gap-4">{getStatusBadge()}</div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full md:w-auto">
          {activeTab === "profile" && !isEditing && (
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

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-medium transition-all ${activeTab === "profile"
            ? "text-red-500 border-b-2 border-red-500"
            : "text-zinc-400 hover:text-white"
            }`}
        >
          Profile Information
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-6 py-3 font-medium transition-all ${activeTab === "events"
            ? "text-red-500 border-b-2 border-red-500"
            : "text-zinc-400 hover:text-white"
            }`}
        >
          My Events ({registeredEvents.length})
        </button>
        {hasGoogleAccount && (
          <button
            onClick={() => setActiveTab("pass")}
            className={`px-6 py-3 font-medium transition-all ${activeTab === "pass"
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
          {/* Profile Image */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-red-600">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-400">
                    <FiUser />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {user.name || "No name set"}
                </h3>
                <p className="text-zinc-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
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


              {/* State and City */}
              <div>
                <label className="block text-zinc-400 text-sm mb-2">State</label>
                {isEditing ? (
                  <>
                    <input
                      list="states-list"
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="Search or Select State"
                    />
                    <datalist id="states-list">
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state} />
                      ))}
                    </datalist>
                  </>
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


      {/* Visitor Pass Tab */}
      {activeTab === "pass" && hasGoogleAccount && (
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
                    if (hasPass && passToken) {
                      // Already has pass, just download
                      window.open(`/api/pass/download/${passToken}`, '_blank');
                    } else if (registeredEvents.length > 0) {
                      // Free pass logic - verify again just in case
                      handleGeneratePass();
                    } else {
                      // Paid pass - open modal
                      setShowPaymentModal(true);
                    }
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${registeredEvents.length > 0 || hasPass
                    ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                    : "bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-red-600/25"
                    }`}
                >
                  {registeredEvents.length > 0 || hasPass ? (
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                  Payment Summary
                </h2>
                <p className="text-zinc-400 text-sm mb-6">Visitor Pass for Surabhi 2026</p>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Registration Fee</span>
                    <span className="text-white">₹350 / person</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300">Validity</span>
                    <span className="text-white">2 Days (March 6th & 7th)</span>
                  </div>
                  <div className="h-px bg-zinc-800 my-2" />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-white">Total Amount</span>
                    <span className="text-red-500">₹350</span>
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Includes:</h3>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-green-500 mt-0.5 shrink-0" />
                      <span>Access to all Events & Pro Shows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-green-500 mt-0.5 shrink-0" />
                      <span>valid for March 6th & 7th</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    disabled={paymentProcessing}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGeneratePass}
                    disabled={paymentProcessing}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Pay Now"
                    )}
                  </button>
                </div>
              </div>
              <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 text-center">
                <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Demo Mode: No real payment will be deducted
                </p>
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
                  You haven't registered for any events yet
                </p>
                <a
                  href="/competitions"
                  className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Browse Events
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registeredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden hover:border-red-600/50 transition-all"
                  >
                    <div className="relative h-48">
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/400x300?text=Event";
                        }}
                      />
                      <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {event.Category.name}
                      </div>
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <FiCheckCircle size={14} />
                        Registered
                      </div>
                    </div>
                    <div className="p-6">
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

                      <div className="flex gap-2 mb-2">
                        {user.isApproved && (
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
                              } catch (error) {
                                toast.error('Failed to download ticket');
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <FiCreditCard size={16} />
                            Ticket
                          </motion.button>
                        )}
                        {/* Unregister Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEventToUnregister(event);
                            setShowUnregisterModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <FiTrash2 size={16} />
                          Unregister
                        </motion.button>
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
                    "{eventToUnregister.name}"
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
