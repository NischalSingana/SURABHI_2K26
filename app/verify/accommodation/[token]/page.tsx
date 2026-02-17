import { getAccommodationPassDetails } from "@/lib/accommodation-pass";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { FiCheckCircle, FiXCircle, FiUser, FiAlertTriangle, FiUsers } from "react-icons/fi";
import AccommodationVerifyButton from "./AccommodationVerifyButton";
import Link from "next/link";

export default async function AccommodationVerifyPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const pass = await getAccommodationPassDetails(token);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const allowedRoles = ["ADMIN", "MASTER", "MANAGER"];
    const isAdmin = session?.user?.role && allowedRoles.includes(session.user.role);

    if (!pass) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <FiXCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Invalid Accommodation Pass</h1>
                <p className="text-zinc-400 max-w-md">
                    This QR code does not correspond to any valid accommodation pass in our system.
                </p>
                <Link href="/" className="mt-8 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
                    Go Home
                </Link>
            </div>
        );
    }

    const isValid = !pass.isUsed;
    let statusColor = "bg-green-500";
    let statusIcon = <FiCheckCircle className="w-12 h-12 text-green-500" />;
    let statusTitle = "Valid Accommodation Pass";
    let statusMessage = "This accommodation pass is valid and ready for check-in.";

    if (pass.isUsed) {
        statusColor = "bg-yellow-500";
        statusIcon = <FiAlertTriangle className="w-12 h-12 text-yellow-500" />;
        statusTitle = "Already Checked In";
        statusMessage = pass.usedAt
            ? `Checked in on ${new Date(pass.usedAt).toISOString().split("T")[0]}`
            : "This accommodation has already been checked in.";
    }

    return (
        <div className="min-h-screen bg-black p-4 pt-12 pb-12 flex items-center justify-center">
            <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                {/* Header / Status Banner */}
                <div className="p-8 flex flex-col items-center text-center border-b border-zinc-800 bg-gradient-to-b from-zinc-800/50 to-transparent">
                    <div className={`w-24 h-24 ${statusColor}/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-${statusColor}/30`}>
                        {statusIcon}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{statusTitle}</h1>
                    <p className={`${isValid ? "text-green-400" : "text-yellow-400"} font-medium`}>
                        {statusMessage}
                    </p>
                    <span className="mt-3 px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-full border border-zinc-700">
                        ACCOMMODATION
                    </span>
                </div>

                {/* Primary Guest & Members */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                            <FiUser className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{pass.primaryName}</h2>
                            <p className="text-zinc-400 text-sm">{pass.primaryEmail}</p>
                            {pass.primaryPhone && <p className="text-zinc-400 text-sm">{pass.primaryPhone}</p>}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">College</span>
                            <span className="text-zinc-300 text-sm font-medium text-right">{pass.user.collage || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">Booking Type</span>
                            <span className="text-zinc-300 text-sm font-medium">{pass.bookingType} • {pass.gender}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">Total Members</span>
                            <span className="text-zinc-300 text-sm font-medium">{pass.totalMembers}</span>
                        </div>
                    </div>

                    {/* Accommodation Members */}
                    {pass.members && pass.members.length > 0 && (
                        <div className="border-t border-zinc-800 pt-4 space-y-3">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                                <FiUsers className="w-3 h-3" /> Accommodation Members
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {pass.members.map((m: { name: string; email: string; phone: string }, i: number) => (
                                    <div
                                        key={i}
                                        className={`p-2 rounded border ${
                                            i === 0 ? "bg-green-900/10 border-green-900/30" : "bg-zinc-950/50 border-zinc-800/50"
                                        }`}
                                    >
                                        <p className={`text-sm font-medium ${i === 0 ? "text-green-400" : "text-zinc-300"}`}>
                                            {m.name} {i === 0 && "(Primary)"}
                                        </p>
                                        <p className="text-zinc-500 text-xs">{m.email}</p>
                                        {m.phone && <p className="text-zinc-500 text-xs">{m.phone}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Registered Competitions */}
                    {pass.competitions && pass.competitions.length > 0 && (
                        <div className="border-t border-zinc-800 pt-4">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider font-bold mb-2">Registered Competitions</p>
                            <div className="space-y-1">
                                {pass.competitions.map((c: { name: string; category?: string }, i: number) => (
                                    <p key={i} className="text-zinc-300 text-sm">
                                        • {c.name}{c.category ? ` (${c.category})` : ""}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 text-sm text-zinc-400 pt-2">
                        <p>Booked: {new Date(pass.createdAt).toDateString()}</p>
                    </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                    <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                        <p className="text-center text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Admin Controls</p>
                        {isValid && <AccommodationVerifyButton token={pass.passToken ?? ""} />}
                    </div>
                )}

                {!isAdmin && (
                    <div className="p-6 text-center border-t border-zinc-800 bg-zinc-950/50">
                        {session?.user ? (
                            <p className="text-zinc-500 text-sm">Logged in as {session.user.name} (User)</p>
                        ) : (
                            <Link href="/login" className="text-red-500 text-sm hover:underline">
                                Admin Login required to Check In
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
