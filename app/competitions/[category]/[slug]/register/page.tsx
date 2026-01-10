"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiCheck,
    FiChevronLeft,
    FiUsers,
    FiX
} from "react-icons/fi";
import {
    registerForEvent,
    checkEventRegistration,
    registerGroupEvent,
    getUserByEmail
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
    _count: {
        registeredStudents: number;
    };
}

export default function EventRegistrationPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const categoryName = decodeURIComponent(params.category as string);
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
    const [memberEmailInput, setMemberEmailInput] = useState("");
    const [lookingUpMember, setLookingUpMember] = useState(false);

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
                router.push(`/competitions/${categoryName}`);
            }
        } catch (e) {
            console.error("Error fetching event", e);
        }
        setLoading(false);
    };

    const handleRegister = async () => {
        if (!acceptedTerms) {
            toast.error("Please accept the terms and conditions");
            return;
        }

        setRegistering(true);

        if (!event) return;

        const result = await registerForEvent(event.id);

        if (result.success) {
            toast.success("Successfully registered for the event!");
            router.push(`/competitions/${categoryName}/${slug}`); // Redirect back to event page
        } else {
            toast.error(result.error || "Failed to register");
        }

        setRegistering(false);
    };

    const handleGroupRegister = async () => {
        if (!event) return;

        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        const requiredMembers = Math.max(0, teamSize - 1);
        if (teamMembers.length < requiredMembers) {
            toast.error(`Please add details for all ${requiredMembers} additional members`);
            return;
        }

        setRegistering(true);
        try {
            const result = await registerGroupEvent(event.id, groupName, teamMembers, mentorName, mentorPhone);

            if (result.success) {
                toast.success("Team registered successfully!");
                router.push(`/competitions/${categoryName}/${slug}`);
            } else {
                toast.error(result.error || "Failed to register team");
            }
        } catch (err) {
            console.error("Error in handleGroupRegister:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setRegistering(false);
        }
    };

    const verifyAndAddMember = async () => {
        if (!memberEmailInput.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        if (teamMembers.some(m => m.email === memberEmailInput.trim())) {
            toast.error("This user is already in your team list");
            return;
        }

        // Check if user is trying to add themselves
        if (session?.user?.email === memberEmailInput.trim()) {
            toast.error("You are already the team lead (included automatically).");
            return;
        }

        if (teamMembers.length >= (teamSize - 1)) {
            toast.error(`You have reached the team size limit of ${teamSize} (including you).`);
            return;
        }

        setLookingUpMember(true);
        try {
            const res = await getUserByEmail(memberEmailInput.trim());
            if (res.success && res.user) {
                setTeamMembers([...teamMembers, {
                    id: res.user.id,
                    name: res.user.name,
                    email: res.user.email,
                    college: "",
                    collegeId: "",
                    phone: ""
                }]);
                setMemberEmailInput("");
                toast.success(`Added ${res.user.name} to the team!`);
            } else {
                toast.error("User not found. Check email or ensure they are registered.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error looking up user");
        } finally {
            setLookingUpMember(false);
        }
    };

    const removeMember = (index: number) => {
        const newMembers = [...teamMembers];
        newMembers.splice(index, 1);
        setTeamMembers(newMembers);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="min-h-screen bg-zinc-950 py-20 px-4 sm:px-6 lg:px-8">
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
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Add Member by Email</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    value={memberEmailInput}
                                                    onChange={(e) => setMemberEmailInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && verifyAndAddMember()}
                                                    placeholder="Enter registered email address"
                                                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none"
                                                />
                                                <button
                                                    onClick={verifyAndAddMember}
                                                    disabled={lookingUpMember}
                                                    className="px-4 py-2 bg-zinc-100 text-black font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                                                >
                                                    {lookingUpMember ? 'Checking...' : 'Add'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {teamMembers.map((member, idx) => (
                                                <div key={member.id || idx} className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-medium">{member.name}</p>
                                                        <p className="text-xs text-zinc-400">{member.email}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeMember(idx)}
                                                        className="text-red-400 hover:text-red-300 p-2"
                                                        title="Remove member"
                                                    >
                                                        <FiX size={18} />
                                                    </button>
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

                            {/* Terms and Conditions */}
                            <div className="border-t border-zinc-800 pt-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Terms and Conditions</h3>
                                <div
                                    className="bg-zinc-800 rounded-lg p-4 max-h-60 overflow-y-auto mb-4 border border-zinc-700"
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
                                {event.isGroupEvent ? (
                                    <button
                                        onClick={handleGroupRegister}
                                        disabled={registering || !groupName || teamSize < event.minTeamSize || teamSize > event.maxTeamSize || !acceptedTerms}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {registering ? "Registering..." : `Confirm Registration (${1 + teamMembers.length} Members)`}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRegister}
                                        disabled={!acceptedTerms || registering}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {registering ? "Registering..." : "Confirm Registration"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
