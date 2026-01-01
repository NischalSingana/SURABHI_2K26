
import { PrismaClient } from '../lib/generated/prisma';
import { compare, hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2]; // Pass email as arg
    if (!email) {
        console.log("Please provide an email argument.");
        // Find a judge to test with
        const judge = await prisma.user.findFirst({ where: { role: 'JUDGE' } });
        if (judge) {
            console.log(`Found judge: ${judge.email}. Testing this one.`);
            await testUser(judge.email);
        } else {
            console.log("No judges found in DB.");
        }
        return;
    }
    await testUser(email);
}

async function testUser(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log(`User not found: ${email}`);
        return;
    }
    console.log(`User found: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Stored Hash: ${user.password}`);

    if (!user.password) {
        console.log("No password set.");
        return;
    }

    const isMatch = await compare("password123", user.password);
    console.log(`'password123' match result: ${isMatch}`);

    // Debugging bcrypt hash generation
    const sampleHash = await hash("password123", 10);
    console.log(`Sample 'password123' hash: ${sampleHash}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
