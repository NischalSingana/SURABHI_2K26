
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteKLVisitorPasses() {
  console.log('Checking for KL Visitor Passes...');

  try {
    const visitorPasses = await prisma.visitorPassRegistration.findMany({
      where: {
        user: {
          email: { endsWith: '@kluniversity.in', mode: 'insensitive' },
        },
      },
      select: { id: true },
    });

    const passIds = visitorPasses.map(r => r.id);
    console.log(`Found ${passIds.length} KL visitor passes to delete.`);

    if (passIds.length > 0) {
      const deleted = await prisma.visitorPassRegistration.deleteMany({
        where: { id: { in: passIds } },
      });
      console.log(`Deleted ${deleted.count} visitor passes.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteKLVisitorPasses();
