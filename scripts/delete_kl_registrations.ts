
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteFreeKLRegistrations() {
  console.log('Starting cleanup of free KL registrations...');

  try {
    // 1. Find Individual Registrations to delete
    // Criteria: User email ends with @kluniversity.in AND paymentScreenshot is null (or empty)
    // Note: We need to join with User table to check email.
    
    // Prisma doesn't support direct deleteMany with relation filtering in a simple way for all DBs,
    // but we can find IDs first.
    
    const individualRegs = await prisma.individualRegistration.findMany({
      where: {
        user: {
          email: {
            endsWith: '@kluniversity.in',
            mode: 'insensitive',
          },
        },
        paymentScreenshot: null, // As per plan, "free" ones have no screenshot
      },
      select: { id: true },
    });

    const individualIds = individualRegs.map(r => r.id);
    console.log(`Found ${individualIds.length} individual registrations to delete.`);

    if (individualIds.length > 0) {
      const deletedIndividual = await prisma.individualRegistration.deleteMany({
        where: {
          id: { in: individualIds },
        },
      });
      console.log(`Deleted ${deletedIndividual.count} individual registrations.`);
    }

    // 2. Find Group Registrations to delete
    const groupRegs = await prisma.groupRegistration.findMany({
      where: {
        user: {
          email: {
            endsWith: '@kluniversity.in',
            mode: 'insensitive',
          },
        },
        paymentScreenshot: null,
      },
      select: { id: true },
    });

    const groupIds = groupRegs.map(r => r.id);
    console.log(`Found ${groupIds.length} group registrations to delete.`);

    if (groupIds.length > 0) {
      const deletedGroup = await prisma.groupRegistration.deleteMany({
        where: {
          id: { in: groupIds },
        },
      });
      console.log(`Deleted ${deletedGroup.count} group registrations.`);
    }

    console.log('Cleanup completed successfully.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteFreeKLRegistrations();
