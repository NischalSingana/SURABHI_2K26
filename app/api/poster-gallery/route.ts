import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // 1 hour

export async function GET() {
    try {
        const items: { image: string; text: string }[] = [];
        const seenNames = new Set<string>();

        // 1. Fetch categories from database — R2-hosted images uploaded via admin
        try {
            const categories = await prisma.category.findMany({
                where: { image: { not: null } },
                select: { name: true, image: true },
                orderBy: { name: 'asc' },
            });

            for (const cat of categories) {
                if (cat.image) {
                    const proxied = `/_next/image?url=${encodeURIComponent(cat.image)}&w=1080&q=75`;
                    items.push({ image: proxied, text: cat.name });
                    seenNames.add(cat.name.toLowerCase().replace(/[-_]/g, ' ').trim());
                }
            }
        } catch (dbError) {
            console.error('Error fetching categories from DB for poster gallery:', dbError);
        }

        // 2. Fallback: read static files from public/poster-gallery (skip duplicates)
        const galleryDir = path.join(process.cwd(), 'public', 'poster-gallery');

        if (fs.existsSync(galleryDir)) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            const files = fs.readdirSync(galleryDir);

            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (!imageExtensions.includes(ext)) continue;

                const nameWithoutExt = path.parse(file).name
                    .replace(/[-_]/g, ' ')
                    .trim();

                if (seenNames.has(nameWithoutExt.toLowerCase())) continue;

                const rawUrl = `/poster-gallery/${file}`;
                const optimizedUrl = `/_next/image?url=${encodeURIComponent(rawUrl)}&w=1080&q=75`;

                items.push({
                    image: optimizedUrl,
                    text: nameWithoutExt || 'Poster',
                });
            }
        }

        items.sort((a, b) => a.text.localeCompare(b.text));

        return NextResponse.json(
            { items },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
                },
            }
        );
    } catch (error) {
        console.error('Error serving poster gallery:', error);
        return NextResponse.json(
            { error: 'Failed to fetch poster gallery', items: [], details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
