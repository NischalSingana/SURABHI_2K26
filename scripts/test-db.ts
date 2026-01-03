
import { PrismaClient } from "../lib/generated/prisma";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log("Testing DB Connection...");
    try {
        const count = await prisma.user.count();
        console.log(`Successfully connected! User count: ${count}`);
    } catch (e) {
        console.error("DB Connection Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
