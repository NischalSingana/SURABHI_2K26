import PassScanner from "@/components/PassScanner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ScannerPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const allowedRoles = ["ADMIN", "MASTER", "MANAGER"];
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-black p-6 pt-24">
            <div className="max-w-4xl mx-auto">
                <PassScanner />
            </div>
        </div>
    );
}
