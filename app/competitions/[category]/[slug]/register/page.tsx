"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import {
    FiUser,
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
    registerGroupEvent
} from "@/actions/events.action";
import { useSession } from "@/lib/auth-client";
import { withRetry } from "@/lib/retry";
import { checkVirtualEligibility, getRegistrationFee } from "@/lib/virtual-eligibility";
import { REGISTRATION_FEES } from "@/lib/constants";
import { isOnlineRegistrationClosed, ONLINE_REG_CLOSED_MESSAGE } from "@/lib/registration-deadline";

declare global {
    interface Window {
        __APP_VERSION__?: string;
    }
}

const STALE_CLIENT_RELOAD_KEY = "surabhi_registration_reload_once";

function isLikelyStaleClientError(message: string): boolean {
    const msg = message.toLowerCase();
    return (
        msg.includes("failed to fetch") ||
        msg.includes("load failed") ||
        msg.includes("fetch failed") ||
        msg.includes("loading chunk") ||
        msg.includes("chunkloaderror") ||
        msg.includes("unexpected response was received from the server") ||
        msg.includes("failed to execute 'json' on 'response'")
    );
}

function reloadToLatestBuild() {
    if (typeof window === "undefined") return;

    try {
        if (sessionStorage.getItem(STALE_CLIENT_RELOAD_KEY) === "1") return;
        sessionStorage.setItem(STALE_CLIENT_RELOAD_KEY, "1");
    } catch {
        // Ignore storage failures; continue with reload fallback.
    }

    const url = new URL(window.location.href);
    url.searchParams.set("refresh", Date.now().toString());
    window.location.replace(url.toString());
}

function redirectToMyCompetitions(router: ReturnType<typeof useRouter>) {
    const target = `/profile/competitions?registered=1&t=${Date.now()}`;
    if (typeof window !== "undefined") {
        window.location.assign(target);
        return;
    }
    router.replace(target);
}

async function uploadPaymentScreenshotWithFallback(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    const makeFormData = () => {
        const fd = new FormData();
        fd.append("file", file);
        return fd;
    };

    // Primary path: server action
    try {
        const { uploadPaymentScreenshot } = await import("@/actions/upload.action");
        const actionResult = await uploadPaymentScreenshot(makeFormData());
        if (actionResult.success && actionResult.url) {
            return { success: true, url: actionResult.url };
        }

        const actionError = actionResult.error || "Failed to upload payment screenshot";
        if (!isLikelyStaleClientError(actionError)) {
            return { success: false, error: actionError };
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!isLikelyStaleClientError(msg)) {
            return { success: false, error: msg || "Failed to upload payment screenshot" };
        }
    }

    // Fallback path: API route (resilient during deployment version mismatch)
    try {
        const response = await fetch("/api/upload/payment-screenshot", {
            method: "POST",
            body: makeFormData(),
            cache: "no-store",
            headers: { "cache-control": "no-cache" },
        });
        const data = await response.json().catch(() => ({ success: false, error: "Upload response parsing failed" }));
        if (response.ok && data?.success && data?.url) {
            return { success: true, url: data.url as string };
        }
        return { success: false, error: (data?.error as string) || "Failed to upload payment screenshot" };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { success: false, error: msg || "Failed to upload payment screenshot" };
    }
}

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
    virtualTermsAndConditions?: string | null;
    isGroupEvent: boolean;
    virtualEnabled?: boolean;
    minTeamSize: number;
    maxTeamSize: number;
    whatsappLink?: string | null;
    brochureLink?: string | null;
    Category?: {
        name?: string | null;
    } | null;
    _count: {
        registeredStudents: number;
    };
}

interface GroupMember {
    name: string;
    phone: string;
    gender: string;
    inGameName?: string;
    inGameId?: string;
    riotId?: string;
}

type RegistrationResult = { success: boolean; error?: string; message?: string };

type CompetitionRegistrationPayload = {
    eventId: string;
    isGroupEvent: boolean;
    groupName?: string;
    members?: GroupMember[];
    mentorName?: string;
    mentorPhone?: string;
    registrationDetails?: any;
    paymentDetails?: {
        paymentScreenshot: string;
        utrId: string;
        payeeName: string;
    };
    isVirtual?: boolean;
};

