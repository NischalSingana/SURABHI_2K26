
import { PrismaClient } from "../lib/generated/prisma";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all events...");
    try {
        const events = await prisma.event.findMany({
            include: {
                Category: true,
            }
        });

        console.log(`Found ${events.length} events.`);

        events.forEach(e => {
            console.log(`Event: ${e.name} | Category: ${e.Category ? e.Category.name : 'NULL'}`);
        });

        // Test filtering logic
        const categories = await prisma.category.findMany();
        console.log("\nCategories found:", categories.map(c => c.name).join(", "));

        categories.forEach(c => {
            const matchCount = events.filter(e => e.Category && e.Category.name.toLowerCase() === c.name.toLowerCase()).length;
            console.log(`Category "${c.name}" has ${matchCount} events matching frontend filter.`);
        });

    } catch (e) {
        console.error("Error fetching events:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
