
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCleanup() {
  console.log('Verifying cleanup...');

  // 1. Check for any remaining KL registrations
  const klIndividualCount = await prisma.individualRegistration.count({
    where: {
      user: {
        email: { endsWith: '@kluniversity.in', mode: 'insensitive' },
      },
    },
  });

  const klGroupCount = await prisma.groupRegistration.count({
    where: {
      user: {
        email: { endsWith: '@kluniversity.in', mode: 'insensitive' },
      },
    },
  });

  console.log(`Remaining KL Individual Registrations: ${klIndividualCount}`);
  console.log(`Remaining KL Group Registrations: ${klGroupCount}`);

  // 2. Check for registrations by 'Nischal' (case insensitive) just in case
  const nischalIndividual = await prisma.individualRegistration.findMany({
    where: {
      user: {
        name: { contains: 'Nischal', mode: 'insensitive' },
      },
    },
    include: { user: true },
  });

  const nischalGroup = await prisma.groupRegistration.findMany({
    where: {
      user: {
        name: { contains: 'Nischal', mode: 'insensitive' },
      },
    },
    include: { user: true },
  });

  console.log(`Registrations found for name 'Nischal' (any email domain):`);
  console.log(`Individual: ${nischalIndividual.length}`);
  nischalIndividual.forEach(r => console.log(` - ${r.user.email} (${r.paymentStatus})`));

  console.log(`Group: ${nischalGroup.length}`);
  nischalGroup.forEach(r => console.log(` - ${r.user.email} (${r.paymentStatus})`));

  // If found, offering to delete? (User said delete "KL registrations", implying email domain)
  // But if Nischal used a personal email for testing "as a KL user" (maybe manually setting college?), that might be it.
  // But strictly speaking, "KL user" usually means email domain check in this system.
}

verifyCleanup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
