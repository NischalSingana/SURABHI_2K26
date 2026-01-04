import { getPassDetails } from "@/lib/pass";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";
import { FiCheckCircle, FiXCircle, FiUser, FiCalendar, FiClock, FiMapPin, FiAlertTriangle } from "react-icons/fi";
import VerifyButton from "./VerifyButton";
import Link from "next/link";

export default async function VerifyPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const pass = await getPassDetails(token);
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const isAdmin = session?.user?.role === "ADMIN";

    if (!pass) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <FiXCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Invalid Pass</h1>
                <p className="text-zinc-400 max-w-md">
                    This QR code does not correspond to any valid pass in our system.
                </p>
                <Link href="/" className="mt-8 px-6 py-3 bg-zinc-800 text-white rounded-lg">
                    Go Home
                </Link>
            </div>
        );
    }

    // Verification Logic helpers
    const isExpired = pass.expiresAt && pass.expiresAt < new Date();
    const isActive = pass.isActive;
    const isApproved = pass.user.isApproved && pass.user.paymentStatus === "APPROVED";

    const isValid = isActive && !isExpired && !pass.isUsed && isApproved;

    // Determine status display
    let statusColor = "bg-green-500";
    let statusIcon = <FiCheckCircle className="w-12 h-12 text-green-500" />;
    let statusTitle = "Valid Pass";
    let statusMessage = "This pass is valid and can be used.";

    if (!isActive) {
        statusColor = "bg-red-500";
        statusIcon = <FiXCircle className="w-12 h-12 text-red-500" />;
        statusTitle = "Inactive Pass";
        statusMessage = "This pass has been deactivated.";
    } else if (pass.isUsed) {
        statusColor = "bg-yellow-500";
        statusIcon = <FiAlertTriangle className="w-12 h-12 text-yellow-500" />;
        statusTitle = "Already Used";
        statusMessage = `Used on ${pass.usedAt ? new Date(pass.usedAt).toISOString().split('T')[0] : 'Unknown date'}`;
    } else if (isExpired) {
        statusColor = "bg-red-500";
        statusIcon = <FiClock className="w-12 h-12 text-red-500" />;
        statusTitle = "Expired Pass";
        statusMessage = `Expired on ${new Date(pass.expiresAt!).toISOString().split('T')[0]}`;
    } else if (!isApproved) {
        statusColor = "bg-red-500";
        statusIcon = <FiAlertTriangle className="w-12 h-12 text-red-500" />;
        statusTitle = "Not Approved";
        statusMessage = "User registration is not approved yet.";
    }

    return (
        <div className="min-h-screen bg-black p-4 pt-12 pb-12 flex items-center justify-center">
            <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                {/* Header / Status Banner */}
                <div className={`p-8 flex flex-col items-center text-center border-b border-zinc-800 bg-gradient-to-b from-zinc-800/50 to-transparent`}>
                    <div className={`w-24 h-24 ${statusColor}/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-${statusColor}/30`}>
                        {statusIcon}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{statusTitle}</h1>
                    <p className={`${isValid ? 'text-green-400' : 'text-red-400'} font-medium`}>
                        {statusMessage}
                    </p>
                    {pass.passType !== "GENERAL" && (
                        <span className="mt-3 px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wider rounded-full border border-zinc-700">
                            {pass.passType} PASS
                        </span>
                    )}
                </div>

                {/* User Details */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                            <FiUser className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{pass.user.name}</h2>
                            <p className="text-zinc-400 text-sm">{pass.user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">College</span>
                            <span className="text-zinc-300 text-sm font-medium text-right">{pass.user.collage || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">ID</span>
                            <span className="text-zinc-300 text-sm font-medium">{pass.user.collageId || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500 text-sm">Branch/Year</span>
                            <span className="text-zinc-300 text-sm font-medium">
                                {pass.user.branch || "N/A"} • {pass.user.year}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm text-zinc-400">
                        {/* Use simple date strings to avoid hydration mismatches */}
                        <p>Created: {new Date(pass.createdAt).toDateString()}</p>
                        {pass.expiresAt && (
                            <p>Expires: {new Date(pass.expiresAt).toDateString()}</p>
                        )}
                        <p className="font-mono text-xs text-zinc-400 break-all">{pass.passToken}</p>
                    </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && isValid && (
                    <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                        <p className="text-center text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Admin Controls</p>
                        <VerifyButton token={pass.passToken} />
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
