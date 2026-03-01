"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronRight, FiMail, FiLock } from "react-icons/fi";
import SignInOAuthButton from "./signInOAuthButton";
import { useSession, signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type College = "KL_UNIVERSITY" | "OTHER" | "INTERNATIONAL" | "SPOT_EMAIL" | "";

function SpotEmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      toast.error("Enter email and password");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await signIn.email({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (error) {
        toast.error(error.message || "Invalid credentials");
        setLoading(false);
        return;
      }
      toast.success("Signed in successfully!");
      router.push("/profile/competitions");
    } catch (err) {
      console.error("Spot email login error:", err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Email</label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Password</label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-gray-300"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-xs text-zinc-500 text-center">
        For participants registered on-site. Use the email and password set during spot registration.
      </p>
    </div>
  );
}

const LoginFlow = () => {
  const [step, setStep] = useState(1);
  const [selectedCollege, setSelectedCollege] = useState<College>("");
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Check if user is already logged in and registered
  useEffect(() => {
    const checkSession = async () => {
      if (isPending) return;

      if (session?.user) {
        try {
          // Check if user is already registered
          const response = await fetch("/api/check-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.isRegistered) {
              // User is already logged in and registered, redirect to home
              toast.success("You're already logged in!");
              router.push("/");
            }
            // If not registered, let them stay on login page to complete registration
          }
        } catch (error) {
          console.error("Error checking registration:", error);
          // On error, allow user to continue with login flow
        }
      }
    };

    checkSession();
  }, [session, isPending, router]);

  const handleCollegeSelect = (college: College) => {
    setSelectedCollege(college);
    setStep(2);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="w-full max-w-md flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-zinc-400">
                Select your institution to sign in
              </p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCollegeSelect("KL_UNIVERSITY")}
                className="w-full p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-red-600 hover:bg-red-600/10 transition-all text-left"
              >
                <span className="flex items-center justify-between w-full">
                  <span>
                    <span className="text-lg font-semibold text-white block">
                      KL University
                    </span>
                    <span className="text-sm text-zinc-400 hover:text-red-400 mt-1 block">
                      Sign in with Microsoft
                    </span>
                  </span>
                  <FiChevronRight className="text-zinc-400 text-xl" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCollegeSelect("OTHER")}
                className="w-full p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-red-600 hover:bg-red-600/10 transition-all text-left"
              >
                <span className="flex items-center justify-between w-full">
                  <span>
                    <span className="text-lg font-semibold text-white block">
                      Other College
                    </span>
                    <span className="text-sm text-zinc-400 mt-1 block">
                      Sign in with Google
                    </span>
                  </span>
                  <FiChevronRight className="text-zinc-400 text-xl" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCollegeSelect("INTERNATIONAL")}
                className="w-full p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-red-600 hover:bg-red-600/10 transition-all text-left"
              >
                <span className="flex items-center justify-between w-full">
                  <span>
                    <span className="text-lg font-semibold text-white block">
                      International Student
                    </span>
                    <span className="text-sm text-zinc-400 mt-1 block">
                      Free registration · Google sign-in · Virtual participation
                    </span>
                  </span>
                  <FiChevronRight className="text-zinc-400 text-xl" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCollegeSelect("SPOT_EMAIL")}
                className="w-full p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:border-red-600 hover:bg-red-600/10 transition-all text-left"
              >
                <span className="flex items-center justify-between w-full">
                  <span>
                    <span className="text-lg font-semibold text-white block">
                      Spot-registered participant
                    </span>
                    <span className="text-sm text-zinc-400 mt-1 block">
                      Sign in with email &amp; password
                    </span>
                  </span>
                  <FiChevronRight className="text-zinc-400 text-xl" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Sign In</h1>
              <p className="text-zinc-400">
                {selectedCollege === "KL_UNIVERSITY"
                  ? "KL University - Sign in with Microsoft"
                  : selectedCollege === "INTERNATIONAL"
                  ? "International Student - Sign in with Google"
                  : selectedCollege === "SPOT_EMAIL"
                  ? "Spot-registered - Sign in with email & password"
                  : "Other College - Sign in with Google"}
              </p>
            </div>

            {selectedCollege === "SPOT_EMAIL" && (
              <>
                <SpotEmailLoginForm />
                <p className="mt-4 text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </p>
              </>
            )}

            {selectedCollege === "KL_UNIVERSITY" && (
              <div className="space-y-6">
                <div className="rounded-lg p-4">
                  <p className="text-red-500 text-center text-sm font-medium">
                    Important: KL University students must sign in with their
                    official college email ID (@kluniversity.in)
                  </p>
                </div>
                <SignInOAuthButton provider="microsoft" collegeType="KL_UNIVERSITY" />
              </div>
            )}

            {selectedCollege === "OTHER" && (
              <div className="space-y-6">
                <SignInOAuthButton provider="google" collegeType="OTHER" />
              </div>
            )}

            {selectedCollege === "INTERNATIONAL" && (
              <div className="space-y-6">
                <SignInOAuthButton provider="google" collegeType="INTERNATIONAL" />
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full mt-6 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all font-medium"
            >
              ← Back to College Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginFlow;
