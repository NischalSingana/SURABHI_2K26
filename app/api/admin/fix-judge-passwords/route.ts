import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user || session.user.role !== "MASTER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const judges = await prisma.user.findMany({
            where: { role: "JUDGE" },
            include: { accounts: true }
        });

        const results = [];

        for (const j of judges) {
            const acc = j.accounts.find(a => a.providerId === "email");
            const result: Record<string, unknown> = {
                email: j.email,
                hasUserPassword: !!j.password,
                hasAccountRecord: !!acc,
                hasAccountPassword: !!acc?.password,
                hasStoredPlainPassword: !!j.judgePassword,
            };

            if (j.judgePassword) {
                const newHash = await hash(j.judgePassword, 10);

                if (acc) {
                    await prisma.account.update({
                        where: { id: acc.id },
                        data: { password: newHash }
                    });
                } else {
                    await prisma.account.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId: j.id,
                            accountId: j.email,
                            providerId: "email",
                            password: newHash,
                            accessToken: crypto.randomUUID(),
                        }
                    });
                }
                await prisma.user.update({
                    where: { id: j.id },
                    data: { password: newHash }
                });
                result.fixed = true;
            } else {
                result.fixed = false;
                result.note = "No judgePassword stored — cannot auto-fix. Set password manually via admin panel.";
            }

            results.push(result);
        }

        return NextResponse.json({ success: true, judges: results });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
