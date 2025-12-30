"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FiAlertCircle } from "react-icons/fi";

function AuthErrorPageContent() {
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    setErrorMessage(getErrorMessage(error));
  }, [searchParams]);

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "invalid_code":
        return "The authorization code is invalid or has expired. Please try signing in again.";
      case "access_denied":
        return "Access was denied. You may have cancelled the sign-in process.";
      case "server_error":
        return "A server error occurred. Please try again later.";
      case "temporarily_unavailable":
        return "The service is temporarily unavailable. Please try again in a few moments.";
      default:
        return "An unexpected error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
            <FiAlertCircle className="text-red-400" size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Authentication Failed
        </h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">{errorMessage}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/login")}
            className="block w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="block w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all font-medium"
          >
            Go to Home
          </button>
        </div>

        <div className="mt-8 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
          <p className="text-zinc-400 text-xs mb-2">
            <strong className="text-white">Common solutions:</strong>
          </p>
          <ul className="text-zinc-400 text-xs text-left space-y-1">
            <li>• Make sure you're using a valid email address</li>
            <li>• Check your internet connection</li>
            <li>• Try clearing your browser cache</li>
            <li>• Use a different browser if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-linear-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <AuthErrorPageContent />
    </Suspense>
  );
}
