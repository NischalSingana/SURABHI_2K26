import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getThankYouEmailStats } from "@/actions/admin/thankyou-emails.action";
import ThankYouEmailsClient from "./client";

export default async function ThankYouEmailsPage() {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    const role = session?.user?.role;
    if (!session?.user || (role !== "ADMIN" && role !== "MASTER")) {
        redirect("/login");
    }

    const { data: stats } = await getThankYouEmailStats();

    return (
        <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Send Thank You Emails
                </h1>
                <p className="text-gray-400">
                    Send post-event appreciation emails and request anonymous feedback from all approved participants.
                </p>
            </div>

            <ThankYouEmailsClient
                stats={{ totalEligible: stats?.totalEligible ?? 0 }}
            />
        </div>
    );
}
