import { NextRequest, NextResponse } from "next/server";
import { getAiReply } from "@/lib/chat-ai";
import { getTrainingPayload } from "@/lib/chatbot-training";
import { buildFullKnowledgeForAI } from "@/lib/chatbot-knowledge";
import { checkRateLimit } from "@/lib/chatbot-rate-limit";

/**
 * Chat API: uses ONLY the AI model (Groq → OpenRouter → Bytez).
 * FAQ bot code is kept elsewhere (admin/faqs) but is NOT used here for answering.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 20;

type Message = { role: "system" | "user" | "assistant"; content: string };

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many messages. Please wait a minute before sending more.",
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const messages = body.messages as Message[] | undefined;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array required" },
        { status: 400 }
      );
    }
    const payload = await getTrainingPayload();
    const knowledgeContext =
      payload ? buildFullKnowledgeForAI(payload) : null;
    const content = await getAiReply(messages, knowledgeContext);
    return NextResponse.json({ content });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI chat failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
