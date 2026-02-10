/**
 * Enables virtual participation for all events and adds common virtual terms.
 * Event-specific virtual terms are derived from physical terms where relevant.
 * Run: node scripts/enable-virtual-and-add-terms.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const COMMON_VIRTUAL_TERMS = [
  "All virtual rounds will be conducted online through the official platform (Google Meet / Zoom / submission portal as announced).",
  "Participants must ensure stable internet connection, working microphone, and camera where required.",
  "Login details and schedule will be shared after successful registration.",
  "Participants must join on time. Late entry may not be allowed.",
  "Participants must keep camera ON during performance.",
  "Participants should share their screen if asked.",
];

function buildEventSpecificVirtualTerms(event) {
  const lines = [];
  const name = (event.name || "").toLowerCase();
  const terms = (event.termsandconditions || "").toLowerCase();
  const catName = (event.Category?.name || "").toLowerCase();

  if (name.includes("dance") || catName.includes("nrithya") || terms.includes("dance")) {
    lines.push("Perform your dance in full view of the camera. Ensure adequate space and lighting.");
  }
  if (name.includes("music") || name.includes("raaga") || catName.includes("raaga") || terms.includes("sing") || terms.includes("instrument")) {
    lines.push("Ensure clear audio for vocal/instrumental performance. Microphone must be functional.");
  }
  if (name.includes("drama") || name.includes("skit") || name.includes("mono") || catName.includes("natyaka")) {
    lines.push("Perform in frame. Ensure backdrop and lighting allow judges to see the full performance.");
  }
  if (name.includes("film") || name.includes("short film") || name.includes("cine")) {
    lines.push("Submit your film as per submission guidelines. Virtual screening may be conducted.");
  }
  if (name.includes("photography") || name.includes("art") || name.includes("chitrakala") || name.includes("vastranaut")) {
    lines.push("Submit your work through the submission portal. Ensure files are accessible.");
  }
  if (name.includes("elocution") || name.includes("writing") || name.includes("sahitya")) {
    lines.push("For live rounds: speak clearly with microphone. For written submissions: use the portal.");
  }
  if (name.includes("mock parliament") || name.includes("parliamentary")) {
    lines.push("Participate in the virtual session. Follow parliamentary procedure. Stay muted when not speaking.");
  }
  if (name.includes("gaming") || name.includes("bgmi") || name.includes("valorant") || name.includes("esports")) {
    lines.push("Join the game lobby/link shared. Ensure stable connection. Screen share if required for verification.");
  }

  lines.push("All physical participation rules and event-specific guidelines apply to virtual participants unless stated otherwise.");
  return lines;
}

function formatAsPoints(arr) {
  return arr.map((s) => (s.startsWith("-") ? s : `- ${s}`)).join("\n");
}

async function main() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      termsandconditions: true,
      virtualEnabled: true,
      virtualTermsAndConditions: true,
      Category: { select: { name: true } },
    },
  });

  console.log(`Found ${events.length} events.\n`);

  for (const ev of events) {
    const eventSpecific = buildEventSpecificVirtualTerms(ev);
    const allVirtualTerms = [...COMMON_VIRTUAL_TERMS, ...eventSpecific];
    const virtualTermsText = formatAsPoints(allVirtualTerms);

    await prisma.event.update({
      where: { id: ev.id },
      data: {
        virtualEnabled: true,
        virtualTermsAndConditions: virtualTermsText,
      },
    });

    console.log(`Updated: ${ev.name} (virtual enabled, terms added)`);
  }

  console.log(`\nDone. Enabled virtual and added terms for ${events.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
