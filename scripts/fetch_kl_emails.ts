
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Fetch ALL users with @kluniversity.in email
    const allKlUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@kluniversity.in'
        }
      },
      select: {
        email: true,
        individualRegistrations: { select: { id: true } },
        groupRegistrations: { select: { id: true } }
      }
    });

    // 2. Filter for those with competition registrations
    const competitionUsers = allKlUsers.filter(u => 
      u.individualRegistrations.length > 0 || u.groupRegistrations.length > 0
    );

    const allEmails = allKlUsers.map(u => u.email).join('\n');
    const compEmails = competitionUsers.map(u => u.email).join('\n');

    fs.writeFileSync('kl_all_users.txt', allEmails);
    fs.writeFileSync('kl_competition_users.txt', compEmails);

    console.log(`Saved ${allKlUsers.length} emails to kl_all_users.txt`);
    console.log(`Saved ${competitionUsers.length} emails to kl_competition_users.txt`);

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
