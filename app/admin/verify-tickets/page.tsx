import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@/lib/generated/prisma";
import QRScanner from "@/components/admin/QRScanner";

export default async function TicketVerificationPage() {
    const headersList = await headers();
    const session = await auth.api.getSession({
        headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-black px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Ticket Verification
                    </h1>
                    <p className="text-zinc-400">
                        Scan QR codes to verify participant tickets and payment status
                    </p>
                </div>

                {/* QR Scanner */}
                <QRScanner />

                {/* Instructions */}
                <div className="mt-8 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">How to Use</h2>
                    <ol className="list-decimal list-inside space-y-2 text-zinc-300">
                        <li>Click "Start Scanning" to activate the camera</li>
                        <li>Point the camera at the QR code on the participant's ticket</li>
                        <li>The system will automatically verify the ticket</li>
                        <li>Check the payment status and participant details</li>
                        <li>Click "Scan Another Ticket" to verify more participants</li>
                    </ol>

                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">
                            <strong>Important:</strong> Only approved tickets will show as valid.
                            Participants with pending payments will be marked as invalid.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
