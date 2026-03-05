// Run from project root: npx tsx scripts/fix-judge-passwords.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const judges = await prisma.user.findMany({
        where: { role: "JUDGE" },
        include: { accounts: true }
    });

    console.log(`\nFound ${judges.length} judge account(s)`);

    for (const j of judges) {
        // Find existing accounts
        const credentialAcc = j.accounts.find(a => a.providerId === "credential");
        const emailAcc = j.accounts.find(a => a.providerId === "email");

        console.log(`\n=== ${j.email}`);
        console.log(`  credential account: ${credentialAcc ? "✅" : "❌"}`);
        console.log(`  email account     : ${emailAcc ? "⚠️  wrong providerId" : "none"}`);
        console.log(`  judgePassword     : ${j.judgePassword ?? "null"}`);

        if (j.judgePassword) {
            const newHash = await hash(j.judgePassword, 10);

            if (credentialAcc) {
                // Already correct — just re-sync password
                await prisma.account.update({
                    where: { id: credentialAcc.id },
                    data: { password: newHash }
                });
                console.log("  ✅ Refreshed credential account password");
            } else if (emailAcc) {
                // Wrong providerId — fix it
                await prisma.account.update({
                    where: { id: emailAcc.id },
                    data: { providerId: "credential", password: newHash }
                });
                console.log("  ✅ Fixed providerId: email → credential");
            } else {
                // No account at all — create with correct providerId
                await prisma.account.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: j.id,
                        accountId: j.email,
                        providerId: "credential",
                        password: newHash,
                        accessToken: crypto.randomUUID(),
                    }
                });
                console.log("  ✅ Created missing credential account");
            }

            await prisma.user.update({
                where: { id: j.id },
                data: { password: newHash }
            });
        } else {
            console.log("  ⚠️  No judgePassword stored — set via admin panel");
        }
    }

    console.log("\nDone. All judges should now be able to log in.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
