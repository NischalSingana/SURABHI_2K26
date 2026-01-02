import { getAllSponsors } from "@/actions/admin/sponsors.action";
import { NextResponse } from "next/server";

export async function GET() {
    const result = await getAllSponsors();
    return NextResponse.json(result);
}
