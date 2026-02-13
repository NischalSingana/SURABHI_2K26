import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET() {
    return POST();
}

export async function POST() {
    try {
        const username = "PRO-VC";
        const email = "pro-vc@klusurabhi.in";
        const password = "klu-123";

        // Check if god user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { accounts: true }
        });

        const hashedPassword = await hash(password, 10);

        if (existingUser) {
            // Update user password and role
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: "GOD",
                    name: username,
                    emailVerified: true,
                    isApproved: true
                }
            });

            // Update or create account record for email/password provider
            // Better Auth uses accountId as email for credential provider
            const account = existingUser.accounts.find(acc => acc.providerId === "credential");
            if (account) {
                await prisma.account.update({
                    where: { id: account.id },
                    data: {
                        password: hashedPassword,
                        accountId: email, // Better Auth expects accountId to be email
                    }
                });
            } else {
                await prisma.account.create({
                    data: {
                        id: randomUUID(),
                        accountId: email, // Better Auth expects accountId to be email
                        providerId: "credential",
                        password: hashedPassword,
                        userId: existingUser.id,
                        accessToken: randomUUID(),
                    }
                });
            }

            return NextResponse.json({ 
                message: "God user updated successfully",
                username,
                email,
                userId: existingUser.id
            });
        }

        // Create new god user
        const userId = randomUUID();
        const godUser = await prisma.user.create({
            data: {
                id: userId,
                email,
                password: hashedPassword,
                name: username,
                role: "GOD",
                emailVerified: true,
                isApproved: true,
                accounts: {
                    create: {
                        id: randomUUID(),
                        accountId: email, // Better Auth expects accountId to be email
                        providerId: "credential",
                        password: hashedPassword,
                        accessToken: randomUUID(),
                    }
                }
            }
        });

        return NextResponse.json({ 
            message: "God user created successfully",
            username,
            email,
            userId: godUser.id
        });
    } catch (error: any) {
        console.error("Error seeding god user:", error);
        return NextResponse.json(
            { error: "Failed to seed god user", details: error.message },
            { status: 500 }
        );
    }
}
