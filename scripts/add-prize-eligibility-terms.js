/**
 * One-time script: Appends prize eligibility terms to all event termsandconditions.
 * Run: node scripts/add-prize-eligibility-terms.js
 */

const { PrismaClient } = require("@prisma/client");

const PRIZE_ELIGIBILITY_TERMS = `- Prize Eligibility: All three prizes will be awarded only if the number of participants or teams exceeds 10.
- Organizer's Discretion: If there are fewer than 10 participants or teams, the Organizing Committee reserves the right to decide the number of prizes to be distributed.`;

const prisma = new PrismaClient();

const MARKER = "Prize Eligibility: All three prizes will be awarded";

async function main() {
  const events = await prisma.event.findMany({
    select: { id: true, name: true, termsandconditions: true },
  });

  let updated = 0;
  for (const ev of events) {
    if (ev.termsandconditions && ev.termsandconditions.includes(MARKER)) {
      console.log(`Skip (already has terms): ${ev.name}`);
      continue;
    }
    const newTerms = ev.termsandconditions
      ? `${ev.termsandconditions.trim()}\n\n${PRIZE_ELIGIBILITY_TERMS}`
      : PRIZE_ELIGIBILITY_TERMS;
    await prisma.event.update({
      where: { id: ev.id },
      data: { termsandconditions: newTerms },
    });
    console.log(`Updated: ${ev.name}`);
    updated++;
  }
  console.log(`\nDone. Updated ${updated} of ${events.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
