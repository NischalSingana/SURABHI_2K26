"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { registerUserByAdmin, searchUsers } from "@/actions/events.action";
import { registerVisitorPassByAdmin } from "@/actions/pass.action";
import { uploadPaymentScreenshot } from "@/actions/upload.action";
import { Category, Event } from "@prisma/client";

type CategoryWithEvents = Category & { Event: Event[] };

interface SearchedUser {
    id: string;
    name: string | null;
    email: string;
    collage: string | null;
    collageId: string | null;
}

interface GroupMember {
    name: string;
    phone: string;
    gender: string;
    inGameName?: string;
    inGameId?: string;
    riotId?: string;
}

type RegType = "EVENT" | "VISITOR_PASS";

export default function ManualRegisterForm({ categories }: { categories: CategoryWithEvents[] }) {
    const [regType, setRegType] = useState<RegType>("EVENT");
    const [email, setEmail] = useState("");
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [utr, setUtr] = useState("");
    const [payee, setPayee] = useState("");
    const [groupName, setGroupName] = useState("");
    const [teamSize, setTeamSize] = useState(1);
    const [teamMembers, setTeamMembers] = useState<GroupMember[]>([]);
    const [mentorName, setMentorName] = useState("");
    const [mentorPhone, setMentorPhone] = useState("");
    const [memberName, setMemberName] = useState("");
    const [memberPhone, setMemberPhone] = useState("");
    const [memberGender, setMemberGender] = useState("");
    const [teamLeadInGameName, setTeamLeadInGameName] = useState("");
    const [teamLeadInGameId, setTeamLeadInGameId] = useState("");
    const [teamLeadRiotId, setTeamLeadRiotId] = useState("");
    const [memberInGameName, setMemberInGameName] = useState("");
    const [memberInGameId, setMemberInGameId] = useState("");
    const [memberRiotId, setMemberRiotId] = useState("");
    const [isVirtual, setIsVirtual] = useState(false);
    const [createIfMissing, setCreateIfMissing] = useState(false);
    const [newUserGender, setNewUserGender] = useState<"" | "MALE" | "FEMALE">("");
    const [pending, startTransition] = useTransition();

    const handleSearch = async (query: string) => {
        setEmail(query);
        if (query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);
        
        try {
            const res = await searchUsers(query);
            if (res.success && res.data) {
                setSearchResults(res.data);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectUser = (user: SearchedUser) => {
        setEmail(user.email);
        setShowDropdown(false);
    };

    const events = categories.find(c => c.id === selectedCategory)?.Event || [];
    const selectedEventDetails = events.find((ev) => ev.id === selectedEvent);
    const isSelectedGroupEvent = regType === "EVENT" && !!selectedEventDetails?.isGroupEvent;
    const minTeamSize = selectedEventDetails?.minTeamSize ?? 1;
    const maxTeamSize = selectedEventDetails?.maxTeamSize ?? 1;
    const isFreeFireOrBGMI = !!selectedEventDetails?.name?.toLowerCase().match(/free fire|bgmi/);
    const isValorant = !!selectedEventDetails?.name?.toLowerCase().includes("valorant");
    const needsInGameFields = isSelectedGroupEvent && (isFreeFireOrBGMI || isValorant);

    const clearGroupForm = () => {
        setGroupName("");
        setTeamMembers([]);
        setMentorName("");
        setMentorPhone("");
        setMemberName("");
        setMemberPhone("");
        setMemberGender("");
        setTeamLeadInGameName("");
        setTeamLeadInGameId("");
        setTeamLeadRiotId("");
        setMemberInGameName("");
        setMemberInGameId("");
        setMemberRiotId("");
    };

    const addTeamMember = () => {
        if (!memberName.trim()) {
            toast.error("Please enter member name");
            return;
        }
        if (!memberPhone.trim()) {
            toast.error("Please enter member phone number");
            return;
        }
        if (!memberGender) {
            toast.error("Please select member gender");
            return;
        }
        if (needsInGameFields) {
            if (!memberInGameName.trim()) {
                toast.error("Please enter member in-game name");
                return;
            }
            if (isFreeFireOrBGMI && !memberInGameId.trim()) {
                toast.error("Please enter member in-game ID");
                return;
            }
            if (isValorant && !memberRiotId.trim()) {
                toast.error("Please enter member Riot ID");
                return;
            }
        }
        if (teamMembers.length >= Math.max(0, teamSize - 1)) {
            toast.error(`Only ${Math.max(0, teamSize - 1)} additional members are allowed`);
            return;
        }

        const memberObj: GroupMember = {
            name: memberName.trim(),
            phone: memberPhone.trim(),
            gender: memberGender,
        };
        if (needsInGameFields) {
            memberObj.inGameName = memberInGameName.trim();
            if (isFreeFireOrBGMI) memberObj.inGameId = memberInGameId.trim();
            if (isValorant) memberObj.riotId = memberRiotId.trim();
        }

        setTeamMembers((prev) => [
            ...prev,
            memberObj,
        ]);
        setMemberName("");
        setMemberPhone("");
        setMemberGender("");
        setMemberInGameName("");
        setMemberInGameId("");
        setMemberRiotId("");
    };

    const removeTeamMember = (index: number) => {
        setTeamMembers((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter a user email");
            return;
        }
        if (createIfMissing && !newUserGender) {
            toast.error("Please select gender for auto-created users");
            return;
        }
        if (!file || !utr || !payee) {
            toast.error("Please fill all payment fields (screenshot, UTR, payee)");
            return;
        }

        if (regType === "VISITOR_PASS") {
            startTransition(async () => {
                const formData = new FormData();
                formData.append("file", file);
                const uploadRes = await uploadPaymentScreenshot(formData);
                if (!uploadRes.success || !uploadRes.url) {
                    toast.error(uploadRes.error || "Failed to upload screenshot");
                    return;
                }
                const res = await registerVisitorPassByAdmin(email, {
                    paymentScreenshot: uploadRes.url,
                    utrId: utr,
                    payeeName: payee,
                });
                if (res.success) {
                    toast.success(res.message);
                    setEmail("");
                    setFile(null);
                    setUtr("");
                    setPayee("");
                } else {
                    toast.error(res.error);
                }
            });
            return;
        }

        if (!selectedEvent) {
            toast.error("Please select a category and event");
            return;
        }
        if (isSelectedGroupEvent) {
            if (!groupName.trim()) {
                toast.error("Please enter group name");
                return;
            }
            if (teamSize < minTeamSize || teamSize > maxTeamSize) {
                toast.error(`Team size must be between ${minTeamSize} and ${maxTeamSize}`);
                return;
            }
            const requiredAdditionalMembers = Math.max(0, teamSize - 1);
            if (teamMembers.length !== requiredAdditionalMembers) {
                toast.error(`Please add exactly ${requiredAdditionalMembers} additional members`);
                return;
            }
            if (needsInGameFields) {
                if (!teamLeadInGameName.trim()) {
                    toast.error("Please enter team lead in-game name");
                    return;
                }
                if (isFreeFireOrBGMI && !teamLeadInGameId.trim()) {
                    toast.error("Please enter team lead in-game ID");
                    return;
                }
                if (isValorant && !teamLeadRiotId.trim()) {
                    toast.error("Please enter team lead Riot ID");
                    return;
                }
            }
        }

        startTransition(async () => {
             const formData = new FormData();
             formData.append("file", file);
             
             const uploadRes = await uploadPaymentScreenshot(formData);
             if (!uploadRes.success || !uploadRes.url) {
                toast.error(uploadRes.error || "Failed to upload screenshot");
                return;
             }
             
             const res = await registerUserByAdmin(email, selectedEvent, {
                paymentScreenshot: uploadRes.url,
                utrId: utr,
                payeeName: payee
             }, isSelectedGroupEvent ? {
                groupName: groupName.trim(),
                members: teamMembers,
                mentorName: mentorName.trim() || undefined,
                mentorPhone: mentorPhone.trim() || undefined,
                teamLeadInGameName: needsInGameFields ? teamLeadInGameName.trim() : undefined,
                teamLeadInGameId: needsInGameFields && isFreeFireOrBGMI ? teamLeadInGameId.trim() : undefined,
                teamLeadRiotId: needsInGameFields && isValorant ? teamLeadRiotId.trim() : undefined,
             } : undefined, {
                isVirtual,
                createUserIfNotFound: createIfMissing,
                newUserGender: createIfMissing ? newUserGender || undefined : undefined,
             });

             if (res.success) {
                toast.success(res.message);
                setEmail("");
                setFile(null);
                setUtr("");
                setPayee("");
                setIsVirtual(false);
                clearGroupForm();
             } else {
                toast.error(res.error);
             }
        });
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4 max-w-md bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            {/* Registration Type Toggle */}
            <div>
                <label className="block text-sm mb-2 text-zinc-400">Registration Type</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setRegType("EVENT")}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                            regType === "EVENT"
                                ? "bg-red-600 border-red-500 text-white"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                        }`}
                    >
                        Event Registration
                    </button>
                    <button
                        type="button"
                        onClick={() => setRegType("VISITOR_PASS")}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                            regType === "VISITOR_PASS"
                                ? "bg-emerald-600 border-emerald-500 text-white"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                        }`}
                    >
                        Visitor Pass
                    </button>
                </div>
            </div>

            {regType === "VISITOR_PASS" && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-300 text-xs">
                        Auto-approved. Confirmation email with PDF ticket will be sent immediately. Dated 25 Jan 2026.
                    </p>
                </div>
            )}

            <div className="relative">
                <label className="block text-sm mb-1 text-zinc-400">User Email</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => handleSearch(e.target.value)} 
                    onFocus={() => { if (email.length >= 2) setShowDropdown(true); }}
                    onBlur={() => { setTimeout(() => setShowDropdown(false), 200); }} 
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                    placeholder="Search by name or email..."
                    autoComplete="off"
                />
                
                {showDropdown && (searchResults.length > 0 || isSearching) && (
                    <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {isSearching ? (
                            <div className="p-2 text-zinc-400 text-sm">Searching...</div>
                        ) : (
                            searchResults.map((user) => (
                                <div 
                                    key={user.id}
                                    className="p-2 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700 last:border-0"
                                    onClick={() => selectUser(user)}
                                >
                                    <div className="font-medium text-white text-sm">{user.name}</div>
                                    <div className="text-xs text-zinc-400">{user.email}</div>
                                    <div className="text-xs text-zinc-500 truncate">
                                        {user.collage || "No College"} {user.collageId ? `(${user.collageId})` : ""}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {regType === "EVENT" && (
                <div className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                    <label className="flex items-start gap-2 text-sm text-zinc-300">
                        <input
                            type="checkbox"
                            checked={createIfMissing}
                            onChange={(e) => {
                                setCreateIfMissing(e.target.checked);
                                if (!e.target.checked) setNewUserGender("");
                            }}
                            className="mt-0.5"
                        />
                        Create user if email not found
                    </label>
                    {createIfMissing && (
                        <div>
                            <label className="block text-xs mb-1 text-zinc-400">Gender for new user *</label>
                            <select
                                value={newUserGender}
                                onChange={(e) => setNewUserGender(e.target.value as "" | "MALE" | "FEMALE")}
                                className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                            >
                                <option value="">Select gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                            </select>
                            <p className="text-[11px] text-zinc-500 mt-1">
                                New user defaults: random name/phone/college, city Bangalore, state Karnataka.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {regType === "EVENT" && (
                <>
                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">Category</label>
                        <select 
                            value={selectedCategory} 
                            onChange={e => { setSelectedCategory(e.target.value); setSelectedEvent(""); }}
                            className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                        >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">Event</label>
                        <select 
                            value={selectedEvent} 
                            onChange={e => {
                                const nextEventId = e.target.value;
                                setSelectedEvent(nextEventId);
                                const nextEvent = events.find((ev) => ev.id === nextEventId);
                                if (nextEvent?.isGroupEvent) {
                                    setTeamSize(nextEvent.minTeamSize || 1);
                                } else {
                                    setTeamSize(1);
                                    clearGroupForm();
                                }
                                if (!nextEvent?.virtualEnabled) {
                                    setIsVirtual(false);
                                }
                            }}
                            className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                            disabled={!selectedCategory}
                        >
                            <option value="">Select Event</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-zinc-400">Participation Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsVirtual(false)}
                                className={`px-3 py-2 rounded-lg text-sm border ${
                                    !isVirtual ? "bg-red-600 border-red-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-300"
                                }`}
                            >
                                Physical
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsVirtual(true)}
                                disabled={!selectedEventDetails?.virtualEnabled}
                                className={`px-3 py-2 rounded-lg text-sm border ${
                                    isVirtual ? "bg-emerald-600 border-emerald-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-300"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Virtual
                            </button>
                        </div>
                        {!selectedEventDetails?.virtualEnabled && (
                            <p className="text-xs text-zinc-500 mt-1">Virtual mode is disabled for this event.</p>
                        )}
                    </div>

                    {isSelectedGroupEvent && (
                        <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-3">
                            <p className="text-xs text-zinc-400">
                                Group Event: add team details (same flow as competition registration). Team leader is the selected user email above.
                            </p>

                            <div>
                                <label className="block text-sm mb-1 text-zinc-400">Group Name</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                    placeholder="Enter team/group name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-zinc-400">
                                    Team Size (including leader)
                                </label>
                                <input
                                    type="number"
                                    min={minTeamSize}
                                    max={maxTeamSize}
                                    value={teamSize}
                                    onChange={(e) => {
                                        const parsed = Number(e.target.value);
                                        if (Number.isNaN(parsed)) return;
                                        const clamped = Math.max(minTeamSize, Math.min(maxTeamSize, parsed));
                                        setTeamSize(clamped);
                                        setTeamMembers((prev) => prev.slice(0, Math.max(0, clamped - 1)));
                                    }}
                                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    Allowed: {minTeamSize} to {maxTeamSize}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm mb-1 text-zinc-400">Mentor Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={mentorName}
                                        onChange={(e) => setMentorName(e.target.value)}
                                        className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-zinc-400">Mentor Phone (Optional)</label>
                                    <input
                                        type="text"
                                        value={mentorPhone}
                                        onChange={(e) => setMentorPhone(e.target.value)}
                                        className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                    />
                                </div>
                            </div>

                            {needsInGameFields && (
                                <div className="space-y-2 rounded-lg border border-zinc-700/70 bg-zinc-900/40 p-3">
                                    <p className="text-xs text-zinc-400">Team lead in-game details (for Kurukshetra)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={teamLeadInGameName}
                                            onChange={(e) => setTeamLeadInGameName(e.target.value)}
                                            placeholder="Team lead in-game name *"
                                            className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                        />
                                        {isFreeFireOrBGMI && (
                                            <input
                                                type="text"
                                                value={teamLeadInGameId}
                                                onChange={(e) => setTeamLeadInGameId(e.target.value)}
                                                placeholder="Team lead in-game ID *"
                                                className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                            />
                                        )}
                                        {isValorant && (
                                            <input
                                                type="text"
                                                value={teamLeadRiotId}
                                                onChange={(e) => setTeamLeadRiotId(e.target.value)}
                                                placeholder="Team lead Riot ID *"
                                                className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 border-t border-zinc-700 pt-3">
                                <p className="text-sm text-zinc-300">
                                    Additional Members ({teamMembers.length} / {Math.max(0, teamSize - 1)})
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={memberName}
                                        onChange={(e) => setMemberName(e.target.value)}
                                        placeholder="Member name"
                                        className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                    />
                                    <input
                                        type="text"
                                        value={memberPhone}
                                        onChange={(e) => setMemberPhone(e.target.value)}
                                        placeholder="Member phone"
                                        className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                    />
                                    <select
                                        value={memberGender}
                                        onChange={(e) => setMemberGender(e.target.value)}
                                        className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                {needsInGameFields && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={memberInGameName}
                                            onChange={(e) => setMemberInGameName(e.target.value)}
                                            placeholder="Member in-game name *"
                                            className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                        />
                                        {isFreeFireOrBGMI && (
                                            <input
                                                type="text"
                                                value={memberInGameId}
                                                onChange={(e) => setMemberInGameId(e.target.value)}
                                                placeholder="Member in-game ID *"
                                                className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                            />
                                        )}
                                        {isValorant && (
                                            <input
                                                type="text"
                                                value={memberRiotId}
                                                onChange={(e) => setMemberRiotId(e.target.value)}
                                                placeholder="Member Riot ID *"
                                                className="bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                                            />
                                        )}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={addTeamMember}
                                    className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
                                >
                                    Add Team Member
                                </button>

                                {teamMembers.length > 0 && (
                                    <div className="space-y-2">
                                        {teamMembers.map((member, idx) => (
                                            <div key={`${member.name}-${idx}`} className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900 px-3 py-2">
                                                <div className="text-sm">
                                                    <p className="text-white">{member.name}</p>
                                                    <p className="text-zinc-400 text-xs">{member.phone} • {member.gender}</p>
                                                    {needsInGameFields && member.inGameName && (
                                                        <p className="text-amber-400/90 text-xs mt-1">
                                                            {isFreeFireOrBGMI && `IGN: ${member.inGameName} • ID: ${member.inGameId || "-"}`}
                                                            {isValorant && `IGN: ${member.inGameName} • Riot: ${member.riotId || "-"}`}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTeamMember(idx)}
                                                    className="text-xs px-2 py-1 rounded bg-red-700/70 hover:bg-red-700 text-white"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div>
                <label className="block text-sm mb-1 text-zinc-400">Payment Screenshot</label>
                <input 
                    type="file" 
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"
                />
            </div>
            
            <div>
                <label className="block text-sm mb-1 text-zinc-400">UTR ID</label>
                <input 
                    type="text" 
                    value={utr} 
                    onChange={e => setUtr(e.target.value)} 
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                />
            </div>

            <div>
                <label className="block text-sm mb-1 text-zinc-400">Payee Name</label>
                <input 
                    type="text" 
                    value={payee} 
                    onChange={e => setPayee(e.target.value)} 
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                />
            </div>

            <button 
                type="submit" 
                disabled={pending}
                className={`w-full text-white p-2.5 rounded font-bold disabled:opacity-50 transition-colors ${
                    regType === "VISITOR_PASS"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                }`}
            >
                {pending
                    ? "Processing..."
                    : regType === "VISITOR_PASS"
                        ? "Register Visitor Pass (Auto-Approve)"
                        : "Manual Register"
                }
            </button>
        </form>
    );
}
