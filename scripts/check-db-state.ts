import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Diagnostic Start ---');

    try {
        // Check Categories
        const categories = await prisma.category.findMany();
        console.log(`Categories found: ${categories.length}`);
        categories.forEach(c => console.log(` - ${c.name} (${c.id})`));

        // Check Judges
        // Note: We need to cast to any if the types aren't updated in the running context, 
        // but tsx should compile with latest schema.
        const judges = await prisma.user.findMany({
            where: {
                role: 'JUDGE'
            }
        });
        console.log(`Judges found: ${judges.length}`);

        // Check arbitrary judge if exists
        if (judges.length > 0) {
            console.log('Sample judge:', judges[0].email, judges[0].assignedCategoryId);
        } else {
            console.log('No judges found.');
        }

    } catch (e) {
        console.error('Error during diagnosis:', e);
    } finally {
        await prisma.$disconnect();
        console.log('--- Diagnostic End ---');
    }
}

main();
