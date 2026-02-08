/**
 * AI chat with fallback: Groq (primary, fast) → OpenRouter → Bytez.
 * Uses full website knowledge (competitions, terms, accommodation, contact) when provided.
 */

const FALLBACK_SYSTEM_PROMPT = `You are the Surabhi 2026 fest assistant. Use ONLY these facts:
- Dates: March 2nd to 7th, 2026. Venue: KL University.
- Registration fees: KL University students FREE; Physical (other colleges) ₹350; Virtual (eligible Indian students from other states) ₹150; International virtual FREE. Chief guests: not yet decided.
Answer ONLY about the fest: events, registration, accommodation, schedule, fees. Give 2–5 sentences when helpful. If asked about chief guests, say not yet decided. If the question is not about the fest, reply: "I can only help with Surabhi 2026 fest. Ask about events, registration, or accommodation."`;

function buildSystemPrompt(knowledgeContext: string | null): string {
  if (!knowledgeContext || !knowledgeContext.trim()) {
    return FALLBACK_SYSTEM_PROMPT;
  }
  return `You are the Surabhi 2026 fest assistant. Use ONLY the following information to answer. Do not make up details.

<knowledge>
${knowledgeContext}
</knowledge>

Instructions:
- Answer ONLY about Surabhi 2026: events, competitions (including rules and terms when asked), registration, accommodation, schedule, contact, sponsors, fees, virtual participation, international students.
- When asked about a specific competition, use its description and terms and conditions from the knowledge above.
- When asked about chief guests: say they are not yet decided and will be announced later.
- When asked about registration fees: state clearly—KL University students: free; Physical (other colleges) ₹350; Virtual (eligible Indian students from other states) ₹150; International virtual FREE.
- Dates: March 2nd to 7th, 2026. Venue: KL University.
- Give helpful, complete answers. Use 2–5 sentences when useful; if the user asks for steps, details, or full rules/terms, give a bit longer answers as needed. Do not be overly brief when more detail is asked for.
- If the question is not about the fest, reply: "I can only help with Surabhi 2026 fest. Ask about events, registration, accommodation, fees, or competition rules."`;
}

const MAX_TOKENS = 180;
const REQUEST_TIMEOUT_MS = 15000;

type Message = { role: "system" | "user" | "assistant"; content: string };

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

const MAX_TOKENS_WITH_KNOWLEDGE = 520;

async function tryGroq(messages: Message[], systemPrompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: systemPrompt.length > 500 ? MAX_TOKENS_WITH_KNOWLEDGE : MAX_TOKENS,
        temperature: 0.4,
      }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  return content ?? null;
}

async function tryOpenRouter(messages: Message[], systemPrompt: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const res = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: systemPrompt.length > 500 ? MAX_TOKENS_WITH_KNOWLEDGE : MAX_TOKENS,
        temperature: 0.4,
      }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  return content ?? null;
}

async function tryBytez(messages: Message[], systemPrompt: string): Promise<string | null> {
  const key = process.env.BYTEZ_API_KEY;
  if (!key) return null;
  const res = await fetchWithTimeout(
    "https://api.bytez.com/models/v2/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "Qwen/Qwen3-4B",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: systemPrompt.length > 500 ? MAX_TOKENS_WITH_KNOWLEDGE : MAX_TOKENS,
        temperature: 0.4,
      }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content?.trim();
  return content ?? null;
}

/** Try Groq first, then OpenRouter, then Bytez. Returns content or throws. */
export async function getAiReply(
  messages: Message[],
  knowledgeContext?: string | null
): Promise<string> {
  const systemPrompt = buildSystemPrompt(knowledgeContext ?? null);
  const errs: string[] = [];
  for (const fn of [tryGroq, tryOpenRouter, tryBytez]) {
    try {
      const content = await fn(messages, systemPrompt);
      if (content) return content;
    } catch (e) {
      errs.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(
    errs.length ? `AI unavailable: ${errs.join("; ")}` : "No AI provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or BYTEZ_API_KEY."
  );
}
