import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "@/lib/auth"
const authClient = createAuthClient({

    plugins: [inferAdditionalFields<typeof auth>()]
})

export const { signUp, signOut, signIn, useSession } = authClient      