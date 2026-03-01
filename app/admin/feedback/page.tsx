import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import FeedbackAdminClient from "./client";

export default async function AdminFeedbackPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER)) {
    redirect("/login");
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Feedback Management</h1>
      <p className="text-gray-400 text-sm mb-6">
        Release feedback submission for competitions. View and download feedback competition-wise.
      </p>
      <FeedbackAdminClient />
    </div>
  );
}
