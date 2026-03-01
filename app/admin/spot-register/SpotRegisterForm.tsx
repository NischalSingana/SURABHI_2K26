"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  getUserFullByEmail,
  updateSpotRegisterUserDetails,
  spotRegisterUser,
  createSpotRegisterUserWithPassword,
  type UserFullDetails,
} from "@/actions/spot-register.action";
import { searchUsers } from "@/actions/events.action";
import { uploadPaymentScreenshot } from "@/actions/upload.action";
import { Category, Event } from "@prisma/client";
import { useRouter } from "next/navigation";
import { REGISTRATION_FEES } from "@/lib/constants";
import { checkVirtualEligibility } from "@/lib/virtual-eligibility";

type CategoryWithEvents = Category & { Event: Event[] };

interface SearchedUser {
  id: string;
  name: string | null;
  email: string;
  collage: string | null;
  collageId: string | null;
}

function isKLStudent(user: { email?: string | null; collage?: string | null }): boolean {
  return !!(
    user.email?.toLowerCase().endsWith("@kluniversity.in") ||
    user.collage?.toLowerCase()?.includes("kl university")
  );
}

function isKurukshetraEvent(categoryName?: string | null): boolean {
  return (categoryName ?? "").toLowerCase().includes("kurukshetra");
}

export default function SpotRegisterForm({ categories }: { categories: CategoryWithEvents[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fetchedUser, setFetchedUser] = useState<UserFullDetails | null>(null);
  const [editDetails, setEditDetails] = useState<Partial<UserFullDetails>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [utr, setUtr] = useState("");
  const [payee, setPayee] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [teamSizeInput, setTeamSizeInput] = useState("1");
  const [teamSize, setTeamSize] = useState(1);
  const [teamMembers, setTeamMembers] = useState<{ name: string; gender: string }[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberGender, setMemberGender] = useState("");
  const [userNotFound, setUserNotFound] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualGender, setManualGender] = useState<"" | "MALE" | "FEMALE" | "OTHER">("");
  const [manualCollege, setManualCollege] = useState("Spot Registration");
  const [manualPassword, setManualPassword] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!showDropdown || !inputContainerRef.current) return;
    const updatePosition = () => {
      if (inputContainerRef.current) {
        const rect = inputContainerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showDropdown, searchResults.length, isSearching]);

  const handleSearch = (query: string) => {
    setEmail(query);
    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setShowDropdown(true);
  };

  useEffect(() => {
    const q = email.trim();
    if (q.length < 1) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchUsers(q);
        if (res.success && res.data) {
          setSearchResults(res.data);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [email]);

  const selectUserFromDropdown = async (user: SearchedUser) => {
    setEmail(user.email);
    setShowDropdown(false);
    setSearchResults([]);
    setIsFetching(true);
    setUserNotFound(false);
    setFetchedUser(null);
    setEditDetails({});
    try {
      const res = await getUserFullByEmail(user.email.trim().toLowerCase());
      if (res.success && res.user) {
        setFetchedUser(res.user as UserFullDetails);
        setEditDetails({});
      } else {
        setUserNotFound(true);
        setManualName(user.name || "");
        setManualPhone("");
        setManualGender("");
        setManualCollege(user.collage || "Spot Registration");
      }
    } catch {
      toast.error("Failed to fetch user");
    } finally {
      setIsFetching(false);
    }
  };

  const events = categories.find((c) => c.id === selectedCategory)?.Event || [];
  const selectedEventDetails = events.find((e) => e.id === selectedEvent);
  const isGroupEvent = !!selectedEventDetails?.isGroupEvent;
  const minTeamSize = selectedEventDetails?.minTeamSize ?? 1;
  const maxTeamSize = selectedEventDetails?.maxTeamSize ?? 1;
  const categoryName = categories.find((c) => c.id === selectedCategory)?.name;
  const isKurukshetra = isKurukshetraEvent(categoryName);
  const leadProfile = fetchedUser || {
    email: email.trim().toLowerCase(),
    collage: manualCollege,
    state: editDetails.state || null,
    isInternational: editDetails.isInternational ?? false,
  };
  const isKL = isKLStudent(leadProfile);
  const virtualEligibility = checkVirtualEligibility({
    email: leadProfile.email,
    collage: leadProfile.collage,
    state: leadProfile.state,
    isInternational: leadProfile.isInternational ?? false,
  });
  const canChooseVirtual =
    selectedEventDetails?.virtualEnabled &&
    (isKurukshetra ? !isKL : virtualEligibility.isEligible);
  const effectiveVirtual = isVirtual && canChooseVirtual;
  const amount =
    leadProfile.isInternational
      ? 0
      : effectiveVirtual
        ? REGISTRATION_FEES.VIRTUAL
        : REGISTRATION_FEES.PHYSICAL;

  const clampTeamSize = (n: number) => Math.max(minTeamSize, Math.min(maxTeamSize, n));

  const handleFetchUser = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast.error("Enter a valid email");
      return;
    }
    setIsFetching(true);
    setUserNotFound(false);
    setFetchedUser(null);
    setEditDetails({});
    try {
      const res = await getUserFullByEmail(normalized);
      if (res.success && res.user) {
        setFetchedUser(res.user as UserFullDetails);
        setEditDetails({});
      } else {
        setUserNotFound(true);
        setManualName("");
        setManualPhone("");
        setManualGender("");
        setManualCollege("Spot Registration");
      }
    } catch {
      toast.error("Failed to fetch user");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!fetchedUser) return;
    const merged = { ...fetchedUser, ...editDetails };
    if (!merged.name?.trim() || !merged.phone?.trim() || !merged.gender?.trim()) {
      toast.error("Name, phone, and gender are required");
      return;
    }
    setIsSavingDetails(true);
    try {
      const res = await updateSpotRegisterUserDetails(fetchedUser.id, {
        name: merged.name,
        phone: merged.phone,
        collage: merged.collage,
        collageId: merged.collageId,
        branch: merged.branch,
        year: merged.year,
        gender: merged.gender,
        state: merged.state,
        city: merged.city,
        country: merged.country,
      });
      if (res.success) {
        toast.success(res.message);
        setFetchedUser({ ...fetchedUser, ...merged } as UserFullDetails);
        setEditDetails({});
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const addTeamMember = () => {
    if (!memberName.trim() || !memberGender) {
      toast.error("Enter member name and gender");
      return;
    }
    if (teamMembers.length >= Math.max(0, teamSize - 1)) {
      toast.error(`Only ${Math.max(0, teamSize - 1)} additional members allowed`);
      return;
    }
    setTeamMembers((p) => [...p, { name: memberName.trim(), gender: memberGender }]);
    setMemberName("");
    setMemberGender("");
  };

  const removeTeamMember = (i: number) => {
    setTeamMembers((p) => p.filter((_, idx) => idx !== i));
  };

  const resetForm = () => {
    setEmail("");
    setFetchedUser(null);
    setEditDetails({});
    setUserNotFound(false);
    setSelectedCategory("");
    setSelectedEvent("");
    setFile(null);
    setUtr("");
    setPayee("");
    setTeamMembers([]);
    setTeamSizeInput("1");
    setTeamSize(1);
    setGroupName("");
    setManualName("");
    setManualPhone("");
    setManualGender("");
    setManualCollege("Spot Registration");
    setManualPassword("");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Enter email");
      return;
    }

    if (userNotFound) {
      if (!manualName.trim() || !manualPhone.trim() || !manualGender) {
        toast.error("Enter name, phone, and gender for new user");
        return;
      }
      if (!manualPassword || manualPassword.length < 6) {
        toast.error("Set a password (min 6 characters) so they can log in");
        return;
      }
    } else if (!fetchedUser) {
      toast.error("Fetch user details first");
      return;
    }

    if (!selectedEvent) {
      toast.error("Select category and event");
      return;
    }

    if (isGroupEvent) {
      if (!groupName.trim()) {
        toast.error("Enter team name");
        return;
      }
      const required = Math.max(0, teamSize - 1);
      if (teamMembers.length !== required) {
        toast.error(`Add exactly ${required} team member(s)`);
        return;
      }
    }

    if (amount > 0 && (!file || !utr.trim() || !payee.trim())) {
      toast.error("Upload screenshot, UTR ID, and payee name");
      return;
    }

    startTransition(async () => {
      let didCreateUser = false;
      if (userNotFound) {
        const createRes = await createSpotRegisterUserWithPassword(
          normalizedEmail,
          manualPassword,
          {
            name: manualName.trim(),
            phone: manualPhone.trim(),
            gender: manualGender as "MALE" | "FEMALE" | "OTHER",
            college: manualCollege.trim(),
          }
        );
        if (!createRes.success) {
          toast.error(createRes.error);
          return;
        }
        didCreateUser = true;
      }

      let paymentScreenshot = "";
      if (amount > 0) {
        const formData = new FormData();
        formData.append("file", file!);
        const uploadRes = await uploadPaymentScreenshot(formData);
        if (!uploadRes.success || !uploadRes.url) {
          toast.error(uploadRes.error || "Failed to upload screenshot");
          return;
        }
        paymentScreenshot = uploadRes.url;
      } else {
        paymentScreenshot = "FREE_INTERNATIONAL";
      }

      const leadPhone =
        (fetchedUser?.phone || editDetails.phone || manualPhone)?.trim() || "0000000000";

      const res = await spotRegisterUser(
        normalizedEmail,
        selectedEvent,
        {
          paymentScreenshot,
          utrId: utr || "N/A",
          payeeName: payee || "Spot Registration",
        },
        isGroupEvent
          ? {
              groupName: groupName.trim(),
              members: teamMembers,
              teamLeadPhone: leadPhone,
            }
          : undefined,
        {
          isVirtual: effectiveVirtual,
          createUserIfNotFound: !didCreateUser,
          manualLeadName: !didCreateUser && userNotFound ? manualName.trim() : undefined,
          manualLeadPhone: !didCreateUser && userNotFound ? manualPhone.trim() : leadPhone,
          manualLeadGender:
            !didCreateUser && userNotFound && manualGender
              ? manualGender
              : (editDetails.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
          manualCollegeName: !didCreateUser && userNotFound ? manualCollege.trim() : undefined,
        }
      );

      if (res.success) {
        toast.success(res.message);
        resetForm();
      } else {
        toast.error(res.error);
      }
    });
  };

  const displayUser = fetchedUser
    ? { ...fetchedUser, ...editDetails }
    : userNotFound
      ? {
          name: manualName,
          email: email.trim(),
          phone: manualPhone,
          collage: manualCollege,
          collageId: "",
          branch: "",
          year: null as number | null,
          gender: manualGender || "",
          state: "",
          city: "",
          country: "",
          isInternational: false,
        }
      : null;

  const leadPhone = displayUser?.phone || "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Email & Fetch */}
      <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
        <label className="block text-sm font-medium text-zinc-400 mb-2">Participant Email</label>
        <div className="relative" ref={inputContainerRef}>
          <div className="flex gap-2">
            <input
              type="text"
              value={email}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => { if (email.length >= 2) setShowDropdown(true); }}
              onBlur={() => { setTimeout(() => setShowDropdown(false), 200); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleFetchUser())}
              className="flex-1 bg-zinc-800 p-2.5 rounded text-white border border-zinc-700"
              placeholder="Search by name or email..."
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleFetchUser}
              disabled={isFetching}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50 shrink-0"
            >
              {isFetching ? "Fetching..." : "Fetch"}
            </button>
          </div>
          {showDropdown && (searchResults.length > 0 || isSearching) && dropdownPosition.width > 0 &&
          createPortal(
            <div
              className="fixed z-[9999] bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: 280,
                minHeight: 200,
              }}
            >
              <div
                className="overflow-y-auto overflow-x-hidden w-full py-1"
                style={{
                  maxHeight: 260,
                  minHeight: 180,
                  overscrollBehavior: "contain",
                }}
                onWheel={(e) => e.stopPropagation()}
              >
                {isSearching ? (
                  <div className="p-3 text-zinc-400 text-sm">Searching users...</div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0 flex flex-col gap-0 items-stretch shrink-0"
                      onClick={() => selectUserFromDropdown(user)}
                    >
                      <span className="font-medium text-white text-sm truncate leading-tight">{user.name || "No name"}</span>
                      <span className="text-xs text-zinc-400 truncate leading-tight">{user.email}</span>
                      <span className="text-xs text-zinc-500 truncate leading-tight">
                        {user.collage || "No college"} {user.collageId ? `(${user.collageId})` : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-2">Type name or email to search from registered users, or enter email and click Fetch.</p>
      </div>

      {/* User details - editable */}
      {displayUser && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
          {userNotFound && (
            <div className="rounded-lg p-4 bg-amber-900/30 border border-amber-600/50">
              <p className="text-amber-200 font-medium">Create New User</p>
              <p className="text-amber-200/80 text-sm mt-1">User not found. Enter details and set a password so they can log in and see their competitions.</p>
            </div>
          )}
          <h3 className="text-lg font-semibold text-white flex items-center justify-between">
            User Details
            {fetchedUser && (
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="text-sm px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded disabled:opacity-50"
              >
                {isSavingDetails ? "Saving..." : "Save Details"}
              </button>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name</label>
              <input
                type="text"
                value={(userNotFound ? manualName : editDetails.name ?? fetchedUser?.name) ?? ""}
                onChange={(e) =>
                  userNotFound ? setManualName(e.target.value) : setEditDetails((p) => ({ ...p, name: e.target.value }))
                }
                className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Phone</label>
              <input
                type="text"
                value={(userNotFound ? manualPhone : editDetails.phone ?? fetchedUser?.phone) ?? ""}
                onChange={(e) =>
                  userNotFound ? setManualPhone(e.target.value) : setEditDetails((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Gender</label>
              <select
                value={userNotFound ? manualGender : (editDetails.gender ?? fetchedUser?.gender ?? "")}
                onChange={(e) =>
                  userNotFound
                    ? setManualGender(e.target.value as "" | "MALE" | "FEMALE" | "OTHER")
                    : setEditDetails((p) => ({ ...p, gender: e.target.value }))
                }
                className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">College</label>
              <input
                type="text"
                value={(userNotFound ? manualCollege : editDetails.collage ?? fetchedUser?.collage) ?? ""}
                onChange={(e) =>
                  userNotFound ? setManualCollege(e.target.value) : setEditDetails((p) => ({ ...p, collage: e.target.value }))
                }
                className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
              />
            </div>
            {userNotFound && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Password (for login)</label>
                <input
                  type="password"
                  value={manualPassword}
                  onChange={(e) => setManualPassword(e.target.value)}
                  className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  placeholder="Min 6 characters"
                />
                <p className="text-xs text-zinc-500 mt-1">They will use this with their email to log in at /login</p>
              </div>
            )}
            {!userNotFound && (
              <>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">College ID</label>
                  <input
                    type="text"
                    value={editDetails.collageId ?? fetchedUser?.collageId ?? ""}
                    onChange={(e) => setEditDetails((p) => ({ ...p, collageId: e.target.value }))}
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Branch</label>
                  <input
                    type="text"
                    value={editDetails.branch ?? fetchedUser?.branch ?? ""}
                    onChange={(e) => setEditDetails((p) => ({ ...p, branch: e.target.value }))}
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Year</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={editDetails.year ?? fetchedUser?.year ?? ""}
                    onChange={(e) =>
                      setEditDetails((p) => ({ ...p, year: e.target.value ? parseInt(e.target.value, 10) : null }))
                    }
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">State</label>
                  <input
                    type="text"
                    value={editDetails.state ?? fetchedUser?.state ?? ""}
                    onChange={(e) => setEditDetails((p) => ({ ...p, state: e.target.value }))}
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">City</label>
                  <input
                    type="text"
                    value={editDetails.city ?? fetchedUser?.city ?? ""}
                    onChange={(e) => setEditDetails((p) => ({ ...p, city: e.target.value }))}
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Competition selection */}
      {displayUser && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
          <h3 className="text-lg font-semibold text-white">Competition</h3>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedEvent("");
              }}
              className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedEvent(val);
                const ev = events.find((x) => x.id === val);
                if (ev?.isGroupEvent) {
                  const s = ev.minTeamSize || 1;
                  setTeamSize(s);
                  setTeamSizeInput(String(s));
                  setTeamMembers([]);
                } else {
                  setTeamSize(1);
                  setTeamSizeInput("1");
                  setTeamMembers([]);
                }
                if (!ev?.virtualEnabled) setIsVirtual(false);
              }}
              className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
              disabled={!selectedCategory}
            >
              <option value="">Select Event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          {selectedEventDetails && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsVirtual(false)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    !isVirtual ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  Physical
                </button>
                <button
                  type="button"
                  onClick={() => setIsVirtual(true)}
                  disabled={!canChooseVirtual}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    isVirtual ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Virtual
                </button>
              </div>
              {!canChooseVirtual && selectedEventDetails.virtualEnabled && (
                <p className="text-xs text-amber-400 mt-1">{virtualEligibility.reason}</p>
              )}
            </div>
          )}

          {/* Group fields */}
          {isGroupEvent && (
            <div className="space-y-3 pt-4 border-t border-zinc-700">
              <div className="rounded-lg p-4 bg-amber-900/30 border-2 border-amber-500/70">
                <p className="text-base font-semibold text-amber-200">
                  Team Lead: {displayUser.name} ({displayUser.email})
                </p>
                <p className="text-xs text-amber-200/90 mt-1">Lead is already added. Add only other members below.</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Team Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Team Size (incl. lead)</label>
                <input
                  type="number"
                  min={minTeamSize}
                  max={maxTeamSize}
                  value={teamSizeInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setTeamSizeInput(v);
                    const n = parseInt(v, 10);
                    if (!isNaN(n)) {
                      const c = clampTeamSize(n);
                      setTeamSize(c);
                      setTeamMembers((p) => p.slice(0, Math.max(0, c - 1)));
                    }
                  }}
                  className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">Allowed: {minTeamSize}–{maxTeamSize}</p>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-sm text-zinc-400">Add members (name + gender). Add only members — lead is already added when email was entered.</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Member name"
                    className="bg-zinc-800 p-2 rounded text-white border border-zinc-700 flex-1 min-w-[120px]"
                  />
                  <select
                    value={memberGender}
                    onChange={(e) => setMemberGender(e.target.value)}
                    className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <button type="button" onClick={addTeamMember} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-white text-sm">
                    Add
                  </button>
                </div>
                {teamMembers.length > 0 && (
                  <ul className="space-y-1">
                    {teamMembers.map((m, i) => (
                      <li key={i} className="flex justify-between items-center bg-zinc-800/50 px-3 py-2 rounded">
                        <span className="text-white text-sm">{m.name} ({m.gender})</span>
                        <button type="button" onClick={() => removeTeamMember(i)} className="text-red-400 text-xs hover:underline">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment */}
      {displayUser && selectedEvent && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-4">
          <h3 className="text-lg font-semibold text-white">Payment</h3>
          <div className="flex items-center gap-4">
            <p className="text-2xl font-bold text-red-500">
              {amount === 0 ? "FREE" : `₹${amount}`}
            </p>
            {amount === 0 && (
              <span className="text-sm text-emerald-400">(International participant)</span>
            )}
          </div>
          {amount > 0 && (
            <>
              <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-800/30 inline-block">
                <p className="text-sm text-zinc-400 mb-2">Scan QR to Pay</p>
                <img
                  src="/images/paymentQR.png"
                  alt="Payment QR"
                  className="w-40 h-40 object-contain"
                />
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  setFile(e.dataTransfer.files?.[0] || null);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border rounded p-4 cursor-pointer transition-colors ${
                  isDraggingFile ? "border-red-500 bg-red-500/10" : "border-zinc-700 bg-zinc-800/50"
                }`}
              >
                <p className="text-zinc-300 text-sm">
                  {file ? file.name : "Drag & drop payment screenshot or click to choose"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">UTR ID</label>
                <input
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Payee Name</label>
                <input
                  type="text"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                />
              </div>
            </>
          )}
        </div>
      )}

      {displayUser && selectedEvent && (
        <button
          type="submit"
          disabled={pending || (amount > 0 && (!file || !utr || !payee))}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Registering..." : "Complete Spot Registration"}
        </button>
      )}
    </form>
  );
}
