
import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Repairing Judges ---');

    const judges = await prisma.user.findMany({
        where: { role: 'JUDGE' },
        include: { accounts: true }
    });

    console.log(`Found ${judges.length} judges.`);

    for (const judge of judges) {
        if (judge.accounts.length === 0) {
            console.log(`Fixing judge: ${judge.email}`);
            // Create Account record
            await prisma.account.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: judge.id,
                    accountId: judge.email,
                    providerId: "credential", // Assuming this is matched by better-auth
                    password: judge.password, // Copy the hash
                    accessToken: crypto.randomUUID(),
                }
            });
            console.log(` - Account created.`);
        } else {
            console.log(`Judge ${judge.email} already has an account.`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
