import ReturnButton from "@/components/ui/ReturnButton";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/generated/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import ProfileClient from "./ProfileClient";
import { getMyRegisteredEvents } from "@/actions/profile.action";

import { prisma } from "@/lib/prisma";

async function SessionData() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-zinc-400 mb-8">Please log in to view your profile</p>
          <Link
            href="/login"
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Fetch fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: true,
    },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  const hasGoogleAccount = user.accounts.some(
    (account) => account.providerId === "google"
  );

  const hasMicrosoftAccount = user.accounts.some(
    (account) => account.providerId === "microsoft"
  );

  // Auto-approve Microsoft users if not already approved
  if (hasMicrosoftAccount && !user.isApproved) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isApproved: true },
    });
    // Update local user object for UI
    user.isApproved = true;
  }

  // Fetch registered events
  const eventsResult = await getMyRegisteredEvents();
  const registeredEvents = eventsResult.success ? eventsResult.data || [] : [];

  // Get IP and User Agent
  const ipAddress = (session as any).session?.ipAddress || headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown";
  const userAgent = (session as any).session?.userAgent || headersList.get("user-agent") || "Unknown";


  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-6 mt-16">
        <div className="max-w-6xl mx-auto">
          <ReturnButton href="/" label="Home" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-6 pb-8">
        <ProfileClient
          user={user as any}
          registeredEvents={registeredEvents as any}
          ipAddress={ipAddress}
          userAgent={userAgent}
          hasGoogleAccount={hasGoogleAccount}
        />

        {session.user.role === Role.ADMIN && (
          <div className="max-w-6xl mx-auto mt-6">
            <Link
              href="/admin/dashboard"
              className="inline-block px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-medium hover:bg-amber-500/20 transition-all"
            >
              Admin Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

async function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="text-white w-full h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      }
    >
      <SessionData />
    </Suspense>
  );
};

export default ProfilePage;