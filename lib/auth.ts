import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js"

import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

import { Role } from "./generated/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",

    }),
    trustedOrigins: [
        "https://klsurabhi.nischalsingana.com",
        "http://localhost:3000"
    ],
    baseURL: process.env.BETTER_AUTH_URL || "https://klsurabhi.nischalsingana.com",
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID as string,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
            authority: "https://login.microsoftonline.com",
        },
    },
    emailAndPassword: {
        enabled: true,


    },
    session: {
        cookieCache: {
            enabled: false, // Disabled to prevent session size limit errors
            maxAge: 10 * 60,
        }
    },
    user: {
        additionalFields: {
            role: {
                type: ["USER", "ADMIN"] as Array<Role>,
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
            transactionId: {
                type: "string",
                input: false
            },
            paymentProof: {
                type: "string",
                input: false
            }
        }
    },
    plugins: [nextCookies()]


});

export type ErrorCode = keyof typeof auth.$ERROR_CODES | "UNKNOWN"
