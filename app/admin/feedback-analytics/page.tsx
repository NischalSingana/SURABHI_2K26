import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import FeedbackAnalyticsClient from "./client";

export default async function FeedbackAnalyticsPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  const role = session?.user?.role;
  if (!session?.user || (role !== Role.ADMIN && role !== Role.MASTER && role !== Role.RNC)) {
    redirect("/login");
  }

  // Fetch all anonymous feedback
  const feedbacks = await prisma.anonymousFeedback.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto min-h-screen bg-black">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Anonymous Feedback Analytics</h1>
        <p className="text-gray-400 text-sm">
          Overview of all anonymous feedback submitted. View statistics and download reports.
        </p>
      </div>
      
      <FeedbackAnalyticsClient initialFeedbacks={feedbacks} />
    </div>
  );
}
