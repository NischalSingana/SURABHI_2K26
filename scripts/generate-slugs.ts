import { PrismaClient } from "../lib/generated/prisma";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\-]+/g, "") // Remove all non-word chars
        .replace(/\-\-+/g, "-") // Replace multiple - with single -
        .replace(/^-+/, "") // Trim - from start of text
        .replace(/-+$/, ""); // Trim - from end of text
}

async function main() {
    console.log("Starting slug generation...");

    // Update Categories
    const categories = await prisma.category.findMany();
    for (const category of categories) {
        if (!category.slug || category.slug.length < 5) { // Assuming cuid is not a valid slug if we want semantic ones, but schema default is cuid. Let's overwrite semantic ones.
            // Wait, schema default is cuid(). Existing records might have cuid or null (if schema update wasn't default).
            // Since we just added it, it has CUIDs. We want semantic slugs.

            let baseSlug = slugify(category.name);
            let slug = baseSlug;
            let counter = 1;

            // Ensure uniqueness
            while (await prisma.category.findFirst({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            await prisma.category.update({
                where: { id: category.id },
                data: { slug },
            });
            console.log(`Updated Category: ${category.name} -> ${slug}`);
        }
    }

    // Update Events
    const events = await prisma.event.findMany();
    for (const event of events) {
        if (!event.slug || event.slug.length < 5 || event.slug.includes("cuid")) { // Check for default CUIDs roughly
            let baseSlug = slugify(event.name);
            let slug = baseSlug;
            let counter = 1;

            // Ensure uniqueness
            while (await prisma.event.findFirst({ where: { slug } })) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            await prisma.event.update({
                where: { id: event.id },
                data: { slug },
            });
            console.log(`Updated Event: ${event.name} -> ${slug}`);
        }
    }

    console.log("Slug generation complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
