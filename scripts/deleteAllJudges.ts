
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllJudges() {
    try {
        console.log('Deleting all users with role JUDGE...');
        const { count } = await prisma.user.deleteMany({
            where: {
                role: 'JUDGE',
            },
        });
        console.log(`Deleted ${count} judge accounts.`);
    } catch (error) {
        console.error('Error deleting judges:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllJudges();
