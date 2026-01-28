"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiCheck,
    FiChevronLeft,
    FiUsers,
    FiX,
    FiEdit2,
    FiFileText
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import {
    registerForEvent,
    checkEventRegistration,
    registerGroupEvent
} from "@/actions/events.action";
import { useSession } from "@/lib/auth-client";

interface Event {
    id: string;
    name: string;
    description: string;
    date: string | Date;
    image: string;
    venue: string;
    startTime: string;
    endTime: string;
    participantLimit: number;
    termsandconditions: string;
    isGroupEvent: boolean;
    minTeamSize: number;
    maxTeamSize: number;
    whatsappLink?: string | null;
    brochureLink?: string | null;
    _count: {
        registeredStudents: number;
    };
}

// Add custom scrollbar styles for the modal
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(39, 39, 42, 0.5);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(82, 82, 91, 0.8);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(113, 113, 122, 0.8);
  }
`;

export default function EventRegistrationPage() {
    const params = useParams();
    const router = useRouter();
  const slug = params.slug as string;
  const categorySlug = params.category as string;
    const { data: session } = useSession();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);

    // Group Registration State
    const [teamSize, setTeamSize] = useState(0);
    const [groupName, setGroupName] = useState("");
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [mentorName, setMentorName] = useState("");
    const [mentorPhone, setMentorPhone] = useState("");
    const [currentMemberName, setCurrentMemberName] = useState("");
    const [currentMemberPhone, setCurrentMemberPhone] = useState("");
    const [currentMemberGender, setCurrentMemberGender] = useState("");
    // Vastranaut Specific
    const [styleDNA, setStyleDNA] = useState("");
    const isVastranaut = slug?.includes("vastranaut");
    const styleDNAOptions = [
        "Street Rebel",
        "Luxe Minimalist",
        "Futuristic Nomad",
        "Tech Couture",
        "Gothic Renaissance",
        "Culture Remix",
        "Indie Royal"
    ];

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState(0); // 0: Summary, 1: Payment Input
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // Payment Details State
    const [paymentDetails, setPaymentDetails] = useState({
        screenshot: null as File | null,
        utrId: "",
        payeeName: "",
    });



    useEffect(() => {
        if (slug) {
            fetchEvent();
        }
    }, [slug]);

    const fetchEvent = async () => {
        try {
            const { getEventBySlug } = await import("@/actions/events.action");
            const result = await getEventBySlug(slug);

            if (result.success && result.data) {
                setEvent(result.data as any);
                if (result.data.isGroupEvent) {
                    setTeamSize(result.data.minTeamSize);
                }
            } else {
                toast.error("Event not found");
                router.push(`/competitions/${categorySlug}`);
            }
        } catch (e) {
            console.error("Error fetching event", e);
        }
        setLoading(false);
    };

    const processPaymentAndRegister = async () => {
        // Validation for Non-KL Students
        const isKLStudent = session?.user?.email?.endsWith("@kluniversity.in");

        if (!isKLStudent) {
            if (!paymentDetails.screenshot || !paymentDetails.utrId || !paymentDetails.payeeName) {
                toast.error("Please complete all payment details (Upload Screenshot, UTR, Payee Name)");
                return;
            }
        }

        setPaymentProcessing(true);
        if (!event) return;

        try {
            let uploadedScreenshotUrl = "";

            // Upload Screenshot if needed
            if (!isKLStudent && paymentDetails.screenshot) {
                const formData = new FormData();
                formData.append("file", paymentDetails.screenshot);

                const { uploadPaymentScreenshot } = await import("@/actions/upload.action");
                const uploadResult = await uploadPaymentScreenshot(formData);

                if (!uploadResult.success || !uploadResult.url) {
                    throw new Error("Failed to upload payment screenshot");
                }
                uploadedScreenshotUrl = uploadResult.url;
            }

            const paymentData = !isKLStudent ? {
                paymentScreenshot: uploadedScreenshotUrl,
                utrId: paymentDetails.utrId,
                payeeName: paymentDetails.payeeName
            } : undefined;

            let result;
            if (event.isGroupEvent) {
                result = await registerGroupEvent(
                    event.id,
                    groupName,
                    teamMembers,
                    mentorName,
                    mentorPhone,
                    isVastranaut ? { styleDNA } : undefined,
                    paymentData
                );
            } else {
                result = await registerForEvent(
                    event.id,
                    isVastranaut ? { styleDNA } : undefined,
                    paymentData
                );
            }

            if (result.success) {
                toast.success(isKLStudent ? "Registration Confirmed!" : "Registration Submitted! Pending Approval.");
                setShowPaymentModal(false);
                router.push(`/competitions/${categorySlug}/${slug}`); // Redirect
            } else {
                toast.error(result.error || "Registration failed");
            }
        } catch (err: any) {
            console.error("Registration error:", err);
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setPaymentProcessing(false);
        }
    };


    const handleRegisterClick = () => {
        if (!acceptedTerms) {
            toast.error("Please accept the terms and conditions");
            return;
        }

        if (event?.isGroupEvent) {
            if (!groupName.trim()) {
                toast.error("Please enter a group name");
                return;
            }
            const requiredMembers = Math.max(0, teamSize - 1);
            if (teamMembers.length < requiredMembers) {
                toast.error(`Please add details for all ${requiredMembers} additional members`);
                return;
            }
        }

        // If it's a group event, go to review step first
        if (event?.isGroupEvent) {
            setIsReviewing(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Individual events go straight to payment
        setShowPaymentModal(true);
    };




    const addManualMember = () => {
        if (!currentMemberName.trim() || !currentMemberPhone.trim() || !currentMemberGender) {
            toast.error("Please fill in all member details (Name, Phone, Gender)");
            return;
        }

        if (teamMembers.length >= (teamSize - 1)) {
            toast.error(`You have reached the team size limit of ${teamSize} (including you).`);
            return;
        }

        // Basic phone validation
        if (currentMemberPhone.trim().length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }

        setTeamMembers([...teamMembers, {
            name: currentMemberName.trim(),
            phone: currentMemberPhone.trim(),
            gender: currentMemberGender
        }]);

        // Reset inputs
        setCurrentMemberName("");
        setCurrentMemberPhone("");
        setCurrentMemberGender("");
        toast.success("Member added to list");
    };

    const removeMember = (index: number) => {
        const newMembers = [...teamMembers];
        newMembers.splice(index, 1);
        setTeamMembers(newMembers);
    };

    const editMember = (index: number) => {
        const member = teamMembers[index];
        setCurrentMemberName(member.name);
        setCurrentMemberPhone(member.phone);
        setCurrentMemberGender(member.gender);
        removeMember(index);
        toast.info("Editing member details...");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!event) return null;

    // Calculate Fees
    const isKLStudent = session?.user?.email?.endsWith("@kluniversity.in");
    const memberCount = event.isGroupEvent ? teamSize : 1;
    // Free for KL University students, 350 for others
    const feePerPerson = isKLStudent ? 0 : 350;
    const totalFee = memberCount * feePerPerson;

    return (
        <div className="min-h-screen bg-zinc-950 py-20 px-4 sm:px-6 lg:px-8 relative">
            <style jsx global>{scrollbarStyles}</style>
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
                >
                    <FiChevronLeft className="mr-2" />
                    Back to Event
                </button>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Register for {event.name}</h1>
                        <p className="text-zinc-400">
                            {event.isGroupEvent ? "Team Registration" : "Individual Registration"}
                        </p>
                        {isKLStudent && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-block">
                                <p className="text-green-300 text-sm font-medium">
                                    🎉 Free Registration for KL University Students
                                </p>
                            </div>
                        )}

                        {/* WhatsApp and Brochure Links */}
                        {(event.whatsappLink || event.brochureLink) && (
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                {event.whatsappLink && (
                                    <a
                                        href={event.whatsappLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 group"
                                    >
                                        <FaWhatsapp size={20} className="group-hover:scale-110 transition-transform duration-300" />
                                        <span>Join WhatsApp Group</span>
                                    </a>
                                )}
                                {event.brochureLink && (
                                    <a
                                        href={event.brochureLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
                                    >
                                        <FiFileText size={20} className="group-hover:scale-110 transition-transform duration-300" />
                                        <span>View Brochure</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {!session?.user ? (
                        <div className="text-center py-10">
                            <p className="text-zinc-300 mb-4">Please login to continue registration</p>
                            <button
                                onClick={() => router.push("/login")}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Login to Register
                            </button>
                        </div>
                    ) : isReviewing ? (
                        // Review Step
                        <div className="space-y-8">
                            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
                                <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-700 pb-4">Review Your Registration</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-zinc-400 mb-1">Group Name</p>
                                        <p className="text-white font-medium text-lg">{groupName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-400 mb-1">Total Team Size</p>
                                        <p className="text-white font-medium">{teamSize}</p>
                                    </div>
                                    {isVastranaut && styleDNA && (
                                        <div className="md:col-span-2">
                                            <p className="text-sm text-zinc-400 mb-1">Style DNA</p>
                                            <p className="text-white font-medium text-lg text-red-500">{styleDNA}</p>
                                        </div>
                                    )}
                                </div>

                                {mentorName && (
                                    <div className="bg-zinc-900/50 p-4 rounded-lg mb-6 border border-zinc-800/50">
                                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Mentor Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-zinc-500">Name</p>
                                                <p className="text-white">{mentorName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-500">Phone</p>
                                                <p className="text-white">{mentorPhone || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Team Roster</h3>
                                    <div className="space-y-3">
                                        {/* Team Lead */}
                                        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-medium">{session.user.name}</span>
                                                    <span className="bg-red-600/20 text-red-500 text-xs px-2 py-0.5 rounded font-bold uppercase">Team Lead</span>
                                                </div>
                                                <p className="text-xs text-zinc-400">{session.user.email}</p>
                                            </div>
                                        </div>

                                        {/* Members */}
                                        {teamMembers.map((member, idx) => (
                                            <div key={idx} className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-white font-medium">{member.name}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400">{member.gender} • {member.phone}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setIsReviewing(false)}
                                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiEdit2 /> Edit Details
                                </button>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-600/20"
                                >
                                    Proceed to {isKLStudent ? "Registration" : "Payment"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Event Specific Logic */}
                            {event.isGroupEvent ? (
                                <div className="space-y-6">
                                    {/* Group Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Group/Team Name *</label>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                            placeholder="Enter unique team name"
                                        />
                                    </div>

                                    {/* Team Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                                            Total Team Size (Including You) *
                                        </label>
                                        <input
                                            type="number"
                                            min={event.minTeamSize}
                                            max={event.maxTeamSize}
                                            value={teamSize || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "") {
                                                    setTeamSize(0);
                                                    return;
                                                }
                                                const size = parseInt(val);
                                                if (!isNaN(size)) {
                                                    setTeamSize(size);
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        />
                                        <p className="text-zinc-500 text-sm mt-1">Min: {event.minTeamSize} - Max: {event.maxTeamSize}</p>
                                    </div>

                                    {/* Mentor Info */}
                                    <div className="border-t border-zinc-800 pt-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Mentor / Coordinator (Optional)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
                                                <input
                                                    type="text"
                                                    value={mentorName}
                                                    onChange={(e) => setMentorName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                                    placeholder="Mentor Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-300 mb-2">Phone</label>
                                                <input
                                                    type="text"
                                                    value={mentorPhone}
                                                    onChange={(e) => setMentorPhone(e.target.value)}
                                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                                    placeholder="Mentor Phone"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Members */}
                                    <div className="border-t border-zinc-800 pt-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>

                                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-4 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-white font-medium">You</span>
                                                    <span className="bg-red-600/20 text-red-500 text-xs px-2 py-0.5 rounded font-bold uppercase">Team Lead</span>
                                                </div>
                                                <p className="text-xs text-zinc-500">{session.user.email}</p>
                                            </div>
                                        </div>

                                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg mb-4">
                                            <label className="block text-sm font-medium text-zinc-300 mb-3">Add Team Member</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                <input
                                                    type="text"
                                                    value={currentMemberName}
                                                    onChange={(e) => setCurrentMemberName(e.target.value)}
                                                    placeholder="Full Name"
                                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={currentMemberPhone}
                                                    onChange={(e) => setCurrentMemberPhone(e.target.value)}
                                                    placeholder="Phone Number"
                                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none"
                                                />
                                                <select
                                                    value={currentMemberGender}
                                                    onChange={(e) => setCurrentMemberGender(e.target.value)}
                                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none appearance-none"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={addManualMember}
                                                className="w-full px-4 py-2 bg-zinc-100 text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2"
                                            >
                                                <FiUsers /> Add Member
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {teamMembers.map((member, idx) => (
                                                <div key={member.id || idx} className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-medium">{member.name}</p>
                                                        <p className="text-xs text-zinc-400">{member.gender} • {member.phone}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => editMember(idx)}
                                                            className="text-zinc-400 hover:text-white p-2 transition-colors"
                                                            title="Edit member"
                                                        >
                                                            <FiEdit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => removeMember(idx)}
                                                            className="text-red-400 hover:text-red-300 p-2 transition-colors"
                                                            title="Remove member"
                                                        >
                                                            <FiX size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Solo Event Logic
                                <div className="bg-zinc-800/30 rounded-lg p-6 border border-zinc-800">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                            <FiUser className="text-zinc-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium text-lg">{session.user.name}</h3>
                                            <p className="text-zinc-400">{session.user.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-sm">
                                        You are registering as an individual participant for this event.
                                    </p>
                                </div>
                            )}

                            {/* Vastranaut Specific Field */}
                            {isVastranaut && (
                                <div className="border-t border-zinc-800 pt-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Choose Your Style DNA *</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {styleDNAOptions.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => setStyleDNA(option)}
                                                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-center border ${styleDNA === option
                                                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20"
                                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                    {!styleDNA && <p className="text-zinc-500 text-xs mt-2">Please select one style option.</p>}
                                </div>
                            )}

                            {/* Terms and Conditions */}
                            <div className="border-t border-zinc-800 pt-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Terms and Conditions</h3>
                                <div
                                    className="bg-zinc-800 rounded-lg p-4 max-h-60 overflow-y-auto mb-4 border border-zinc-700"
                                    data-lenis-prevent
                                    style={{ overscrollBehavior: 'contain' }}
                                    onScroll={(e) => {
                                        const element = e.currentTarget;
                                        const isBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) <= 10;
                                        if (isBottom) {
                                            setHasScrolled(true);
                                        }
                                    }}
                                    ref={(el) => {
                                        if (el && el.scrollHeight <= el.clientHeight) {
                                            setHasScrolled(true);
                                        }
                                    }}
                                >
                                    <div className="space-y-2 text-sm text-zinc-300">
                                        {(() => {
                                            let points = event.termsandconditions ? event.termsandconditions.split(/\r?\n/).filter(line => line.trim()) : [];
                                            if (points.length === 1 && points[0].length > 50) {
                                                const sentences = points[0].split(/\.\s+/).filter(s => s.trim());
                                                if (sentences.length > 1) {
                                                    points = sentences.map(s => s.trim().endsWith('.') ? s : s + '.');
                                                }
                                            }
                                            return points.length > 0 ? points.map((point, index) => (
                                                <div key={index} className="flex gap-2 text-start">
                                                    <span className="text-red-500 mt-1.5 min-w-[5px] h-1.5 rounded-full bg-red-500 block shrink-0" />
                                                    <span>{point.replace(/^[•\-\*]\s*/, '')}</span>
                                                </div>
                                            )) : <p>No specific terms for this event.</p>;
                                        })()}
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => {
                                                if (!hasScrolled && !acceptedTerms) {
                                                    toast.error("Please scroll through all terms and conditions first");
                                                    return;
                                                }
                                                setAcceptedTerms(e.target.checked);
                                            }}
                                            className="w-5 h-5 rounded border-2 border-zinc-600 bg-zinc-800 checked:bg-red-600 checked:border-red-600 cursor-pointer transition-all"
                                        />
                                        {acceptedTerms && (
                                            <FiCheck className="absolute left-0.5 top-0.5 text-white pointer-events-none" size={16} />
                                        )}
                                    </div>
                                    <span className="text-zinc-300 text-sm group-hover:text-white transition-colors">
                                        I have read and accept the terms and conditions
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-6">
                                <button
                                    onClick={handleRegisterClick}
                                    disabled={!acceptedTerms || registering || (isVastranaut && !styleDNA) || (event.isGroupEvent && (!groupName || teamSize < event.minTeamSize || teamSize > event.maxTeamSize))}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {event.isGroupEvent ? "Review Details" : isKLStudent ? "Proceed to Register" : "Proceed to Payment"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                <AnimatePresence>
                    {showPaymentModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm pt-20 pb-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-zinc-900 border border-zinc-800 rounded-2xl w-full shadow-2xl max-h-full flex flex-col transition-all duration-300 ${!isKLStudent ? 'max-w-md md:max-w-5xl' : 'max-w-md'}`}
                            >
                                <div className="p-0 h-full flex flex-col">
                                    {/* Mobile Only Header */}
                                    <div className="p-4 md:hidden border-b border-zinc-800 flex items-center gap-3">
                                        <button
                                            onClick={() => setShowPaymentModal(false)}
                                            className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors text-white"
                                        >
                                            <FiChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">
                                                {isKLStudent ? "Confirm Registration" : "Payment Summary"}
                                            </h2>
                                            <p className="text-zinc-400 text-xs">Complete your registration</p>
                                        </div>
                                    </div>

                                    <div className="h-full flex flex-col">
                                        {/* LEFT COLUMN: Summary & Details */}
                                        <div className={`p-5 md:p-6 bg-zinc-950/50 space-y-5 w-full ${paymentStep === 1 && !isKLStudent ? 'hidden' : 'block'}`}>
                                            {!isKLStudent && (
                                                <div className="hidden md:flex items-center gap-3">
                                                    <button
                                                        onClick={() => setShowPaymentModal(false)}
                                                        className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors text-white"
                                                    >
                                                        <FiChevronLeft className="w-6 h-6" />
                                                    </button>
                                                    <div>
                                                        <h2 className="text-lg md:text-2xl font-bold text-white mb-0.5">Summary</h2>
                                                        <p className="text-zinc-500 text-xs md:text-sm">Registration details</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50 space-y-3">
                                                <div className="flex justify-between items-center text-xs md:text-base">
                                                    <span className="text-zinc-400">Fee per person</span>
                                                    <span className="text-white">
                                                        {isKLStudent ? (
                                                            <span className="text-green-500 font-bold">Waived</span>
                                                        ) : (
                                                            `₹${feePerPerson}`
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs md:text-base">
                                                    <span className="text-zinc-400">Participants</span>
                                                    <span className="text-white">{memberCount}</span>
                                                </div>
                                                <div className="h-px bg-zinc-800 my-1" />
                                                <div className="flex justify-between items-center font-bold text-sm md:text-xl">
                                                    <span className="text-white">Total</span>
                                                    <span className="text-red-500 text-base md:text-2xl">
                                                        {isKLStudent ? (
                                                            <span className="text-green-500">Free</span>
                                                        ) : (
                                                            `₹${totalFee}`
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                                                <h3 className="text-[10px] md:text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Also Includes Complimentary:</h3>
                                                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-base text-zinc-300">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                        <span>Accommodation (1 Day)</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                        <span>Lunch</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                        <span>6th and 7th march free visitor access</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* ID Card Mandatory Warning */}
                                            <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-3 md:p-4">
                                                <div className="flex items-start gap-2 md:gap-3">
                                                    <div className="text-red-500 text-lg md:text-xl font-bold shrink-0">⚠️</div>
                                                    <div>
                                                        <h3 className="text-red-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-wide">
                                                            Important Notice
                                                        </h3>
                                                        <p className="text-red-300 text-[9px] md:text-xs font-medium leading-relaxed">
                                                            COLLEGE PHYSICAL ID CARD IS MANDATORY TO BRING TO CAMPUS WHILE ATTENDING THE EVENT. 
                                                            Please ensure you carry your valid college ID card with you on the day of the event.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Buttons - Now Visible on Desktop too */}
                                            <div className="pt-2">
                                                {!isKLStudent && (
                                                    <button
                                                        onClick={() => setPaymentStep(1)}
                                                        className="w-full py-2.5 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm md:text-base shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                                                    >
                                                        Proceed
                                                    </button>
                                                )}
                                                {isKLStudent && (
                                                    <button
                                                        onClick={processPaymentAndRegister}
                                                        disabled={paymentProcessing}
                                                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {paymentProcessing ? "Processing..." : "Confirm"}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Desktop KL Button - Removed redundancy as specific mobile/desktop distinction is no longer needed for flow */}
                                            <div className="hidden pt-2">
                                                {/* Intentionally empty/hidden as unified button above covers it */}
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN: Payment Details */}
                                        {!isKLStudent && (
                                            <div className={`p-5 md:p-6 space-y-5 w-full ${paymentStep === 1 ? 'block' : 'hidden'}`}>
                                                <div className="hidden md:block">
                                                    <h2 className="text-lg md:text-2xl font-bold text-white mb-0.5">Payment</h2>
                                                    <p className="text-zinc-500 text-xs md:text-sm">Scan & Upload Screenshot</p>
                                                </div>

                                                {/* ID Card Mandatory Warning */}
                                                <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-3 md:p-4">
                                                    <div className="flex items-start gap-2 md:gap-3">
                                                        <div className="text-red-500 text-lg md:text-xl font-bold shrink-0">⚠️</div>
                                                        <div>
                                                            <h3 className="text-red-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-wide">
                                                                Important Notice
                                                            </h3>
                                                            <p className="text-red-300 text-[9px] md:text-xs font-medium leading-relaxed">
                                                                COLLEGE PHYSICAL ID CARD IS MANDATORY TO BRING TO CAMPUS WHILE ATTENDING THE EVENT. 
                                                                Please ensure you carry your valid college ID card with you on the day of the event.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-zinc-800/30 p-5 rounded-lg border border-zinc-800/50 flex flex-col gap-5">
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
                                                                <p className="text-2xl md:text-3xl font-black text-white tracking-widest">₹{totalFee}</p>
                                                            </div>
                                                        </div>

                                                        {/* Inputs */}
                                                        <div className="flex-1 space-y-4">
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
                                                                <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Transaction ID</label>
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
                                                                        PLEASE PAY THE FULL AMOUNT AS SHOWN. YOUR PAYMENT WILL BE VERIFIED ALONG WITH UTR ID AND ONLY THEN REGISTRATION WILL BE APPROVED.
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

                                                    {/* Submit / Back Buttons */}
                                                    {/* Submit / Back Buttons */}
                                                    <div className="flex gap-4 pt-2">
                                                        <button
                                                            onClick={() => {
                                                                if (paymentStep === 1) setPaymentStep(0);
                                                                else setShowPaymentModal(false);
                                                            }}
                                                            disabled={paymentProcessing}
                                                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm md:text-base font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            {paymentStep === 1 ? "Back" : "Cancel"}
                                                        </button>
                                                        <button
                                                            onClick={processPaymentAndRegister}
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 text-center">
                                    <p className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                        {isKLStudent ? "KL University Student Verification Active" : "Payment Verification Required"}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
}
