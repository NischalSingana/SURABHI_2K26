import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js"

import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

import { Role } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";
const baseURL = isProduction
    ? (process.env.BETTER_AUTH_URL || "https://klusurabhi.in")
    : "http://localhost:3000";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",

    }),
    account: {
        accountLinking: {
            enabled: true, // Allow users to link Google and Microsoft accounts
            requireEmailVerification: false, // Allow linking even if email not verified
            trustedEmails: true, // Trust emails from OAuth providers (Google, Microsoft)
        }
    },
    trustedOrigins: [
        "https://klusurabhi.in",
        "http://localhost:3000"
    ],
    baseURL,
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            redirectURI: isProduction
                ? "https://klusurabhi.in/api/auth/callback/google"
                : "http://localhost:3000/api/auth/callback/google",
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID as string,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
            tenant: "organizations", // For single-tenant app - work/school accounts only
            redirectURI: isProduction
                ? "https://klusurabhi.in/api/auth/callback/microsoft"
                : "http://localhost:3000/api/auth/callback/microsoft",
            authorizationParams: {
                prompt: "select_account", // Force account selection every time
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        password: {
            hash: async (p) => {
                const { hash } = await import("bcryptjs");
                return hash(p, 10);
            },
            verify: async ({ hash, password }) => {
                const { compare } = await import("bcryptjs");
                return compare(password, hash);
            }
        }
    },
    session: {
        cookieCache: {
            enabled: true, // Enable to fix OAuth state mismatch
            maxAge: 5 * 60, // 5 minutes for OAuth flow
        },
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieOptions: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        }
    },
    user: {
        additionalFields: {
            role: {
                type: ["USER", "ADMIN", "JUDGE", "MANAGER", "MASTER"] as Array<Role>,
                input: false
            },
            assignedEventId: {
                type: "string",
                input: false
            },
            phone: {
                type: "string",
                input: false
            },
            collage: {
                type: "string",
                input: false
            },
            collageId: {
                type: "string",
                input: false
            },
            branch: {
                type: "string",
                input: false
            },
            year: {
                type: "number",
                input: false
            },
            isApproved: {
                type: "boolean",
                input: false
            },
            paymentStatus: {
                type: "string",
                input: false
            },
            isInternational: {
                type: "boolean",
                input: false
            },
            country: {
                type: "string",
                input: false
            }
        }
    },
    plugins: [nextCookies()]


});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN"
