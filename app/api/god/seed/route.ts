import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

const GOD_USERS = [
    { username: "PRO-VC", email: "pro-vc@klusurabhi.in" },
    { username: "Director-SAC", email: "director-sac@klusurabhi.in" },
    { username: "CSE1-HOD", email: "cse1-hod@klusurabhi.in" },
    { username: "Dean-SA", email: "dean-sa@klusurabhi.in" },
] as const;

const PASSWORD = "klu-123";

async function upsertGodUser(username: string, email: string, hashedPassword: string) {
    const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
    });

    if (existingUser) {
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

        const account = existingUser.accounts.find(acc => acc.providerId === "credential");
        if (account) {
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    password: hashedPassword,
                    accountId: email,
                }
            });
        } else {
            await prisma.account.create({
                data: {
                    id: randomUUID(),
                    accountId: email,
                    providerId: "credential",
                    password: hashedPassword,
                    userId: existingUser.id,
                    accessToken: randomUUID(),
                }
            });
        }
        return { userId: existingUser.id, created: false };
    }

    const userId = randomUUID();
    await prisma.user.create({
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
                    accountId: email,
                    providerId: "credential",
                    password: hashedPassword,
                    accessToken: randomUUID(),
                }
            }
        }
    });
    return { userId, created: true };
}

export async function GET() {
    return POST();
}

export async function POST() {
    try {
        const hashedPassword = await hash(PASSWORD, 10);
        const results: { username: string; email: string; userId: string; created: boolean }[] = [];

        for (const { username, email } of GOD_USERS) {
            const { userId, created } = await upsertGodUser(username, email, hashedPassword);
            results.push({ username, email, userId, created });
        }

        return NextResponse.json({
            message: "God users seeded successfully",
            password: PASSWORD,
            users: results,
        });
    } catch (error: any) {
        console.error("Error seeding god users:", error);
        return NextResponse.json(
            { error: "Failed to seed god users", details: error.message },
            { status: 500 }
        );
    }
}
