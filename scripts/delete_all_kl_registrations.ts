
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllKLRegistrations() {
  console.log('Starting cleanup of ALL KL registrations...');

  try {
    const individualRegs = await prisma.individualRegistration.findMany({
      where: {
        user: {
          email: { endsWith: '@kluniversity.in', mode: 'insensitive' },
        },
      },
      select: { id: true },
    });

    const individualIds = individualRegs.map(r => r.id);
    console.log(`Found ${individualIds.length} REMAINING individual registrations to delete.`);

    if (individualIds.length > 0) {
      const deletedIndividual = await prisma.individualRegistration.deleteMany({
        where: { id: { in: individualIds } },
      });
      console.log(`Deleted ${deletedIndividual.count} individual registrations.`);
    }

    const groupRegs = await prisma.groupRegistration.findMany({
      where: {
        user: {
          email: { endsWith: '@kluniversity.in', mode: 'insensitive' },
        },
      },
      select: { id: true },
    });

    const groupIds = groupRegs.map(r => r.id);
    console.log(`Found ${groupIds.length} REMAINING group registrations to delete.`);

    if (groupIds.length > 0) {
      const deletedGroup = await prisma.groupRegistration.deleteMany({
        where: { id: { in: groupIds } },
      });
      console.log(`Deleted ${deletedGroup.count} group registrations.`);
    }

    console.log('Full cleanup of KL registrations completed.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllKLRegistrations();
