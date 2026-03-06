// Run: npx tsx scripts/daywise-count.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// KL identifier — adjust if needed
const isKL = (collage?: string | null) => {
    if (!collage) return false;
    const c = collage.toLowerCase();
    return c.includes("kl") || c.includes("k l ") || c.includes("koneru") || c.includes("k l university") || c.includes("klu");
};

async function main() {
    // Fetch all events in March 2026 with their registrations
    const events = await prisma.event.findMany({
        where: {
            date: {
                gte: new Date("2026-03-02T00:00:00.000Z"),
                lte: new Date("2026-03-05T23:59:59.999Z"),
            },
        },
        select: {
            id: true,
            name: true,
            date: true,
            Category: { select: { name: true } },
            individualRegistrations: {
                select: { user: { select: { id: true, collage: true, email: true } } }
            },
            groupRegistrations: {
                select: { user: { select: { id: true, collage: true, email: true } } }
            },
        },
        orderBy: { date: "asc" },
    });

    // Group by date
    const dayMap = new Map<string, typeof events>();
    for (const ev of events) {
        // Use IST date (UTC+5:30)
        const d = new Date(ev.date);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const ist = new Date(d.getTime() + istOffset);
        const key = `${ist.getFullYear()}-${String(ist.getMonth()+1).padStart(2,'0')}-${String(ist.getDate()).padStart(2,'0')}`;
        const list = dayMap.get(key) ?? [];
        list.push(ev);
        dayMap.set(key, list);
    }

    console.log("\n=== Day-wise Unique Participant Count (KL vs Non-KL) ===\n");

    for (const [dayKey, dayEvents] of [...dayMap.entries()].sort()) {
        const dateLabel = new Date(dayKey + "T00:00:00").toDateString();
        const categories = [...new Set(dayEvents.map(e => e.Category?.name).filter(Boolean))].join(", ");
        console.log(`\n📅 ${dateLabel} | Categories: ${categories}`);
        console.log("─".repeat(80));

        // Collect all unique users for this day
        const klUsers = new Set<string>();
        const nonKLUsers = new Set<string>();

        for (const ev of dayEvents) {
            // Individual registrations
            for (const reg of ev.individualRegistrations) {
                const u = reg.user;
                if (isKL(u.collage)) klUsers.add(u.id);
                else nonKLUsers.add(u.id);
            }
            // Group registrations (team leaders)
            for (const reg of ev.groupRegistrations) {
                const u = reg.user;
                if (isKL(u.collage)) klUsers.add(u.id);
                else nonKLUsers.add(u.id);
            }
        }

        console.log(`  KL students     : ${klUsers.size}`);
        console.log(`  Non-KL students : ${nonKLUsers.size}`);
        console.log(`  TOTAL UNIQUE    : ${new Set([...klUsers, ...nonKLUsers]).size}`);

        // Event breakdown
        console.log(`\n  Event breakdown:`);
        for (const ev of dayEvents) {
            const eKL = new Set<string>();
            const eNonKL = new Set<string>();
            for (const reg of ev.individualRegistrations) {
                if (isKL(reg.user.collage)) eKL.add(reg.user.id);
                else eNonKL.add(reg.user.id);
            }
            for (const reg of ev.groupRegistrations) {
                if (isKL(reg.user.collage)) eKL.add(reg.user.id);
                else eNonKL.add(reg.user.id);
            }
            const total = eKL.size + eNonKL.size;
            if (total > 0) {
                console.log(`    • ${ev.name.padEnd(40)} KL: ${String(eKL.size).padStart(3)}  Non-KL: ${String(eNonKL.size).padStart(3)}  Total: ${total}`);
            }
        }
    }

    console.log("\n");
}

main().catch(console.error).finally(() => prisma.$disconnect());
