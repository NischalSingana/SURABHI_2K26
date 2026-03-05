// Run from project root: npx tsx scripts/fix-judge-passwords.ts
import { PrismaClient } from "@prisma/client";
import { hash, compare } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const judges = await prisma.user.findMany({
        where: { role: "JUDGE" },
        include: { accounts: true }
    });

    console.log(`\nFound ${judges.length} judge account(s)`);

    for (const j of judges) {
        const acc = j.accounts.find(a => a.providerId === "email");
        console.log(`\n=== Judge: ${j.email}`);
        console.log(`  user.password   : ${j.password ? "✅ exists" : "❌ missing"}`);
        console.log(`  account record  : ${acc ? "✅ exists" : "❌ missing"}`);
        console.log(`  account.password: ${acc?.password ? "✅ exists" : "❌ missing"}`);
        console.log(`  judgePassword   : ${j.judgePassword ? `"${j.judgePassword}"` : "null (not stored)"}`);

        if (j.judgePassword && acc?.password) {
            const ok = await compare(j.judgePassword, acc.password);
            console.log(`  bcrypt verify   : ${ok ? "✅ match" : "❌ MISMATCH"}`);
        }

        if (j.judgePassword) {
            const newHash = await hash(j.judgePassword, 10);
            await prisma.user.update({
                where: { id: j.id },
                data: { password: newHash }
            });
            if (acc) {
                await prisma.account.update({
                    where: { id: acc.id },
                    data: { password: newHash }
                });
                console.log("  ✅ Re-synced account.password");
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
                console.log("  ✅ Created missing email account record");
            }
        } else {
            console.log("  ⚠️  No judgePassword stored — reset via admin panel then re-run this script");
        }
    }

    console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
