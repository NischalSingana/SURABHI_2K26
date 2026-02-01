"use client"

import { signIn } from "@/lib/auth-client"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface signInOAuthButtonProps {
  provider: "google" | "microsoft"
  signup?: boolean
  collegeType?: "KL_UNIVERSITY" | "OTHER" | "INTERNATIONAL"
}
const signInOAuthButton = ({ provider, signup, collegeType }: signInOAuthButtonProps) => {
  const [isPending, setIsPending] = useState(false)
  const action = signup ? "Up" : "In"
  const providerName = provider === "google" ? "Google" : "Microsoft"
  const router = useRouter()

  async function handleClick() {
    setIsPending(true)

    // Store college type before OAuth redirect
    if (collegeType) {
      localStorage.setItem("selectedCollege", collegeType);
      const collegeName = collegeType === "KL_UNIVERSITY" ? "KL University" : collegeType === "INTERNATIONAL" ? "International Student" : "Other College";
      localStorage.setItem("selectedCollegeName", collegeName);
    }

    try {
      const result = await signIn.social({
        provider,
        callbackURL: "/auth/callback", // Always use auth callback for proper redirect handling
        errorCallbackURL: signup ? "/register" : "/auth/login/error",
        fetchOptions: {
          onRequest: () => {
            setIsPending(true)
          },
          onResponse: () => {
            setIsPending(false)
          },
          onError: (ctx) => {
            setIsPending(false)
            toast.error(ctx.error.message)
          }
        }
      })
    } catch (error) {
      setIsPending(false)
      toast.error("Failed to sign in. Please try again.")
    }
  }
  return (
    <button
      className="w-full px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-gray-300 shadow-sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {!isPending && (
        <>
          {provider === "google" ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="#f25022" />
              <path d="M11.4 24H0V12.6h11.4V24z" fill="#00a4ef" />
              <path d="M24 24H12.6V12.6H24V24z" fill="#7fba00" />
              <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#ffb900" />
            </svg>
          )}
        </>
      )}
      <span>{isPending ? "Signing in..." : `Sign${action} with ${providerName}`}</span>
    </button>
  )
}

export default signInOAuthButton