import {
  CRIED_AI_SYSTEM_PROMPT,
  detectSupportCategory,
  formatKnowledgeForPrompt,
  searchKnowledgeBase,
  type KnowledgeEntry,
} from "@/lib/support/knowledge-base";
import {
  SUPPORT_AI_ESCALATION_PROMPT,
  type SupportAiMessage,
  type SupportCategory,
} from "@/lib/types/support";

export type AiAssistantInput = {
  userMessage: string;
  history: SupportAiMessage[];
};

export type AiAssistantResult = {
  reply: string;
  shouldEscalate: boolean;
  resolved: boolean;
  category: SupportCategory;
  confidence: number;
};

const RESOLVED_PATTERNS =
  /\b(thanks?|thank you|that helped|solved|fixed|all good|got it|perfect|great|no more questions|issue resolved|works now)\b/i;

const ESCALATE_PATTERNS =
  /\b(speak to (a )?human|real person|staff|support team|create (a )?ticket|escalate|refund|charged twice|hacked|banned wrongly|account locked|lawyer|legal)\b/i;

const UNCERTAIN_PATTERNS =
  /\b(still not|doesn't work|didn't work|same issue|not fixed|help me|urgent|asap|frustrated)\b/i;

function buildKnowledgeReply(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) {
    return `I'd be happy to help! Could you tell me a bit more about what you're trying to do on cried.bio? For example — billing, Premium, profile customization, presets, layouts, badges, or something else?`;
  }

  const primary = entries[0];
  let reply = `Here's what I know about **${primary.title}**:\n\n${primary.content}`;

  if (entries.length > 1) {
    reply += `\n\n**Related topics:** ${entries.slice(1).map((e) => e.title).join(", ")}`;
  }

  if (primary.links?.length) {
    reply += `\n\n📎 **Helpful links:** ${primary.links.map((l) => `[${l.label}](${l.href})`).join(" · ")}`;
  }

  reply += `\n\nDid this answer your question? If not, I can connect you with our support team.`;
  return reply;
}

function computeConfidence(entries: KnowledgeEntry[], message: string): number {
  if (entries.length === 0) return 0.1;
  const top = entries[0];
  let score = 0.4;
  const normalized = message.toLowerCase();
  for (const kw of top.keywords) {
    if (normalized.includes(kw)) score += 0.15;
  }
  return Math.min(score, 0.95);
}

async function callOpenAi(
  userMessage: string,
  history: SupportAiMessage[],
  knowledgeContext: string,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const messages = [
    {
      role: "system" as const,
      content: `${CRIED_AI_SYSTEM_PROMPT}\n\n## Knowledge Base\n${knowledgeContext}`,
    },
    ...history
      .filter((m) => m.role !== "system")
      .slice(-12)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.body,
      })),
    { role: "user" as const, content: userMessage },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SUPPORT_MODEL ?? "gpt-4o-mini",
        messages,
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function generateAiSupportReply(input: AiAssistantInput): Promise<AiAssistantResult> {
  const { userMessage, history } = input;
  const trimmed = userMessage.trim();
  const category = detectSupportCategory(trimmed);
  const userTurns = history.filter((m) => m.role === "user").length + 1;

  if (RESOLVED_PATTERNS.test(trimmed) && userTurns > 1) {
    return {
      reply: "Glad I could help! 🎉 If anything else comes up, I'm here — or you can always reach our team through support. Have a great day!",
      shouldEscalate: false,
      resolved: true,
      category,
      confidence: 1,
    };
  }

  if (ESCALATE_PATTERNS.test(trimmed)) {
    return {
      reply: SUPPORT_AI_ESCALATION_PROMPT,
      shouldEscalate: true,
      resolved: false,
      category,
      confidence: 0,
    };
  }

  const matches = searchKnowledgeBase(trimmed, 3);
  const confidence = computeConfidence(matches, trimmed);
  const knowledgeContext = formatKnowledgeForPrompt(matches);

  const openAiReply = await callOpenAi(trimmed, history, knowledgeContext);
  const reply = openAiReply ?? buildKnowledgeReply(matches);

  const lowConfidenceEscalate = confidence < 0.35 && userTurns >= 2;
  const repeatedIssue = UNCERTAIN_PATTERNS.test(trimmed) && userTurns >= 3;
  const shouldEscalate = lowConfidenceEscalate || repeatedIssue;

  if (shouldEscalate) {
    return {
      reply: `${reply}\n\n---\n\n${SUPPORT_AI_ESCALATION_PROMPT}`,
      shouldEscalate: true,
      resolved: false,
      category,
      confidence,
    };
  }

  return {
    reply,
    shouldEscalate: false,
    resolved: false,
    category,
    confidence,
  };
}

export const CRIED_AI_GREETING = `Hey! I'm **cried AI** — cried.bio's support assistant. 🤖

I can help with:
• Premium & billing questions
• Profile customization, presets & layouts
• Badges, widgets, music & backgrounds
• Troubleshooting common issues

What's going on?`;
