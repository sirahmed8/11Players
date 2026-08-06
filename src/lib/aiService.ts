import { doc, setDoc, addDoc, collection, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function recordRealAiUsage(stats: {
  tokensUsed: number;
  promptTokens: number;
  candidateTokens: number;
  modelUsed: string;
  category?: string;
}) {
  // 1. Instant LocalStorage update & custom window event dispatch
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("11players_ai_usage_stats");
      const existing = raw ? JSON.parse(raw) : { totalRequests: 0, totalTokens: 0 };
      existing.totalRequests = (existing.totalRequests || 0) + 1;
      existing.totalTokens = (existing.totalTokens || 0) + (stats.tokensUsed || 1);
      localStorage.setItem("11players_ai_usage_stats", JSON.stringify(existing));
      window.dispatchEvent(new Event("11ai_usage_updated"));
    } catch (e) {}
  }

  // 2. Firestore atomic increment on system/ai_analytics
  try {
    const ref = doc(db, "system", "ai_analytics");
    await setDoc(
      ref,
      {
        totalRequests: increment(1),
        totalTokens: increment(stats.tokensUsed || 1),
        totalPromptTokens: increment(stats.promptTokens || 1),
        totalCandidateTokens: increment(stats.candidateTokens || 1),
        lastRequestAt: new Date().toISOString(),
        lastModelUsed: stats.modelUsed,
      },
      { merge: true }
    );
  } catch (err) {}

  // 3. Log document to ai_logs collection
  try {
    await addDoc(collection(db, "ai_logs"), {
      tokensUsed: stats.tokensUsed || 1,
      promptTokens: stats.promptTokens || 1,
      candidateTokens: stats.candidateTokens || 1,
      modelUsed: stats.modelUsed,
      category: stats.category || "chat",
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {}
}

export interface AIServiceOptions {
  message: string;
  systemPrompt: string;
  history?: { role: "user" | "model"; parts: { text: string }[] }[];
  imageInlineData?: { mimeType: string; data: string } | null;
  temperature?: number;
  maxTokens?: number;
  category?: "chat" | "scout" | "newspaper" | "notification";
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

function cleanPlayStyleName(style?: string): string {
  if (!style) return "Standard";
  const map: Record<string, string> = {
    extra_frontman: "Extra Frontman (المهاجم الإضافي)",
    the_destroyer: "The Destroyer (المحطم)",
    defensive_gk: "Defensive Goalkeeper (الحارس الدفاعي)",
    offensive_gk: "Offensive Goalkeeper (الحارس الهجومي)",
    classic_no_10: "Classic No. 10 (صانع الألعاب الكلاسيكي)",
    defensive_fullback: "Defensive Fullback (الظهير الدفاعي)",
    attacking_fullback: "Attacking Fullback (الظهير الهجومي)",
    fullback_finisher: "Fullback Finisher (الظهير المنفذ)",
    cross_specialist: "Cross Specialist (مختص العرضيات)",
    build_up: "Build Up (بناء اللعب)",
    box_to_box: "Box-to-Box (من الصندوق إلى الصندوق)",
    hole_player: "Hole Player (اللاعب المتسلل)",
    fox_in_the_box: "Fox in the Box (ثعلب المنطقة)",
    creative_playmaker: "Creative Playmaker (صانع الألعاب المبدع)",
    anchor_man: "Anchor Man (رجل الارتكاز)",
    orchestrator: "Orchestrator (المايسترو)",
    target_man: "Target Man (المهاجم المحطة)",
    goal_poacher: "Goal Poacher (القناص)",
  };
  const key = style.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return map[key] || style.replace(/_/g, " ");
}

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

            const usageMeta = data.usageMetadata;
            const promptTokens = usageMeta?.promptTokenCount || Math.max(1, Math.ceil((options.systemPrompt.length + options.message.length) / 3.5));
            const candidateTokens = usageMeta?.candidatesTokenCount || Math.max(1, Math.ceil(candidateText.length / 3.5));
            const totalTokens = usageMeta?.totalTokenCount || (promptTokens + candidateTokens);

            recordRealAiUsage({
              tokensUsed: totalTokens,
              promptTokens,
              candidateTokens,
              modelUsed: model,
              category: options.category || "chat",
            });

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
          console.warn(`[11AI Gemini] Model ${model} failed (${response.status}):`, errText);
        }
      } catch (err: any) {
        console.error(`[11AI Gemini] Exception on model ${model}:`, err);
        lastError = err;
      }
    }
  }

  // ── OpenRouter Secondary Fallback Engine ────────────────────────────────
  const OPENROUTER_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || "";
  if (OPENROUTER_KEY) {
    const openRouterModels = [
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat",
    ];

    for (const model of openRouterModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "HTTP-Referer": "https://an-11-players.web.app",
            "X-Title": "11Players",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: options.systemPrompt },
              ...(options.history || []).map((h: any) => ({
                role: h.role === "user" ? "user" : "assistant",
                content: h.parts?.[0]?.text || "",
              })),
              { role: "user", content: options.message },
            ],
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens ?? 1024,
          }),
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          let candidateText = data.choices?.[0]?.message?.content;
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
              modelUsed: `OpenRouter (${model})`,
            };

            responseCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 });
            return result;
          }
        } else {
          const errText = await response.text();
          console.warn(`[11AI OpenRouter] Model ${model} failed (${response.status}):`, errText);
        }
      } catch (err: any) {
        console.error(`[11AI OpenRouter] Exception on model ${model}:`, err);
      }
    }
  }

  // Smart offline fallback response
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
  let rosterSummary = "No other player data available.";
  if (Array.isArray(payload.communityRoster) && payload.communityRoster.length > 0) {
    const seen = new Set<string>();
    const uniquePlayers: any[] = [];
    for (const p of payload.communityRoster) {
      const identifier = (p.cardName || p.name || "").toLowerCase().trim();
      if (identifier && !seen.has(identifier)) {
        seen.add(identifier);
        uniquePlayers.push(p);
      }
    }
    rosterSummary = uniquePlayers
      .slice(0, 100)
      .map((p: any) => {
        const cardName = p.cardName || p.name || "Player";
        const fullName = p.name || p.fullName || cardName;
        const pos = [p.position, p.secondaryPosition, p.tertiaryPosition].filter(Boolean).join("/");
        const body = [p.height ? `${p.height}cm` : "", p.weight ? `${p.weight}kg` : "", p.calculatedAge ? `${p.calculatedAge}yo` : ""].filter(Boolean).join(" ");
        const playStyle = cleanPlayStyleName(p.playStyle);
        return `- CardName: "${cardName}" | FullName: "${fullName}" | OVR: ${p.ovr} | Pos: ${pos || "MID"} | PlayStyle: ${playStyle} | Stats: ${p.goals || 0}G/${p.assists || 0}A (${p.matchesCount || 0}M) ${body ? `| Body: ${body}` : ""}`;
      })
      .join("\n");
  }

  const systemPrompt = `You are "11AI", the official AI Tactical Analyst and Personal Career Coach for the 11Players football platform.

Current Player Context:
- Name: ${payload.playerContext?.fullName || "Player"}
- OVR: ${payload.playerContext?.overall || 72}
- Position: ${payload.playerContext?.primaryPosition || "Midfielder"}
- Stats: ${payload.playerContext?.goals || 0} Goals, ${payload.playerContext?.assists || 0} Assists

Full Registered Live Roster & Players Database (ALL PLAYERS IN COMMUNITY):
${rosterSummary}

Strict Behavioral & Data Access Guidelines:
1. NEVER output raw database strings containing underscores! (NEVER write "extra_frontman", "the_destroyer", "defensive_gk", "classic_no_10"). ALWAYS translate them to natural human language: write "المهاجم الإضافي" or "Extra Frontman", write "المحطم" or "The Destroyer", write "الحارس الدفاعي" or "Defensive Goalkeeper", write "صانع الألعاب الكلاسيكي" or "Classic No. 10".
2. DO NOT repeat the player's full profile script ("بصفتك أحمد علاء...") on every turn! Only mention profile details when directly relevant to the question.
3. When the user says casual remarks or farewells like "سلام", "خلاص", "ماشي", "شكراً", respond naturally and warmly in 1 short sentence without repeating their profile intro script!
4. NEVER repeat the exact same player multiple times in a list! Ensure every player in any response list appears strictly once.
5. You have COMPLETE access to the live roster above! When a user asks about ANY player by nickname/cardName (e.g. "OMDA", "OMAR", "RADWAN", "HAMO", "JIMMY", "عماد", "عماد عادل", "يوسف راضوان") or position, ALWAYS check the roster list above first! Every player in this list is a real active registered player on 11Players.
6. If asked about player attributes or best players (e.g., "مين احسن لاعب من ناحية القدرات"), compare OVR, physical attributes (height, weight, age), playStyle, and stats from the roster context above intelligently and accurately.
7. ALWAYS highlight key player names, card names in parentheses, OVR ratings, positions, stats, and "11Players" using Markdown bold syntax **text** (e.g. **11Players**, **يوسف راضوان (RADWAN)**, **81 OVR**, **عماد عادل (OMDA)**, **79**). This ensures key details render in bright emerald green text!
8. ALWAYS write the platform name in Arabic as "منصة 11Players" or "11Players". NEVER transliterate or write awkward phonetic spellings like "إيفليرز" or "إليفن".
9. Write immaculate, natural Arabic with 100% precise spelling (e.g. write "بتقييم" NOT "برتقييم", write "التسديد" NOT "التسود", write "بنظافة" NOT "ب نظافة").
10. At the very end of your response, ALWAYS add a line formatted exactly as:
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
    if (msgLower.includes("أفضل") || msgLower.includes("مركز") || msgLower.includes("منافس") || msgLower.includes("قدرات") || msgLower.includes("احسن")) {
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

  // English Fallback Responses
  if (msgLower.includes("best") || msgLower.includes("top") || msgLower.includes("abilities") || msgLower.includes("ability")) {
    return {
      reply: "The top-rated player on **11Players** is **Youssef Radwan (RADWAN)** with **81 OVR**, followed by **Mohamed Mabrouk (HAMO)** with **80 OVR**, and **Emad Adel (OMDA)** with **79 OVR**!",
      suggestedPrompts: ["Analyze my OVR & weakness", "Match preparation strategy", "Progress toward Ballon d'Or"],
    };
  }

  if (msgLower.includes("ovr") || msgLower.includes("weakness") || msgLower.includes("improve") || msgLower.includes("stats")) {
    return {
      reply: "To boost your **OVR** rating on **11Players**, focus on positional awareness, maintaining high passing accuracy, and regularly logging goals & assists with your team!",
      suggestedPrompts: ["Who are top players in my position?", "Match preparation strategy", "Progress toward Ballon d'Or"],
    };
  }

  return {
    reply: "Welcome Captain! I am **11AI** — your Elite Tactical Analyst & Personal Career Coach on **11Players**. How can I assist your career today?",
    suggestedPrompts: ["Analyze my OVR & weakness", "Who are top players in my position?", "Match preparation strategy"],
  };
}

/**
 * 11AI One-Click Bilingual Announcement Copywriter & Enhancer
 */
export function stripMarkdownAsterisks(str: string): string {
  if (!str) return "";
  return str
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/[\*\_]/g, "")
    .trim();
}

export function cleanSingleLanguageText(text: string | null | undefined, locale: 'en' | 'ar'): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  const hasEnglishHeader = /🇺🇸\s*English|US\s*ENGLISH/i.test(cleaned);
  const hasArabicHeader = /🇸🇦\s*عربي|SA\s*عربي/i.test(cleaned);

  if (hasEnglishHeader || hasArabicHeader) {
    if (locale === 'ar') {
      const arMatch = cleaned.match(/(?:🇸🇦\s*عربي|SA\s*عربي)([\s\S]*)/i);
      if (arMatch && arMatch[1]) {
        cleaned = arMatch[1].trim();
      } else {
        const arOnly = cleaned.split(/(?:🇺🇸\s*English|US\s*ENGLISH)/i)[0];
        cleaned = arOnly || cleaned;
      }
    } else {
      const enMatch = cleaned.match(/(?:🇺🇸\s*English|US\s*ENGLISH)?([\s\S]*?)(?:🇸🇦\s*عربي|SA\s*عربي|$)/i);
      if (enMatch && enMatch[1]) {
        cleaned = enMatch[1].replace(/🇺🇸\s*English|US\s*ENGLISH/gi, '').trim();
      }
    }
  }

  // Remove leftover header tags if present
  cleaned = cleaned
    .replace(/🇺🇸\s*English/gi, '')
    .replace(/US\s*ENGLISH/gi, '')
    .replace(/🇸🇦\s*عربي/gi, '')
    .replace(/SA\s*عربي/gi, '')
    .trim();

  return cleaned;
}

export async function enhanceAnnouncementWithAI(payload: {
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  presetTopic?: string;
  customToneInstruction?: string;
  communityName?: string;
}): Promise<{
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
}> {
  const prompt = `You are "11AI", the official bilingual sports copywriter and community broadcast manager for the 11Players platform.
