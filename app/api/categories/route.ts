import { getCategories } from "@/actions/events.action";
import { NextResponse } from "next/server";

export const revalidate = 60;

type CategoryWithEvents = {
  name: string;
  slug: string;
  Event: Array<{ name: string; slug: string }>;
};

export async function GET() {
  const result = await getCategories(false);
  if (!result.success || !result.data) {
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
  const categories = (result.data as CategoryWithEvents[]).map((c) => ({
    name: c.name,
    slug: c.slug,
    events: (c.Event || []).map((e) => ({ name: e.name, slug: e.slug })),
  }));
  return NextResponse.json({ categories });
}
