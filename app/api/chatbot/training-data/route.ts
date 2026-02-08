import { NextResponse } from "next/server";
import { getTrainingPayload } from "@/lib/chatbot-training";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public API: returns all website content for AI training / chatbot context. */
export async function GET() {
  try {
    const payload = await getTrainingPayload();
    if (!payload) {
      return NextResponse.json(
        { error: "Failed to build training data" },
        { status: 500 }
      );
    }
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (e) {
    console.error("[training-data]", e);
    return NextResponse.json(
      { error: "Failed to build training data" },
      { status: 500 }
    );
  }
}
