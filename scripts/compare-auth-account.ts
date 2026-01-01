
import { auth } from '../lib/auth';
import { PrismaClient } from '../lib/generated/prisma';

// Mock headers request for auth
const mockHeaders = new Headers();
mockHeaders.set('host', 'localhost:3000');

const prisma = new PrismaClient();

async function main() {
    console.log("--- Auth Structure Comparison ---");

    const testEmail = `test.judge-${Date.now()}@example.com`;
    console.log(`Creating test user via Auth API: ${testEmail}`);

    try {
        // Create user using better-auth API (simulating real signup)
        // Note: We can't easily use auth.api.signUpEmail on server side without request context 
        // properly mocked. 
        // However, better-auth usually exposes internal helpers or we can just inspect existing users.

        // Let's inspect an existing PARTICIPANT user if one exists.
        const participant = await prisma.user.findFirst({
            where: { role: 'USER', emailVerified: true },
            include: { accounts: true }
        });

        if (participant) {
            console.log("Found Participant User:");
            console.log(JSON.stringify(participant, null, 2));
        } else {
            console.log("No valid participants found to compare.");
        }

        // Inspect the Judge User
        const judge = await prisma.user.findFirst({
            where: { role: 'JUDGE' },
            include: { accounts: true }
        });

        if (judge) {
            console.log("Found Judge User:");
            console.log(JSON.stringify(judge, null, 2));
        } else {
            console.log("No judges found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
