"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthCallback() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (isPending) return;

      if (!session?.user) {
        // No session, redirect to login
        toast.error("Authentication failed. Please try again.");
        router.push("/login");
        return;
      }

      try {
        // Check if user has completed registration
        const response = await fetch("/api/check-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();

        if (data.isRegistered) {
          // User exists and is registered, go to home
          toast.success("Welcome back!");
          router.push("/");
        } else {
          // User authenticated but not registered, go to registration
          toast.info("Please complete your registration");
          router.push("/register");
        }
      } catch (error) {
        console.error("Error checking registration:", error);
        toast.error("Something went wrong. Please try again.");
        router.push("/");
      }
    };

    checkUserAndRedirect();
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">Verifying your account...</h1>
        <p className="text-zinc-400">Please wait while we check your information</p>
      </div>
    </div>
  );
}
