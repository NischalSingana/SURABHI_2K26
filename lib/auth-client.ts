import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"

const authClient = createAuthClient({
    baseURL: process.env.NODE_ENV === 'production' 
        ? "https://klusurabhi.in"
        : "http://localhost:3000",
    plugins: [inferAdditionalFields<typeof auth>()]
})

export const { signUp, signOut, signIn, useSession } = authClient      