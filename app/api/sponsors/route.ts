import { getAllSponsors } from "@/actions/admin/sponsors.action";
import { NextResponse } from "next/server";

// Enable caching: 5 minutes for CDN, 24 hours stale-while-revalidate
export const revalidate = 300; // 5 minutes

export async function GET() {
    const result = await getAllSponsors();
    
    return NextResponse.json(result, {
        headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
    });
}
