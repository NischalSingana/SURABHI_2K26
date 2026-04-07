import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Enable caching: 1 hour for CDN, 24 hours stale-while-revalidate
export const revalidate = 3600; // 1 hour

export async function GET() {
    try {
        const galleryDir = path.join(process.cwd(), 'public', 'poster-gallery');

        // Check if directory exists
        if (!fs.existsSync(galleryDir)) {
            try {
                fs.mkdirSync(galleryDir, { recursive: true });
            } catch (err) {
                console.error("Error creating directory:", err);
                return NextResponse.json({ items: [] });
            }
        }

        // Read files from directory
        const files = fs.readdirSync(galleryDir);

        if (files.length === 0) {
            return NextResponse.json({ items: [] });
        }

        // Filter for image files
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.JPG', '.JPEG', '.PNG', '.WEBP', '.GIF'];

        const items = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return imageExtensions.includes(ext);
            })
            .map(file => {
                // Extract poster name from filename (remove extension)
                const nameWithoutExt = path.parse(file).name
                    .replace(/[-_]/g, ' ')
                    .trim();

                // Use Next.js Image Optimization API
                // We construct a URL that points to /_next/image with parameters
                const rawUrl = `/poster-gallery/${file}`;
                const optimizedUrl = `/_next/image?url=${encodeURIComponent(rawUrl)}&w=1080&q=75`;

                return {
                    image: optimizedUrl,
                    text: nameWithoutExt || 'Poster',
                };
            })
            .sort((a, b) => a.text.localeCompare(b.text));

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
        console.error("Error serving local poster gallery:", error);
        return NextResponse.json(
            { error: "Failed to fetch local poster gallery", items: [], details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
