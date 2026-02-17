"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { registerUserByAdmin, searchUsers } from "@/actions/events.action";
import { uploadPaymentScreenshot } from "@/actions/upload.action";

export default function ManualRegisterForm({ categories }: { categories: any[] }) {
    const [email, setEmail] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
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
        
        // Simple distinct search without debounce package to keep it lightweight, 
        // relying on the fact that server action is fast enough or user types reasonably.
        // For production with high load, a debounce is recommended.
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

    const selectUser = (user: any) => {
        setEmail(user.email);
        setShowDropdown(false);
    };

    // Filter events based on category
    const events = categories.find(c => c.id === selectedCategory)?.Event || [];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !selectedEvent || !file || !utr || !payee) {
            toast.error("Please fill all fields");
            return;
        }

        startTransition(async () => {
             // 1. Upload Screenshot
             const formData = new FormData();
             formData.append("file", file);
             
             const uploadRes = await uploadPaymentScreenshot(formData);
             if (!uploadRes.success || !uploadRes.url) {
                toast.error(uploadRes.error || "Failed to upload screenshot");
                return;
             }
             
             // 2. Register User
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
                // reset file input manually if needed via ref, but this is fine for now
             } else {
                toast.error(res.error);
             }
        });
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4 max-w-md bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <div>
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

            <div>
                 <label className="block text-sm mb-1 text-zinc-400">Category</label>
                 <select 
                    value={selectedCategory} 
                    onChange={e => { setSelectedCategory(e.target.value); setSelectedEvent(""); }}
                    className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700"
                 >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => (
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
                    {events.map((ev: any) => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                 </select>
            </div>

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
                className="w-full bg-red-600 hover:bg-red-700 text-white p-2.5 rounded font-bold disabled:opacity-50 transition-colors"
            >
                {pending ? "Registering..." : "Manual Register"}
            </button>
        </form>
    );
}
