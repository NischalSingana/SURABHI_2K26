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
            tenant: "organizations", // For single-tenant app - work/school accounts only
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
                console.log("Auth Verify | Password:", !!password, "Hash Len:", hash?.length);
                console.log("Auth Verify | Hash Start:", hash?.substring(0, 10));
                const valid = await compare(password, hash);
                console.log("Auth Verify | Valid:", valid);
                return valid;
            }
        }
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
                type: ["USER", "ADMIN", "JUDGE"] as Array<Role>,
                input: false
            },
            assignedCategoryId: {
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
