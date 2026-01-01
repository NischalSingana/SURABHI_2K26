import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"
const authClient = createAuthClient({

    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://klsurabhi.nischalsingana.com",
    plugins: [inferAdditionalFields<typeof auth>()]
})

export const { signUp, signOut, signIn, useSession } = authClient      