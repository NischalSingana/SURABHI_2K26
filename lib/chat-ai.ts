/**
 * AI chat with fallback: Groq (primary, fast) → OpenRouter → Bytez.
 * Uses full website knowledge (competitions, terms, accommodation, contact) when provided.
 */

const FALLBACK_SYSTEM_PROMPT = `You are the Surabhi 2026 fest assistant. Use these facts and explain in your own words—do not copy-paste.
- Dates: March 2nd to 7th, 2026. Venue: KL University.
- Registration fees: KL University and other college students ₹350 per member (same for all domestic physical). Virtual (eligible Indian students from other states) ₹150. International virtual FREE. KL: no virtual option, free special lunch and accommodation. Chief guests: not yet decided.
Answer ONLY about the fest: events, registration, accommodation, schedule, fees. Give 2–5 sentences when helpful. Respond in plain text—no asterisks or markdown (no *, **). If asked about chief guests, say not yet decided. If the question is not about the fest, reply: "I can only help with Surabhi 2026 fest. Ask about events, registration, or accommodation."`;

function buildSystemPrompt(knowledgeContext: string | null): string {
  if (!knowledgeContext || !knowledgeContext.trim()) {
    return FALLBACK_SYSTEM_PROMPT;
  }
  return `You are the Surabhi 2026 fest assistant. Use the following knowledge to answer. Synthesize and explain in your own words—do not copy-paste blocks of text from the knowledge.

<knowledge>
${knowledgeContext}
</knowledge>

Instructions:
- Answer ONLY about Surabhi 2026: events, competitions (including rules and terms when asked), registration, accommodation, schedule, contact, sponsors, fees, virtual participation, international students.
- Think and respond naturally based on the knowledge. Summarize and paraphrase; never dump raw text verbatim.
- When listing events or items, use plain text: "On March 3rd: CINE CARNIVAL (Short Film, Cover Songs, Photography), NATYAKA (Skit, Mono Action), National Mock Parliament." Do NOT use asterisks or markdown like * or **.
- When asked about chief guests: say they are not yet decided and will be announced later.
- When asked about registration fees: state clearly—KL University and other college students: ₹350 per member (same fee); KL: no virtual option, free lunch and accommodation; Virtual (eligible Indian students from other states) ₹150; International virtual FREE.
- Dates: March 2nd to 7th, 2026. Venue: KL University.
- Give helpful, complete answers. Use 2–5 sentences when useful; if the user asks for steps, details, or full rules/terms, give a bit longer answers as needed.
- Use plain text only. No markdown formatting (no *, **, #, etc.). Use line breaks and simple punctuation.
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

/** Strip model thinking tags (e.g. Qwen's <think>…</think>) from responses */
function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
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
      const raw = await fn(messages, systemPrompt);
      if (raw) {
        const content = stripThinkingTags(raw);
        if (content) return content;
      }
    } catch (e) {
      errs.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(
    errs.length ? `AI unavailable: ${errs.join("; ")}` : "No AI provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or BYTEZ_API_KEY."
  );
}
