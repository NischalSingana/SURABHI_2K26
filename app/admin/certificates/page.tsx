"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getEventsForCertificate,
    getParticipantsForEvent,
    sendCertificatesForEvent,
    sendCertificateToOne,
    generateCertificatePreview,
    updateParticipantCertDetails,
    updateGroupMemberCertDetails,
    autoAssignCertificateIds,
    type ParticipantRecord,
} from "@/actions/admin/certificate.action";
import { toast } from "sonner";

interface EventOption {
    id: string;
    name: string;
    slug: string;
    date: Date;
    isGroupEvent: boolean;
    _count: { individualRegistrations: number; groupRegistrations: number };
}

// ──────────────────────────────────────────────────────────────────────────────
// Edit Details Modal
// ──────────────────────────────────────────────────────────────────────────────
function EditModal({
    participant,
    // eventId intentionally omitted — used by parent for routing context
    onClose,
    onSaved,
}: {
    participant: ParticipantRecord;
    eventId: string;        // reserved for future use (e.g. logging)
    onClose: () => void;
    onSaved: (updated: Partial<ParticipantRecord>) => void;
}) {
    const [form, setForm] = useState({
        name: participant.name ?? "",
        college: participant.college ?? "",
        regNo: participant.regNo ?? "",
        branch: participant.branch ?? "",
        certificateId: participant.certificateId?.startsWith("SUR-") 
            ? participant.certificateId.replace("SUR-", "") 
            : participant.certificateId || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        let res;
        
        const updates = {
            name: form.name || undefined,
            college: form.college || undefined,
            regNo: form.regNo || undefined,
            branch: form.branch || undefined,
            certificateId: form.certificateId ? `SUR-${form.certificateId.trim()}` : undefined,
        };

        if (participant.type === "MEMBER") {
            res = await updateGroupMemberCertDetails(participant.registrationId, participant.memberIndex as number, updates);
        } else {
            res = await updateParticipantCertDetails(participant.userId, updates);
        }
        setSaving(false);
        if (res.success) {
            const finalCertId = form.certificateId ? `SUR-${form.certificateId.trim()}` : "";
            toast.success("Details saved!");
            onSaved({ name: form.name, college: form.college, regNo: form.regNo, branch: form.branch, certificateId: finalCertId });
            onClose();
        } else {
            toast.error(res.error || "Save failed");
        }
    };

    const fields: { key: keyof typeof form; label: string; type?: string; options?: string[] }[] = [
        { key: "name", label: "Full Name" },
        { key: "college", label: "College / University" },
        { key: "regNo", label: "Registration No." },
        { key: "branch", label: "Department / Branch" },
        { key: "certificateId", label: "Certificate ID" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-red-500 uppercase font-semibold tracking-widest">Edit Certificate Fields</p>
                        <h2 className="text-white font-bold text-lg mt-0.5 truncate">{participant.name || participant.email}</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl ml-4">✕</button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {fields.map(({ key, label }) => (
                        <div key={key}>
                            <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wide font-medium">{label}</label>
                            <div className="relative flex">
                                {key === "certificateId" && (
                                    <span className="bg-zinc-800 border-y border-l border-zinc-600 text-zinc-400 rounded-l-lg px-3 flex items-center text-sm font-mono">
                                        SUR-
                                    </span>
                                )}
                                <input
                                    type="text"
                                    value={form[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    className={`w-full bg-zinc-800 border border-zinc-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-600 ${key === "certificateId" ? 'rounded-r-lg' : 'rounded-lg'}`}
                                    placeholder={key === "certificateId" ? "XXX" : `Enter ${label.toLowerCase()}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Participant Row
// ──────────────────────────────────────────────────────────────────────────────
function ParticipantRow({
    participant,
    eventId,
    onEdit,
    // onParticipantUpdate is handled by EventPanel via EditModal, not needed in ParticipantRow directly
}: {
    participant: ParticipantRecord;
    eventId: string;
    onEdit: (p: ParticipantRecord) => void;
    onParticipantUpdate: (userId: string, updates: Partial<ParticipantRecord>) => void;  // handled by parent via EditModal
}) {
    const [sending, setSending] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [sentOk, setSentOk] = useState(false);

    const handlePreview = async () => {
        setPreviewing(true);
        const res = await generateCertificatePreview(participant.userId, eventId);
        setPreviewing(false);
        if (res.success && res.base64) {
            try {
                const fetchRes = await fetch(`data:application/pdf;base64,${res.base64}`);
                const blob = await fetchRes.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
            } catch {
                toast.error("Failed to render PDF preview");
            }
        } else {
            toast.error(res.error || "Preview failed");
        }
    };

    const handleSend = async () => {
        setSending(true);
        const res = await sendCertificateToOne(participant.userId, eventId);
        setSending(false);
        if (res.success) {
            toast.success(`Certificate sent to ${participant.email}!`);
            setSentOk(true);
        } else {
            toast.error(res.error || "Send failed");
        }
    };

    const hasMissing = participant.missingFields.length > 0;

    return (
        <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group">
            {/* Name + email */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium leading-tight">{participant.name || <span className="text-red-400 italic">No name</span>}</p>
                            {participant.type === "MEMBER" && (
                                <span className="text-[10px] bg-blue-900/40 text-blue-400 border border-blue-800 px-1.5 py-0 rounded-full font-medium">MEMBER</span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-xs">{participant.type === "MEMBER" ? <span className="italic">No direct email</span> : participant.email}</p>
                    </div>
                    {hasMissing && (
                        <span title={`Missing: ${participant.missingFields.join(", ")}`}
                            className="shrink-0 text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded-full">
                            ⚠ {participant.missingFields.length}
                        </span>
                    )}
                </div>
            </td>
            {/* College */}
            <td className="px-4 py-3 text-sm text-zinc-300 max-w-[160px] truncate">
                {participant.college ?? <span className="text-red-400/70 text-xs italic">—</span>}
            </td>
            {/* Reg No */}
            <td className="px-4 py-3 text-sm text-zinc-300 font-mono">
                {participant.regNo ?? <span className="text-red-400/70 text-xs italic">—</span>}
            </td>
            {/* Branch */}
            <td className="px-4 py-3 text-sm text-zinc-300 max-w-[120px] truncate">
                {participant.branch ?? <span className="text-red-400/70 text-xs italic">—</span>}
            </td>
            {/* Actions */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    {/* Preview (For Everyone) */}
                    <button
                        onClick={handlePreview}
                        disabled={previewing}
                        title="Preview certificate PDF"
                        className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {previewing ? "…" : "👁 Preview"}
                    </button>

                    {/* Send (Only for Team Leads / Individual) */}
                    {participant.type !== "MEMBER" && (
                        <button
                            onClick={handleSend}
                            disabled={sending || sentOk}
                            title="Send certificate email"
                            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap
                                ${sentOk
                                    ? "bg-emerald-800/50 text-emerald-400 cursor-default"
                                    : "bg-red-700 hover:bg-red-600 text-white disabled:opacity-50"}`}
                        >
                            {sending ? "…" : sentOk ? "✓ Sent" : "✉ Send"}
                        </button>
                    )}

                    {/* Edit */}
                    <button
                        onClick={() => onEdit(participant)}
                        title="Edit certificate details"
                        className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700 whitespace-nowrap"
                    >
                        ✏ Edit
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Event Panel (expandable)
// ──────────────────────────────────────────────────────────────────────────────
function EventPanel({
    event,
}: {
    event: EventOption;
}) {
    const [expanded, setExpanded] = useState(false);
    const [participants, setParticipants] = useState<ParticipantRecord[] | null>(null);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [editTarget, setEditTarget] = useState<ParticipantRecord | null>(null);
    const [bulkSending, setBulkSending] = useState(false);

    const totalApproved = event._count.individualRegistrations + event._count.groupRegistrations;
    const formatDate = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const loadParticipants = useCallback(async () => {
        if (participants !== null) return;
        setLoadingParticipants(true);
        const res = await getParticipantsForEvent(event.id);
        setLoadingParticipants(false);
        if (res.success && res.data) {
            setParticipants(res.data.participants);
        } else {
            toast.error(res.error || "Failed to load participants");
        }
    }, [event.id, participants]);

    const handleToggle = () => {
        if (!expanded) loadParticipants();
        setExpanded(e => !e);
    };

    const handleParticipantUpdate = (userId: string, updates: Partial<ParticipantRecord>) => {
        setParticipants(prev => prev
            ? prev.map(p => p.userId === userId ? { ...p, ...updates, missingFields: computeMissing({ ...p, ...updates }) } : p)
            : prev
        );
    };

    const handleBulkSend = async () => {
        setBulkSending(true);
        const toastId = toast.loading(`Sending all ${totalApproved} certificates for "${event.name}"…`, { duration: Infinity });
        const res = await sendCertificatesForEvent(event.id);
        toast.dismiss(toastId);
        setBulkSending(false);
        if (res.success && res.data) {
            const { sent, failed } = res.data;
            if (failed === 0) toast.success(`✅ Sent ${sent} certificate(s)`);
            else toast.warning(`⚠️ Sent: ${sent} | Failed: ${failed}`);
        } else {
            toast.error(res.error || "Bulk send failed");
        }
    };

    const missingCount = participants?.filter(p => p.missingFields.length > 0).length ?? 0;

    return (
        <>
            {/* Edit Modal */}
            {editTarget && (
                <EditModal
                    participant={editTarget}
                    eventId={event.id}
                    onClose={() => setEditTarget(null)}
                    onSaved={updates => handleParticipantUpdate(editTarget.userId, updates)}
                />
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Event header — click to expand */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleToggle}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && handleToggle()}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/50 transition-colors cursor-pointer select-none"
                >
                    <span className={`text-zinc-400 transition-transform duration-200 text-xs ${expanded ? "rotate-90" : ""}`}>▶</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold truncate">{event.name}</span>
                            {event.isGroupEvent && (
                                <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">Group</span>
                            )}
                            {participants !== null && missingCount > 0 && (
                                <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                                    ⚠ {missingCount} incomplete
                                </span>
                            )}
                        </div>
                        <p className="text-zinc-500 text-xs mt-0.5">📅 {formatDate(event.date)} · <span className="text-emerald-400 font-semibold">{totalApproved} approved</span></p>
                    </div>
                    {/* Bulk Send — stopPropagation so clicking Send All doesn't also toggle expand */}
                    <button
                        onClick={e => { e.stopPropagation(); handleBulkSend(); }}
                        disabled={bulkSending}
                        className="shrink-0 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {bulkSending ? "Sending…" : "✉ Send All"}
                    </button>
                </div>

                {/* Participant table */}
                {expanded && (
                    <div className="border-t border-zinc-800">
                        {loadingParticipants ? (
                            <div className="px-5 py-8 text-center text-zinc-500 animate-pulse text-sm">Loading participants…</div>
                        ) : participants && participants.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-950/50">
                                            <th className="px-4 py-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Name / Email</th>
                                            <th className="px-4 py-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">College</th>
                                            <th className="px-4 py-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Reg. No.</th>
                                            <th className="px-4 py-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Department</th>
                                            <th className="px-4 py-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participants.map(p => (
                                            <ParticipantRow
                                                key={p.userId}
                                                participant={p}
                                                eventId={event.id}
                                                onEdit={setEditTarget}
                                                onParticipantUpdate={handleParticipantUpdate}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-5 py-8 text-center text-zinc-500 text-sm">No approved participants found.</div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function computeMissing(p: Partial<ParticipantRecord>): string[] {
    const m: string[] = [];
    if (!p.name) m.push("Name");
    if (!p.college) m.push("College");
    if (!p.regNo) m.push("Reg. No.");
    if (!p.branch) m.push("Department");
    return m;
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
    const [events, setEvents] = useState<EventOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    const handleAutoAssign = async () => {
        setAssigning(true);
        const toastId = toast.loading("Auto-assigning SUR-XXXX IDs to all participants…", { duration: Infinity });
        const res = await autoAssignCertificateIds();
        toast.dismiss(toastId);
        setAssigning(false);
        if (res.success) {
            if (res.assigned === 0) {
                toast.info("All participants already have Certificate IDs — nothing to assign.");
            } else {
                toast.success(`✅ Assigned ${res.assigned} new Certificate ID(s)! Reload the page to see them.`);
            }
        } else {
            toast.error(res.error || "Auto-assign failed");
        }
    };

    useEffect(() => {
        (async () => {
            const res = await getEventsForCertificate();
            if (res.success && res.data) setEvents(res.data as EventOption[]);
            else toast.error(res.error || "Failed to load events");
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="text-zinc-400 text-lg animate-pulse">Loading events…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-sm text-red-500 uppercase tracking-widest font-semibold mb-1">Admin Panel</p>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <h1 className="text-3xl font-extrabold text-white mb-2">🎓 Participation Certificates</h1>
                        <button
                            onClick={handleAutoAssign}
                            disabled={assigning}
                            className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition-colors whitespace-nowrap shadow-lg"
                        >
                            {assigning ? "⏳ Assigning…" : "🔢 Auto-Assign IDs"}
                        </button>
                    </div>
                    <p className="text-zinc-400 text-sm">
                        Click a competition to expand its participant list. Use <strong className="text-zinc-200">👁 Preview</strong> to verify the certificate,
                        <strong className="text-zinc-200"> ✏ Edit</strong> to fix missing fields, and
                        <strong className="text-zinc-200"> ✉ Send</strong> to email individually — or <strong className="text-zinc-200">✉ Send All</strong> for bulk.
                    </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-6 text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-400"><span className="bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">⚠ N</span> missing fields</span>
                    <span className="flex items-center gap-1.5 text-zinc-400"><span className="bg-emerald-800/50 text-emerald-400 px-2 py-0.5 rounded-md">✓ Sent</span> already sent</span>
                    <span className="text-zinc-600">Red dash = field empty</span>
                </div>

                {events.length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-10 text-center text-zinc-500">
                        No events with approved registrations found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map(event => (
                            <EventPanel key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
