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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter a user email");
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
                            onChange={e => setSelectedEvent(e.target.value)}
                            className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                            disabled={!selectedCategory}
                        >
                            <option value="">Select Event</option>
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                        </select>
                    </div>
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
