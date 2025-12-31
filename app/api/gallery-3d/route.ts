import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const galleryDir = path.join(process.cwd(), 'public', 'gallery-3d');

        // Check if directory exists
        if (!fs.existsSync(galleryDir)) {
            console.log("gallery-3d directory does not exist, creating it...");
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
            console.log("No files found in public/gallery-3d");
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

                return {
                    image: `/gallery-3d/${file}`,
                    text: nameWithoutExt || 'Poster',
                };
            })
            .sort((a, b) => a.text.localeCompare(b.text));

        console.log(`Found ${items.length} local poster images`);

        return NextResponse.json(
            { items },
            {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store, max-age=0',
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