Your objective is to generate or dramatically improve a broadcast announcement in BOTH English AND Arabic simultaneously.

Draft Context:
- English Title Draft: "${payload.titleEn || ""}"
- Arabic Title Draft: "${payload.titleAr || ""}"
- English Body Draft: "${payload.bodyEn || ""}"
- Arabic Body Draft: "${payload.bodyAr || ""}"
- Preset Category: "${payload.presetTopic || "General Update"}"
- Custom Tone & Style Request: "${payload.customToneInstruction || "Professional, engaging, clean, single language per field without embedding cross-translations."}"
- Target Community: "${payload.communityName || "11Players"}"

Instructions:
1. Make both titles catchy, concise (under 8 words), with relevant sports emojis (e.g. ⚽, 📢, 🏆, 🚨).
2. Make both body descriptions professional, clear, exciting, and well-structured matching the custom tone request if provided.
3. CRITICAL: Never mix English and Arabic together inside the same field. titleEn & bodyEn must contain ONLY English text. titleAr & bodyAr must contain ONLY Arabic text. Do NOT include "🇺🇸 English" or "🇸🇦 عربي" labels.
4. CRITICAL: NEVER use markdown formatting like **bold** or *italic*. Do NOT output any asterisks (*). Return clean plain text only.
5. Return ONLY a valid JSON object matching this structure with no code blocks or markdown wrapper:
{
  "titleEn": "...",
  "titleAr": "...",
  "bodyEn": "...",
  "bodyAr": "..."
}`;

  let replyText = "";

  // 1. Try server API route first (has access to server env API keys)
  try {
    const apiRes = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        systemPrompt: "You are a specialized JSON-only bilingual copywriting engine for 11Players announcements. Output JSON only without asterisks or markdown formatting.",
      }),
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.reply) {
        replyText = data.reply;
      }
    }
  } catch (e) {
    // API route un-reachable (e.g. static hosting without proxy)
  }

  // 2. Direct client-side engine call fallback
  if (!replyText) {
    try {
      const res = await generate11AIResponse({
        message: prompt,
        systemPrompt: "You are a specialized JSON-only bilingual copywriting engine for 11Players announcements. Do not use asterisks or markdown formatting.",
        temperature: 0.3,
      });
      replyText = res.reply;
    } catch (err) {
      console.error("[11AI Announcement AI Error]:", err);
    }
  }

  // 3. Parse JSON response from LLM
  if (replyText) {
    const cleanText = replyText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.titleEn || parsed.titleAr || parsed.bodyEn || parsed.bodyAr) {
          return {
            titleEn: stripMarkdownAsterisks(parsed.titleEn || payload.titleEn || "📢 Official Community Announcement"),
            titleAr: stripMarkdownAsterisks(parsed.titleAr || payload.titleAr || "📢 إعلان رسمي من إدارة المجتمع"),
            bodyEn: stripMarkdownAsterisks(parsed.bodyEn || payload.bodyEn || "Important update for all registered players in our community."),
            bodyAr: stripMarkdownAsterisks(parsed.bodyAr || payload.bodyAr || "تحديث مهم لجميع اللاعبين المسجلين في مجتمعنا."),
          };
        }
      } catch (e) {
        console.warn("Failed parsing 11AI announcement JSON response:", e);
      }
    }
  }

  // 4. High Quality Smart Fallback Presets if API offline
  if (payload.presetTopic === "next_match") {
    return {
      titleEn: "⚽ Next Match Sign-Up Open!",
      titleAr: "⚽ فتح باب التسجيل للمباراة القادمة!",
      bodyEn: "Sign-ups for our upcoming community fixture are now officially open. Check your stats and reserve your spot in the squad lineup now!",
      bodyAr: "تم فتح باب التسجيل رسمياً لمباراة المجتمع القادمة. تفقد إحصائياتك واضمن مكانك في تشكيلة الفريق الآن!",
    };
  }
  if (payload.presetTopic === "tournament") {
    return {
      titleEn: "🏆 Community Championship Cup Announced!",
      titleAr: "🏆 الإعلان عن بطولة كأس المجتمع الكبرى!",
      bodyEn: "Get ready for the ultimate 11Players tournament! Top squads will battle for glory, MVP honors, and exclusive career badges.",
      bodyAr: "استعد لأقوى بطولات منصة 11Players! أفضل الفرق ستتنافس على المجد، لقب الأفضل (MVP)، وأوسمة المسيرة الاحترافية.",
    };
  }
  if (payload.presetTopic === "urgent_notice") {
    return {
      titleEn: "🚨 Important Schedule Update & Maintenance",
      titleAr: "🚨 تحديث مهم جداً بشأن المواعيد وجدول المباريات",
      bodyEn: "Please review the updated match timing and venue details. All team captains are requested to confirm their squad availability.",
      bodyAr: "يرجى مراجعة المواعيد المعدلة للمباراة وتفاصيل الملعب. يرجى من جميع كباتن الفرق تأكيد جاهزية التشكيلة.",
    };
  }

  // 5. Intelligent Draft Copy Polisher Fallback (for user typed text)
  const hasEnTitle = Boolean(payload.titleEn?.trim());
  const hasArTitle = Boolean(payload.titleAr?.trim());
  const hasEnBody = Boolean(payload.bodyEn?.trim());
  const hasArBody = Boolean(payload.bodyAr?.trim());

  let polishedTitleEn = payload.titleEn?.trim() || "";
  let polishedTitleAr = payload.titleAr?.trim() || "";
  let polishedBodyEn = payload.bodyEn?.trim() || "";
  let polishedBodyAr = payload.bodyAr?.trim() || "";

  // Add emoji header if missing
  if (polishedTitleEn && !/^[\u{1F300}-\u{1F9FF}⚽📢🏆🚨⚡✨]/u.test(polishedTitleEn)) {
    polishedTitleEn = `📢 ${polishedTitleEn}`;
  }
  if (polishedTitleAr && !/^[\u{1F300}-\u{1F9FF}⚽📢🏆🚨⚡✨]/u.test(polishedTitleAr)) {
    polishedTitleAr = `📢 ${polishedTitleAr}`;
  }

  // Auto fill missing translations from available draft
  if (!hasEnTitle && hasArTitle) polishedTitleEn = `📢 Community Alert: ${polishedTitleAr.replace(/^[\u{1F300}-\u{1F9FF}⚽📢🏆🚨⚡✨]\s*/u, "")}`;
  if (!hasArTitle && hasEnTitle) polishedTitleAr = `📢 تنبيه المجتمع: ${polishedTitleEn.replace(/^[\u{1F300}-\u{1F9FF}⚽📢🏆🚨⚡✨]\s*/u, "")}`;
  if (!hasEnBody && hasArBody) polishedBodyEn = `${polishedBodyAr} (Official Community Broadcast)`;
  if (!hasArBody && hasEnBody) polishedBodyAr = `${polishedBodyEn} (إعلان رسمي من إدارة المجتمع)`;

  return {
    titleEn: polishedTitleEn || "📢 Official Community Announcement",
    titleAr: polishedTitleAr || "📢 إعلان رسمي من إدارة المجتمع",
    bodyEn: polishedBodyEn || "Important update for all registered players in our community. Stay tuned for upcoming fixtures and features!",
    bodyAr: polishedBodyAr || "تحديث مهم لجميع اللاعبين المسجلين في مجتمعنا. تابعوا القادم للمزيد من المباريات والميزات!",
  };
}
