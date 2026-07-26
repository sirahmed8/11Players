// Centralized 11AI Gemini Service with Multi-Model Fallback & Client-Side Host Adaptation

export interface AIServiceOptions {
  message: string;
  systemPrompt: string;
  history?: { role: "user" | "model"; parts: { text: string }[] }[];
  imageInlineData?: { mimeType: string; data: string } | null;
  temperature?: number;
  maxTokens?: number;
}

export interface AIServiceResult {
  reply: string;
  suggestedPrompts?: string[];
  modelUsed: string;
}

const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-flash-lite-latest",
];

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

// In-memory cache for notifications & career advice (TTL: 10 minutes)
const responseCache = new Map<string, { data: AIServiceResult; expiresAt: number }>();

export async function generate11AIResponse(options: AIServiceOptions): Promise<AIServiceResult> {
  const cacheKey = `${options.message}_${options.systemPrompt.slice(0, 100)}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const contents: any[] = [];

  if (Array.isArray(options.history) && options.history.length > 0) {
    contents.push(...options.history);
  }

  const userParts: any[] = [];
  if (options.imageInlineData && options.imageInlineData.data) {
    userParts.push({
      inlineData: {
        mimeType: options.imageInlineData.mimeType || "image/jpeg",
        data: options.imageInlineData.data,
      },
    });
  }

  userParts.push({
    text: `${options.systemPrompt}\n\nUser Question/Input: ${options.message}`,
  });

  contents.push({
    role: "user",
    parts: userParts,
  });

  let lastError: any = null;

  if (API_KEY) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: options.temperature ?? 0.2,
              maxOutputTokens: options.maxTokens ?? 1024,
            },
          }),
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          let candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            let suggestedPrompts: string[] = [];
            const suggestionsMatch = candidateText.match(/\[SUGGESTIONS:\s*(.*?)\]/i);

            if (suggestionsMatch) {
              const rawSuggestions = suggestionsMatch[1];
              suggestedPrompts = rawSuggestions.split("|").map((s: string) => s.trim()).filter(Boolean);
              candidateText = candidateText.replace(/\[SUGGESTIONS:\s*.*?\]/gi, "").trim();
            }

            const result: AIServiceResult = {
              reply: candidateText,
              suggestedPrompts,
              modelUsed: model,
            };

            responseCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 });
            return result;
          }
        } else {
          const errText = await response.text();
          console.warn(`[11AI] Model ${model} failed (${response.status}):`, errText);
          lastError = { status: response.status, body: errText };
        }
      } catch (err: any) {
        console.error(`[11AI] Exception on model ${model}:`, err);
        lastError = err;
      }
    }
  }

  // Smart fallback response when API key is not present or endpoint is static
  const isAr = /[\u0600-\u06FF]/.test(options.message);
  const fallbackReply = generateSmartFallbackReply(options.message, options.systemPrompt, isAr);
  return {
    reply: fallbackReply.reply,
    suggestedPrompts: fallbackReply.suggestedPrompts,
    modelUsed: "11AI-Engine-Offline",
  };
}

/**
 * Universal Client Helper for Chat: Handles static host fallbacks gracefully
 */
export async function call11AIChat(payload: {
  message: string;
  playerContext: any;
  communityRoster: any[];
  history: any[];
  imageInlineData?: any;
}): Promise<AIServiceResult> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) return data;
    }
  } catch (e) {
    // Static host or network error — fallback client side
  }

  // Client-side fallback generation (for static hosting environments like Firebase)
  const rosterSummary = Array.isArray(payload.communityRoster) && payload.communityRoster.length > 0
    ? payload.communityRoster
        .slice(0, 100)
        .map((p: any) => {
          const cardName = p.cardName || p.name || "Player";
          const fullName = p.name || p.fullName || cardName;
          const pos = [p.position, p.secondaryPosition, p.tertiaryPosition].filter(Boolean).join("/");
          const body = [p.height ? `${p.height}cm` : "", p.weight ? `${p.weight}kg` : "", p.calculatedAge ? `${p.calculatedAge}yo` : ""].filter(Boolean).join(" ");
          return `- CardName: "${cardName}" | FullName: "${fullName}" | OVR: ${p.ovr} | Pos: ${pos || "MID"} | PlayStyle: ${p.playStyle || "Standard"} | Stats: ${p.goals || 0}G/${p.assists || 0}A (${p.matchesCount || 0}M) ${body ? `| Body: ${body}` : ""}`;
        })
        .join("\n")
    : "No other player data available.";

  const systemPrompt = `You are "11AI", the official AI Tactical Analyst and Personal Career Coach for the 11Players football platform.

Current Player Context:
- Name: ${payload.playerContext?.fullName || "Player"}
- OVR: ${payload.playerContext?.overall || 72}
- Position: ${payload.playerContext?.primaryPosition || "Midfielder"}
- Stats: ${payload.playerContext?.goals || 0} Goals, ${payload.playerContext?.assists || 0} Assists

Full Registered Live Roster & Players Database (ALL PLAYERS IN COMMUNITY):
${rosterSummary}

Strict Behavioral & Data Access Guidelines:
1. You have COMPLETE access to the live roster above! When a user asks about ANY player by nickname/cardName (e.g. "OMDA", "OMAR", "RADWAN", "HAMO", "JIMMY", "عماد", "عماد عادل", "يوسف راضوان") or position, ALWAYS check the roster list above first! Every player in this list is a real active registered player on 11Players.
2. If asked about player attributes or best players (e.g., "مين احسن لاعب من ناحية القدرات"), compare OVR, physical attributes (height, weight, age), playStyle, and stats from the roster context above intelligently and accurately.
3. ALWAYS highlight key player names, card names in parentheses, OVR ratings, positions, stats, and "11Players" using Markdown bold syntax **text** (e.g. **11Players**, **يوسف راضوان (RADWAN)**, **81 OVR**, **عماد عادل (OMDA)**, **79**). This ensures key details render in bright emerald green text!
4. ALWAYS write the platform name in Arabic as "منصة 11Players" or "11Players". NEVER transliterate or write awkward phonetic spellings like "إيفليرز" or "إليفن".
5. Write immaculate, natural Arabic. Always write "بتقييم" (NOT "برتقييم" or "برتققيم").
6. Match response length to user prompt length. If the user sends a short phrase or greeting, respond concisely in 1-2 natural sentences without unsolicited long lectures.
7. At the very end of your response, ALWAYS add a line formatted exactly as:
[SUGGESTIONS: Question 1 | Question 2 | Question 3]`;

  return generate11AIResponse({
    message: payload.message || "Hello",
    systemPrompt,
    history: payload.history?.map((h: any) => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    })),
    imageInlineData: payload.imageInlineData,
  });
}

function generateSmartFallbackReply(message: string, systemPrompt: string, isAr: boolean): { reply: string; suggestedPrompts: string[] } {
  const msgLower = message.toLowerCase();

  if (isAr) {
    if (msgLower.includes("ضعف") || msgLower.includes("تقييم") || msgLower.includes("ovr")) {
      return {
        reply: "لرفع تقييمك الـ **OVR** بشكل ملحوظ في منصة **11Players**، ركّز على تحسين معدل التمرير الناجح والتمركز الصحيح في الملعب، مع الاستمرار في تسجيل الأهداف وصناعة الفرص لزملائك!",
        suggestedPrompts: ["من هم أفضل اللاعبين في مركزي؟", "استراتيجية الاستعداد للمباراة", "كيف أحصل على جائزة أفضل لاعب؟"],
      };
    }
    if (msgLower.includes("أفضل") || msgLower.includes("مركز") || msgLower.includes("منافس") || msgLower.includes("قدرات")) {
      return {
        reply: "أعلى لاعب تقييماً في منصة **11Players** هو الكابتن **يوسف راضوان (RADWAN)** بتقييم **81**، ويليه الكابتن **محمد مبروك (HAMO)** بتقييم **80**، ثم الكابتن **عماد عادل (OMDA)** بتقييم **79**!",
        suggestedPrompts: ["كيف ارفع تقييمي الـ OVR؟", "استراتيجية الاستعداد للمباراة", "طريقة تنظيم التكتيك"],
      };
    }
    return {
      reply: "أهلاً بك يا كابتن! بصفتي **11AI**، أنا هنا لمساعدتك في تحليل أداءك وتطوير مهاراتك التكتيكية في منصة **11Players**. كيف يمكنني دعمك اليوم؟",
      suggestedPrompts: ["تحليل نقاط القوة والضعف", "من هم أفضل اللاعبين في مركزي؟", "استراتيجية الاستعداد للمباراة"],
    };
  }

  return {
    reply: "Welcome Captain! To boost your **OVR** rating on **11Players**, focus on key position attributes, maintain consistent passing accuracy, and keep contributing goals & assists.",
    suggestedPrompts: ["Analyze my OVR & weakness", "Who are top players in my position?", "Match preparation strategy"],
  };
}
