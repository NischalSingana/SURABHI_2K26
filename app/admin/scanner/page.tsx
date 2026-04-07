import PassScanner from "@/components/PassScanner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ScannerPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user || session.user.role !== "ADMIN") {
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