async function submitCompetitionRegistrationWithFallback(payload: CompetitionRegistrationPayload): Promise<RegistrationResult> {
    const submitViaApi = async () => {
        const response = await fetch("/api/registrations/competition", {
            method: "POST",
            headers: { "Content-Type": "application/json", "cache-control": "no-cache" },
            cache: "no-store",
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({ success: false, error: "Registration response parsing failed" }));
        return {
            success: !!data?.success,
            error: data?.error as string | undefined,
            message: data?.message as string | undefined,
        };
    };

    try {
        if (payload.isGroupEvent) {
            const actionResult = await registerGroupEvent(
                payload.eventId,
                payload.groupName || "Team",
                payload.members || [],
                payload.mentorName,
                payload.mentorPhone,
                payload.registrationDetails,
                payload.paymentDetails,
                payload.isVirtual
            );
            if (actionResult.success) return actionResult;
            if (!isLikelyStaleClientError(actionResult.error || "")) return actionResult;
        } else {
            const actionResult = await registerForEvent(
                payload.eventId,
                payload.registrationDetails,
                payload.paymentDetails,
                payload.isVirtual
            );
            if (actionResult.success) return actionResult;
            if (!isLikelyStaleClientError(actionResult.error || "")) return actionResult;
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!isLikelyStaleClientError(msg)) {
            return { success: false, error: msg || "Registration failed" };
        }
    }

    return submitViaApi();
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
    const [registering, setRegistering] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    
    // Virtual Participation State
    const [isVirtual, setIsVirtual] = useState(false);

    // Group Registration State
    const [teamSize, setTeamSize] = useState(0);
    const [groupName, setGroupName] = useState("");
    const [teamMembers, setTeamMembers] = useState<GroupMember[]>([]);
    const [mentorName, setMentorName] = useState("");
    const [mentorPhone, setMentorPhone] = useState("");
    const [currentMemberName, setCurrentMemberName] = useState("");
    const [currentMemberPhone, setCurrentMemberPhone] = useState("");
    const [currentMemberGender, setCurrentMemberGender] = useState("");
    // Vastranaut Specific
    const [styleDNA, setStyleDNA] = useState("");
    const isVastranaut = slug?.includes("vastranaut");
    // Kurukshetra eSports: Free Fire, BGMI (In-game name + In-game ID) or Valorant (In-game name + Riot ID)
    const isFreeFireOrBGMI = event?.name?.toLowerCase().includes("free fire") || event?.name?.toLowerCase().includes("bgmi");
    const isValorant = event?.name?.toLowerCase().includes("valorant");
    const needsInGameFields = isFreeFireOrBGMI || isValorant;
    // Team lead in-game fields
    const [teamLeadInGameName, setTeamLeadInGameName] = useState("");
    const [teamLeadInGameId, setTeamLeadInGameId] = useState("");
    const [teamLeadRiotId, setTeamLeadRiotId] = useState("");
    // Member in-game fields (for add form)
    const [currentMemberInGameName, setCurrentMemberInGameName] = useState("");
    const [currentMemberInGameId, setCurrentMemberInGameId] = useState("");
    const [currentMemberRiotId, setCurrentMemberRiotId] = useState("");
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
    const [isRefreshingForUpdate, setIsRefreshingForUpdate] = useState(false);

    // Payment Details State
    const [paymentDetails, setPaymentDetails] = useState({
        screenshot: null as File | null,
        utrId: "",
        payeeName: "",
    });

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

    const validateGroupName = (name: string): { valid: boolean; error?: string } => {
        if (!name || !name.trim()) {
            return { valid: false, error: "Group name is required" };
        }
        if (name.trim().length < 3) {
            return { valid: false, error: "Group name must be at least 3 characters" };
        }
        if (name.trim().length > 50) {
            return { valid: false, error: "Group name must not exceed 50 characters" };
        }
        return { valid: true };
    };

    const validateMemberName = (name: string): { valid: boolean; error?: string } => {
        if (!name || !name.trim()) {
            return { valid: false, error: "Name is required" };
        }
        if (name.trim().length < 2) {
            return { valid: false, error: "Name must be at least 2 characters" };
        }
        if (!/^[a-zA-Z\s.]+$/.test(name.trim())) {
            return { valid: false, error: "Name can only contain letters, spaces, and dots" };
        }
        return { valid: true };
    };



    const fetchEvent = useCallback(async () => {
        try {
            const { getEventBySlug } = await import("@/actions/events.action");
            const result = await getEventBySlug(slug);

            if (result.success && result.data) {
                setEvent(result.data as unknown as Event);
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
    }, [slug, categorySlug, router]);

    useEffect(() => {
        if (slug) {
            fetchEvent();
        }
    }, [slug, fetchEvent]);

    useEffect(() => {
        if (!event || !session?.user) return;
        const international = !!(session.user as { isInternational?: boolean } | undefined)?.isInternational;
        if (international) return;

        const eventCategoryName = event.Category?.name?.toLowerCase() ?? "";
        const kurukshetraEvent = categorySlug.toLowerCase().includes("kurukshetra") || eventCategoryName.includes("kurukshetra");
        if (!kurukshetraEvent) return;

        const collage = (session.user as { collage?: string | null } | undefined)?.collage?.toLowerCase();
        const isKL = !!session.user.email?.toLowerCase().endsWith("@kluniversity.in") || collage === "kl university";

        // Kurukshetra policy: KL is physical-only, other colleges are virtual-only.
        setIsVirtual(!isKL);
    }, [event, session, categorySlug]);

    const processPaymentAndRegister = async () => {

        const isInternational = !!(session?.user as { isInternational?: boolean } | undefined)?.isInternational;

        // Validate Group Registration Fields
        if (event?.isGroupEvent) {
            // Validate group name
            const groupNameValidation = validateGroupName(groupName);
            if (!groupNameValidation.valid) {
                toast.error(groupNameValidation.error);
                return;
            }

            // Validate team size
            if (teamMembers.length + 1 !== teamSize) {
                toast.error(`Please add exactly ${teamSize - 1} team members (you are counted as 1)`);
                return;
            }

            // Validate mentor name if provided
            if (mentorName && mentorName.trim()) {
                const mentorNameValidation = validateMemberName(mentorName);
                if (!mentorNameValidation.valid) {
                    toast.error(`Mentor ${mentorNameValidation.error}`);
                    return;
                }
            }

            // Validate mentor phone if provided
            if (mentorPhone && mentorPhone.trim()) {
                const mentorPhoneValidation = validatePhone(mentorPhone);
                if (!mentorPhoneValidation.valid) {
                    toast.error(`Mentor ${mentorPhoneValidation.error}`);
                    return;
                }
            }

            // Validate Vastranaut style DNA
            if (isVastranaut && !styleDNA) {
                toast.error("Please select a Style DNA for Vastranaut competition");
                return;
            }

            // Validate Kurukshetra eSports in-game fields
            if (needsInGameFields) {
                if (!teamLeadInGameName?.trim()) {
                    toast.error("Please enter your In-game name (Team Lead)");
                    return;
                }
                if (isFreeFireOrBGMI && !teamLeadInGameId?.trim()) {
                    toast.error("Please enter your In-game ID (Team Lead)");
                    return;
                }
                if (isValorant && !teamLeadRiotId?.trim()) {
                    toast.error("Please enter your Riot ID (Team Lead)");
                    return;
                }
                for (let i = 0; i < teamMembers.length; i++) {
                    const m = teamMembers[i];
                    if (!m.inGameName?.trim()) {
                        toast.error(`Please enter In-game name for member: ${m.name}`);
                        return;
                    }
                    if (isFreeFireOrBGMI && !m.inGameId?.trim()) {
                        toast.error(`Please enter In-game ID for member: ${m.name}`);
                        return;
                    }
                    if (isValorant && !m.riotId?.trim()) {
                        toast.error(`Please enter Riot ID for member: ${m.name}`);
                        return;
                    }
                }
            }
        }

        // International: free; others need payment
        if (!isInternational) {
            if (!paymentDetails.screenshot || !paymentDetails.utrId || !paymentDetails.payeeName) {
                toast.error("Please complete all payment details (Upload Screenshot, UTR, Payee Name)");
                return;
            }

            // Validate UTR ID format (12 digits)
            if (!/^\d{12}$/.test(paymentDetails.utrId.trim())) {
                toast.error("UTR ID must be exactly 12 digits");
                return;
            }

            // Validate payee name
            const payeeNameValidation = validateMemberName(paymentDetails.payeeName);
            if (!payeeNameValidation.valid) {
                toast.error(`Payee ${payeeNameValidation.error}`);
                return;
            }
        }

        // Preflight: avoid submitting from stale client after a deployment switch.
        try {
            const preflight = await withRetry(async () => {
                const res = await fetch("/api/health", {
                    method: "GET",
                    cache: "no-store",
                    headers: { "cache-control": "no-cache" },
                });
                if (!res.ok) {
                    throw new Error("Health preflight failed");
                }
                return res.json() as Promise<{ appVersion?: string }>;
            }, { retries: 2, delayMs: 1200 });

            const currentVersion = preflight.appVersion || "";
            const clientVersion = (typeof window !== "undefined" ? window.__APP_VERSION__ : "") || "";
            if (currentVersion && clientVersion && currentVersion !== clientVersion) {
                // Do not force reload here; continue and rely on resilient API fallbacks.
                toast.info("A new version is available. Continuing with a safe submit path to avoid re-entering details.");
            }
        } catch {
            // If preflight itself fails, continue with normal submit flow and retry handling below.
        }

        setPaymentProcessing(true);
        if (!event) return;

        try {
            let uploadedScreenshotUrl = "";

            if (!isInternational && paymentDetails.screenshot) {
                const screenshotFile = paymentDetails.screenshot;
                uploadedScreenshotUrl = await withRetry(async () => {
                    const uploadResult = await uploadPaymentScreenshotWithFallback(screenshotFile);
                    if (!uploadResult.success || !uploadResult.url) {
                        throw new Error(uploadResult.error || "Failed to upload payment screenshot");
                    }
                    return uploadResult.url;
                }, { retries: 2, delayMs: 2000 });
            }

            const paymentData = !isInternational ? {
                paymentScreenshot: uploadedScreenshotUrl,
                utrId: paymentDetails.utrId,
                payeeName: paymentDetails.payeeName
            } : undefined;

            const userCollege = (session?.user as { collage?: string | null } | undefined)?.collage?.toLowerCase();
            const isKLStudent = !!session?.user?.email?.toLowerCase().endsWith("@kluniversity.in") || userCollege === "kl university";
            const eventCategoryName = event.Category?.name?.toLowerCase() ?? "";
            const isKurukshetraEvent = categorySlug.toLowerCase().includes("kurukshetra") || eventCategoryName.includes("kurukshetra");
            const selectedVirtualMode = isKurukshetraEvent && !isInternational ? !isKLStudent : isVirtual;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const regDetails: Record<string, any> = isVastranaut ? { styleDNA } : {};
            if (event.isGroupEvent && needsInGameFields) {
                regDetails.teamLeadInGameName = teamLeadInGameName?.trim();
                if (isFreeFireOrBGMI) regDetails.teamLeadInGameId = teamLeadInGameId?.trim();
                if (isValorant) regDetails.teamLeadRiotId = teamLeadRiotId?.trim();
            }

            const result = await withRetry(
                () =>
                    submitCompetitionRegistrationWithFallback({
                        eventId: event.id,
                        isGroupEvent: event.isGroupEvent,
                        groupName,
                        members: event.isGroupEvent ? teamMembers : undefined,
                        mentorName: event.isGroupEvent ? mentorName : undefined,
                        mentorPhone: event.isGroupEvent ? mentorPhone : undefined,
                        registrationDetails: Object.keys(regDetails).length ? regDetails : undefined,
                        paymentDetails: paymentData,
                        isVirtual: selectedVirtualMode,
                    }),
                { retries: 1, delayMs: 1200 }
            );

            if (result.success) {
                toast.success("Registration Submitted! Redirecting to My Competitions...");
                setShowPaymentModal(false);
                redirectToMyCompetitions(router);
            } else {
                const errorText = result.error || "Registration failed";
                if (errorText.toLowerCase().includes("already registered")) {
                    toast.success("You are already registered. Opening My Competitions...");
                    redirectToMyCompetitions(router);
                    return;
                }
                toast.error(errorText);
            }
        } catch (err: unknown) {
            console.error("Registration error:", err);
            const msg = (err as Error).message || "";
            if (isLikelyStaleClientError(msg)) {
                setIsRefreshingForUpdate(true);
                toast.error("Looks like an outdated page cache. Reloading to latest version... Please re-upload the same payment screenshot after refresh.", { duration: 6000 });
                setTimeout(() => reloadToLatestBuild(), 500);
            } else {
                toast.error(msg || "An unexpected error occurred");
            }
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
            if (needsInGameFields) {
                if (!teamLeadInGameName?.trim()) {
                    toast.error("Please enter your In-game name (Team Lead)");
                    return;
                }
                if (isFreeFireOrBGMI && !teamLeadInGameId?.trim()) {
                    toast.error("Please enter your In-game ID (Team Lead)");
                    return;
                }
                if (isValorant && !teamLeadRiotId?.trim()) {
                    toast.error("Please enter your Riot ID (Team Lead)");
                    return;
                }
                for (let i = 0; i < teamMembers.length; i++) {
                    const m = teamMembers[i];
                    if (!m.inGameName?.trim()) {
                        toast.error(`Please enter In-game name for member: ${m.name}`);
                        return;
                    }
                    if (isFreeFireOrBGMI && !m.inGameId?.trim()) {
                        toast.error(`Please enter In-game ID for member: ${m.name}`);
                        return;
                    }
                    if (isValorant && !m.riotId?.trim()) {
                        toast.error(`Please enter Riot ID for member: ${m.name}`);
                        return;
                    }
                }
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
        // Validate name
        const nameValidation = validateMemberName(currentMemberName);
        if (!nameValidation.valid) {
            toast.error(nameValidation.error);
            return;
        }

        // Validate phone
        const phoneValidation = validatePhone(currentMemberPhone);
        if (!phoneValidation.valid) {
            toast.error(phoneValidation.error);
            return;
        }

        // Validate gender
        if (!currentMemberGender) {
            toast.error("Please select gender");
            return;
        }

        if (needsInGameFields) {
            if (!currentMemberInGameName?.trim()) {
                toast.error("Please enter In-game name for this member");
                return;
            }
            if (isFreeFireOrBGMI && !currentMemberInGameId?.trim()) {
                toast.error("Please enter In-game ID for this member");
                return;
            }
            if (isValorant && !currentMemberRiotId?.trim()) {
                toast.error("Please enter Riot ID for this member");
                return;
            }
        }

        // Check team size limit
        if (teamMembers.length >= (teamSize - 1)) {
            toast.error(`You have reached the team size limit of ${teamSize} (including you).`);
            return;
        }

        const memberObj: GroupMember = {
            name: currentMemberName.trim(),
            phone: currentMemberPhone.trim().replace(/\s+/g, ''),
            gender: currentMemberGender
        };
        if (needsInGameFields) {
            memberObj.inGameName = currentMemberInGameName.trim();
            if (isFreeFireOrBGMI) memberObj.inGameId = currentMemberInGameId.trim();
            if (isValorant) memberObj.riotId = currentMemberRiotId.trim();
        }
        setTeamMembers([...teamMembers, memberObj]);

        // Reset inputs
        setCurrentMemberName("");
        setCurrentMemberPhone("");
        setCurrentMemberGender("");
        setCurrentMemberInGameName("");
        setCurrentMemberInGameId("");
        setCurrentMemberRiotId("");
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
        setCurrentMemberInGameName(member.inGameName || "");
        setCurrentMemberInGameId(member.inGameId || "");
        setCurrentMemberRiotId(member.riotId || "");
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

    if (isOnlineRegistrationClosed()) {
        return (
            <div className="min-h-screen bg-zinc-950 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mx-auto">
                    <button
                        onClick={() => router.push(`/competitions/${categorySlug}/${slug}`)}
                        className="flex items-center text-zinc-400 hover:text-white mb-8 transition-colors"
                    >
                        <FiChevronLeft className="mr-2" />
                        Back to Event
                    </button>
                    <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 shadow-xl">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-amber-400 mb-2">Online Registration Closed</h1>
                            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                                {ONLINE_REG_CLOSED_MESSAGE}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push(`/competitions/${categorySlug}/${slug}`)}
                            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Back to Event
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isInternational = !!(session?.user as { isInternational?: boolean } | undefined)?.isInternational;
    const userCollege = (session?.user as { collage?: string | null } | undefined)?.collage?.toLowerCase();
    const isKLStudent = !!session?.user?.email?.toLowerCase().endsWith("@kluniversity.in") || userCollege === "kl university";
    const eventCategoryName = event.Category?.name?.toLowerCase() ?? "";
    const isKurukshetraEvent = categorySlug.toLowerCase().includes("kurukshetra") || eventCategoryName.includes("kurukshetra");
    const isKurukshetraOtherCollegeVirtualOnly = isKurukshetraEvent && !isInternational && !isKLStudent;
    const isKurukshetraKLPhysicalOnly = isKurukshetraEvent && !isInternational && isKLStudent;
    const effectiveIsVirtual = isKurukshetraOtherCollegeVirtualOnly ? true : (isKurukshetraKLPhysicalOnly ? false : isVirtual);
    const virtualEligibility = session?.user ? checkVirtualEligibility({
        email: session.user.email,
        state: (session.user as { state?: string }).state,
        isInternational: isInternational,
        collage: (session.user as { collage?: string }).collage,
    }) : { isEligible: false };
    
    const memberCount = event.isGroupEvent ? teamSize : 1;
    const feePerPerson = isInternational ? 0 : getRegistrationFee(effectiveIsVirtual);
    const totalFee = memberCount * feePerPerson;

    return (
        <div className="min-h-screen bg-zinc-950 py-20 px-4 sm:px-6 lg:px-8 relative">
            {isRefreshingForUpdate && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm shadow-lg">
                    We updated the site, reloading...
                </div>
            )}
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
                        {isKurukshetraKLPhysicalOnly && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg inline-block">
                                <p className="text-blue-300 text-sm font-medium">
                                    ℹ️ Kurukshetra: KL students are physical-only. Fee: ₹350 per member.
                                </p>
                            </div>
                        )}
                        {isKurukshetraOtherCollegeVirtualOnly && (
                            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg inline-block">
                                <p className="text-emerald-300 text-sm font-medium">
                                    ℹ️ Kurukshetra: Other college students from all states (including AP and Telangana) must join virtual mode only. Fee: ₹150 per member.
                                </p>
                            </div>
                        )}
                        {isInternational && (
                            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <p className="text-green-300 text-sm font-medium">
                                    🎉 Free registration for international students. All competitions are virtual for international participants; evaluations will be conducted virtually by judges.
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
                                                {needsInGameFields && teamLeadInGameName && (
                                                    <p className="text-xs text-amber-400/90 mt-1">
                                                        {isFreeFireOrBGMI && `IGN: ${teamLeadInGameName} • ID: ${teamLeadInGameId || "-"}`}
                                                        {isValorant && `IGN: ${teamLeadInGameName} • Riot: ${teamLeadRiotId || "-"}`}
                                                    </p>
                                                )}
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
                                                    {needsInGameFields && member.inGameName && (
                                                        <p className="text-xs text-amber-400/90 mt-1">
                                                            {isFreeFireOrBGMI && `IGN: ${member.inGameName} • ID: ${member.inGameId || "-"}`}
                                                            {isValorant && `IGN: ${member.inGameName} • Riot: ${member.riotId || "-"}`}
                                                        </p>
                                                    )}
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
                                    Proceed to {isInternational ? "Registration" : "Payment"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* ID Card Mandatory Warning - not for virtual, international, or KL users */}
                            {!effectiveIsVirtual && !isInternational && (
                            <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-red-500 text-xl font-bold shrink-0">⚠️</div>
                                    <div>
                                        <h3 className="text-red-400 font-bold text-sm md:text-base mb-1 uppercase tracking-wide">
                                            Important Notice
                                        </h3>
                                        <p className="text-red-300 text-sm md:text-base font-medium leading-relaxed">
                                            COLLEGE PHYSICAL ID CARD MANDATORY FOR ENTRY TO THE FEST
                                        </p>
                                    </div>
                                </div>
                            </div>
                            )}
                            {(effectiveIsVirtual || isInternational) && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <p className="text-green-300 text-sm font-medium">
                                    Virtual participation — evaluations will be conducted virtually by judges.
                                </p>
                            </div>
                            )}

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
                                        {event.minTeamSize === event.maxTeamSize ? (
                                            <div className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium flex items-center gap-2">
                                                <span className="text-zinc-400">Fixed:</span>
                                                <span className="text-lg tabular-nums">{event.minTeamSize}</span>
                                                <span className="text-zinc-500 text-sm">members (including you)</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setTeamSize((s) => Math.max(event.minTeamSize, (s || event.minTeamSize) - 1))}
                                                    disabled={teamSize <= event.minTeamSize}
                                                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <span className="text-xl font-medium">−</span>
                                                </button>
                                                <input
                                                    type="number"
                                                    min={event.minTeamSize}
                                                    max={event.maxTeamSize}
                                                    step={1}
                                                    value={teamSize || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "") {
                                                            setTeamSize(event.minTeamSize);
                                                            return;
                                                        }
                                                        const size = parseInt(val, 10);
                                                        if (!isNaN(size)) {
                                                            setTeamSize(Math.min(event.maxTeamSize, Math.max(event.minTeamSize, size)));
                                                        }
                                                    }}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setTeamSize((s) => Math.min(event.maxTeamSize, (s || event.minTeamSize) + 1))}
                                                    disabled={teamSize >= event.maxTeamSize}
                                                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <span className="text-xl font-medium">+</span>
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-zinc-500 text-sm mt-1">Min: {event.minTeamSize} – Max: {event.maxTeamSize}</p>
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
                                                    type="tel"
                                                    value={mentorPhone}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        if (value.length <= 10) {
                                                            setMentorPhone(value);
                                                        }
                                                    }}
                                                    maxLength={10}
                                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                                    placeholder="10-digit phone number"
                                                />
                                                {mentorPhone && mentorPhone.length < 10 && (
                                                    <p className="text-xs text-amber-400 mt-1">{10 - mentorPhone.length} digits remaining</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Members */}
                                    <div className="border-t border-zinc-800 pt-6">
                                        <h3 className="text-lg font-semibold text-white mb-4">Team Members</h3>

                                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-white font-medium">You</span>
                                                        <span className="bg-red-600/20 text-red-500 text-xs px-2 py-0.5 rounded font-bold uppercase">Team Lead</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500">{session.user.email}</p>
                                                </div>
                                            </div>
                                            {needsInGameFields && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-zinc-700">
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">In-game Name *</label>
                                                        <input
                                                            type="text"
                                                            value={teamLeadInGameName}
                                                            onChange={(e) => setTeamLeadInGameName(e.target.value)}
                                                            placeholder="Your in-game name"
                                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                                        />
                                                    </div>
                                                    {isFreeFireOrBGMI && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">In-game ID *</label>
                                                            <input
                                                                type="text"
                                                                value={teamLeadInGameId}
                                                                onChange={(e) => setTeamLeadInGameId(e.target.value)}
                                                                placeholder="Your in-game ID"
                                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                    {isValorant && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Riot ID *</label>
                                                            <input
                                                                type="text"
                                                                value={teamLeadRiotId}
                                                                onChange={(e) => setTeamLeadRiotId(e.target.value)}
                                                                placeholder="e.g. name#tag"
                                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {teamSize <= 1 && (
                                            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700 mb-4">
                                                <p className="text-zinc-300 text-sm">
                                                    You are registering as the only participant. You can increase the team size above to add more members.
                                                </p>
                                            </div>
                                        )}

                                        {teamSize > 1 && (<><div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 mb-4 shadow-lg">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center">
                                                    <FiUsers className="text-red-400" size={16} />
                                                </div>
                                                <label className="text-sm font-semibold text-zinc-200">Add Team Member</label>
                                                {teamSize > 0 && (
                                                    <span className="text-xs text-zinc-500 ml-auto">
                                                        {teamMembers.length} / {Math.max(0, teamSize - 1)} added
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                <input
                                                    type="text"
                                                    value={currentMemberName}
                                                    onChange={(e) => setCurrentMemberName(e.target.value)}
                                                    placeholder="Full Name"
                                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="tel"
                                                        value={currentMemberPhone}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, '');
                                                            if (value.length <= 10) {
                                                                setCurrentMemberPhone(value);
                                                            }
                                                        }}
                                                        maxLength={10}
                                                        placeholder="10-digit phone"
                                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-red-600 outline-none"
                                                    />
                                                    {currentMemberPhone && currentMemberPhone.length !== 10 && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400">
                                                            {currentMemberPhone.length}/10
                                                        </span>
                                                    )}
                                                </div>
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
                                            {needsInGameFields && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 col-span-1 md:col-span-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-zinc-400 mb-1">In-game Name *</label>
                                                        <input
                                                            type="text"
                                                            value={currentMemberInGameName}
                                                            onChange={(e) => setCurrentMemberInGameName(e.target.value)}
                                                            placeholder="Member in-game name"
                                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                                        />
                                                    </div>
                                                    {isFreeFireOrBGMI && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">In-game ID *</label>
                                                            <input
                                                                type="text"
                                                                value={currentMemberInGameId}
                                                                onChange={(e) => setCurrentMemberInGameId(e.target.value)}
                                                                placeholder="Member in-game ID"
                                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                    {isValorant && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-zinc-400 mb-1">Riot ID *</label>
                                                            <input
                                                                type="text"
                                                                value={currentMemberRiotId}
                                                                onChange={(e) => setCurrentMemberRiotId(e.target.value)}
                                                                placeholder="e.g. name#tag"
                                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={addManualMember}
                                                className="mt-4 w-full px-4 py-2.5 text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200 flex justify-center items-center gap-2 shadow-md shadow-red-500/20 hover:shadow-red-500/30 border border-red-500/30 hover:scale-[1.01] active:scale-[0.99]"
                                            >
                                                <FiUsers size={16} strokeWidth={2.5} />
                                                Add Member
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {teamMembers.map((member, idx) => (
                                                <div key={idx} className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-white font-medium">{member.name}</p>
                                                        <p className="text-xs text-zinc-400">{member.gender} • {member.phone}</p>
                                                        {needsInGameFields && member.inGameName && (
                                                            <p className="text-xs text-amber-400/90 mt-1">
                                                                {isFreeFireOrBGMI && `IGN: ${member.inGameName} • ID: ${member.inGameId || "-"}`}
                                                                {isValorant && `IGN: ${member.inGameName} • Riot: ${member.riotId || "-"}`}
                                                            </p>
                                                        )}
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
                                    </>)}
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

                            {/* Virtual Participation Selection */}
                            {isKurukshetraOtherCollegeVirtualOnly && (
                                <div className="border-t border-zinc-800 pt-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Participation Mode</h3>
                                    <div className="p-4 rounded-lg border-2 border-emerald-600 bg-emerald-600/10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-semibold">Virtual Participation (Mandatory)</span>
                                            <span className="text-red-500 font-bold">₹{REGISTRATION_FEES.VIRTUAL}</span>
                                        </div>
                                        <p className="text-zinc-300 text-sm mt-1">
                                            Other college students must participate online for Kurukshetra (all states including AP and Telangana).
                                        </p>
                                    </div>
                                </div>
                            )}

                            {event.virtualEnabled && virtualEligibility.isEligible && !isInternational && !isKurukshetraEvent && (
                                <div className="border-t border-zinc-800 pt-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Participation Mode</h3>
                                    <div className="space-y-3">
                                        {/* Physical Option */}
                                        <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${!isVirtual ? 'border-red-600 bg-red-600/10' : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'}`}>
                                            <input
                                                type="radio"
                                                name="participationMode"
                                                checked={!isVirtual}
                                                onChange={() => setIsVirtual(false)}
                                                className="mt-1 w-5 h-5 text-red-600 focus:ring-red-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-semibold">Physical Participation</span>
                                                    <span className="text-red-500 font-bold">₹{REGISTRATION_FEES.PHYSICAL}</span>
                                                </div>
                                                <p className="text-zinc-400 text-sm mt-1">
                                                    Attend in-person at KL University, Vijayawada
                                                </p>
                                            </div>
                                        </label>

                                        {/* Virtual Option */}
                                        <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${isVirtual ? 'border-red-600 bg-red-600/10' : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'}`}>
                                            <input
                                                type="radio"
                                                name="participationMode"
                                                checked={isVirtual}
                                                onChange={() => setIsVirtual(true)}
                                                className="mt-1 w-5 h-5 text-red-600 focus:ring-red-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-semibold">Virtual Participation</span>
                                                    <span className="text-red-500 font-bold">₹{REGISTRATION_FEES.VIRTUAL}</span>
                                                </div>
                                                <p className="text-zinc-400 text-sm mt-1">
                                                    Participate online via proctored platform
                                                </p>
                                                {/* Virtual Benefits */}
                                                <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                                    <p className="text-zinc-200 font-semibold text-xs mb-2">✨ Virtual Benefits:</p>
                                                    <ul className="space-y-1 text-xs text-zinc-300">
                                                        <li className="flex items-center gap-2">
                                                            <FiCheck className="text-zinc-400" size={12} />
                                                            Proctored virtual meeting for competition
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <FiCheck className="text-zinc-400" size={12} />
                                                            Eligible for cash prizes
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <FiCheck className="text-zinc-400" size={12} />
                                                            Participation certificate provided
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Show ineligibility message if virtual is enabled but user is not eligible */}
                            {event.virtualEnabled && !virtualEligibility.isEligible && !isInternational && !isKurukshetraOtherCollegeVirtualOnly && (
                                <div className="border-t border-zinc-800 pt-6">
                                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                                        <p className="text-zinc-400 text-sm">
                                            <span className="text-zinc-300 font-semibold">ℹ️ Note:</span> {virtualEligibility.reason}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Terms and Conditions */}
                            <div className="border-t border-zinc-800 pt-6">
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    Terms and Conditions
                                    {effectiveIsVirtual && event.virtualTermsAndConditions && (
                                        <span className="ml-2 text-xs font-normal text-emerald-400">(Virtual Participation)</span>
                                    )}
                                </h3>
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
                                            // Show virtual terms if virtual and they exist, otherwise show regular terms
                                            const termsText = (effectiveIsVirtual && event.virtualTermsAndConditions) 
                                                ? event.virtualTermsAndConditions 
                                                : event.termsandconditions;
                                            
                                            let points = termsText ? termsText.split(/\r?\n/).filter(line => line.trim()) : [];
                                            if (points.length === 1 && points[0].length > 50) {
                                                const sentences = points[0].split(/\.\s+/).filter(s => s.trim());
                                                if (sentences.length > 1) {
                                                    points = sentences.map(s => s.trim().endsWith('.') ? s : s + '.');
                                                }
                                            }
                                            const dotColor = (effectiveIsVirtual && event.virtualTermsAndConditions) ? "bg-emerald-500" : "bg-red-500";
                                            return points.length > 0 ? points.map((point, index) => (
                                                <div key={index} className="flex gap-2 text-start">
                                                    <span className={`${dotColor} mt-1.5 min-w-[5px] h-1.5 rounded-full block shrink-0`} />
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
                                    {event.isGroupEvent ? "Review Details" : "Proceed to Payment"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment Modal */}
                <AnimatePresence>
                    {showPaymentModal && (
                        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center px-4 bg-black/80 backdrop-blur-sm pt-16 pb-6 md:pt-20 md:pb-10 overflow-y-auto" data-lenis-prevent>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-zinc-900 border border-zinc-800 rounded-2xl w-full shadow-2xl max-h-[90vh] md:max-h-full flex flex-col overflow-y-auto custom-scrollbar transition-all duration-300 ${isInternational ? 'max-w-md' : 'max-w-md md:max-w-5xl'}`}
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
                                                {isInternational ? "Confirm Registration" : "Payment Summary"}
                                            </h2>
                                            <p className="text-zinc-400 text-xs">
                                                {isInternational ? "Virtual participation – free registration" : "Complete your registration"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-full flex flex-col">
                                        {/* LEFT COLUMN: Summary & Details */}
                                        <div className={`p-5 md:p-6 bg-zinc-950/50 space-y-5 w-full ${paymentStep === 1 && !isInternational ? 'hidden' : 'block'}`}>
                                            {!isInternational && (
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
                                                        {isInternational ? (
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
                                                        {isInternational ? (
                                                            <span className="text-green-500">Free</span>
                                                        ) : (
                                                            `₹${totalFee}`
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                                                <h3 className="text-[10px] md:text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                                                    {effectiveIsVirtual || isInternational ? "Virtual Participation Includes:" : "Also Includes Complimentary:"}
                                                </h3>
                                                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-base text-zinc-300">
                                                    {effectiveIsVirtual || isInternational ? (
                                                        <>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                                <span>Proctored virtual meeting for competition</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                                <span>Eligible for cash prizes</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                                <span>Participation certificate provided</span>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                                <span>Complimentary Accommodation (1 Day)</span>
                                                            </li>
                                                            <li className="flex items-start gap-2">
                                                                <span className="text-green-500 text-[10px] md:text-sm mt-0.5">✓</span>
                                                                <span>Complimentary Special Lunch</span>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>

                                            {/* ID Card Mandatory Warning – not shown for virtual, international, or KL users */}
                                            {!effectiveIsVirtual && !isInternational && (
                                                <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-3 md:p-4">
                                                    <div className="flex items-start gap-2 md:gap-3">
                                                        <div className="text-red-500 text-lg md:text-xl font-bold shrink-0">⚠️</div>
                                                        <div>
                                                            <h3 className="text-red-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-wide">
                                                                Important Notice
                                                            </h3>
                                                            <p className="text-red-300 text-[9px] md:text-xs font-medium leading-relaxed">
                                                                COLLEGE PHYSICAL ID CARD MANDATORY FOR ENTRY TO THE FEST
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mobile Buttons - Now Visible on Desktop too */}
                                            <div className="pt-2">
                                                {!isInternational && (
                                                    <button
                                                        onClick={() => setPaymentStep(1)}
                                                        className="w-full py-2.5 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm md:text-base shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                                                    >
                                                        Proceed
                                                    </button>
                                                )}
                                                {isInternational && (
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

                                        {/* RIGHT COLUMN: Payment Details – not shown for international (virtual participation) */}
                                        {!isInternational && (
                                            <div className={`p-5 md:p-6 space-y-5 w-full ${paymentStep === 1 ? 'block' : 'hidden'}`}>
                                                <div className="hidden md:block">
                                                    <h2 className="text-lg md:text-2xl font-bold text-white mb-0.5">Payment</h2>
                                                    <p className="text-zinc-500 text-xs md:text-sm">Scan & Upload Screenshot</p>
                                                </div>

                                                {/* ID Card Mandatory Warning - only for physical participation */}
                                                {!effectiveIsVirtual && (
                                                    <div className="bg-red-600/20 border-2 border-red-500/50 rounded-lg p-3 md:p-4">
                                                        <div className="flex items-start gap-2 md:gap-3">
                                                            <div className="text-red-500 text-lg md:text-xl font-bold shrink-0">⚠️</div>
                                                            <div>
                                                                <h3 className="text-red-400 font-bold text-[10px] md:text-xs mb-1 uppercase tracking-wide">
                                                                    Important Notice
                                                                </h3>
                                                                <p className="text-red-300 text-[9px] md:text-xs font-medium leading-relaxed">
                                                                    COLLEGE PHYSICAL ID CARD MANDATORY FOR ENTRY TO THE FEST
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

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
                                                                <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Payment Screenshot (Max 4MB) *</label>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                    if (file.size > 4 * 1024 * 1024) {
                                                                                toast.error("File size exceeds 4MB limit");
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
                                                                <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">UTR ID *</label>
                                                                <input
                                                                    type="tel"
                                                                    placeholder="12-digit UTR / UPI Ref ID"
                                                                    value={paymentDetails.utrId}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.replace(/\D/g, '');
                                                                        if (value.length <= 12) {
                                                                            setPaymentDetails({ ...paymentDetails, utrId: value });
                                                                        }
                                                                    }}
                                                                    maxLength={12}
                                                                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm md:text-base text-white focus:border-red-500 outline-none placeholder:text-zinc-600 transition-all font-mono"
                                                                />
                                                                {paymentDetails.utrId && paymentDetails.utrId.length !== 12 && (
                                                                    <p className="text-xs text-amber-400 mt-1">{paymentDetails.utrId.length}/12 digits</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs md:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">PAYER NAME *</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Name as per Bank records"
                                                                    value={paymentDetails.payeeName}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.replace(/[^a-zA-Z\s.]/g, '');
                                                                        setPaymentDetails({ ...paymentDetails, payeeName: value });
                                                                    }}
                                                                    maxLength={50}
                                                                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm md:text-base text-white focus:border-red-500 outline-none placeholder:text-zinc-600 transition-all"
                                                                />
                                                                {paymentDetails.payeeName && paymentDetails.payeeName.length < 2 && (
                                                                    <p className="text-xs text-amber-400 mt-1">Name too short</p>
                                                                )}
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
                                        <span className={`w-2 h-2 rounded-full ${isInternational ? "bg-green-500" : "bg-yellow-500"}`} />
                                        {isInternational ? "Virtual Participation – Free Registration" : "Payment Verification Required"}
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
