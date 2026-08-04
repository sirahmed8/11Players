import { NextResponse } from "next/server";
import { generate11AIResponse } from "@/lib/aiService";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().optional(),
  playerContext: z.object({
    fullName: z.string().optional(),
    overall: z.number().optional(),
    primaryPosition: z.string().optional(),
    goals: z.number().optional(),
    assists: z.number().optional(),
    matchesCount: z.number().optional(),
    playStyle: z.string().optional(),
    communityName: z.string().optional(),
  }).optional(),
  communityRoster: z.array(z.any()).optional(),
  history: z.array(z.any()).optional(),
  imageInlineData: z.object({
    mimeType: z.string(),
    data: z.string(),
  }).nullable().optional(),
});

function cleanPlayStyleName(style?: string): string {
  if (!style) return "Standard (قياسي)";
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
    dummy_runner: "Dummy Runner (العداء الوهمي)",
    roaming_flank: "Roaming Flank (الجناح الجوال)",
    prolific_winger: "Prolific Winger (الجناح الهداف)",
    deep_lying_forward: "Deep-Lying Forward (المهاجم المتراجع)",
  };
  const key = style.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return map[key] || style.replace(/_/g, " ");
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parsed = chatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid payload parameters.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, playerContext, communityRoster, history, imageInlineData } = parsed.data;

    if (!message && !imageInlineData) {
      return NextResponse.json(
        { error: "bad_request", message: "Message or image parameter is required." },
        { status: 400 }
      );
    }

    // Format community roster context with rich player metadata (deduplicated up to 100 unique players)
    let rosterSummary = "No other player data available.";
    if (Array.isArray(communityRoster) && communityRoster.length > 0) {
      const seen = new Set<string>();
      const uniquePlayers: any[] = [];
      for (const p of communityRoster) {
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
          return `- CardName: "${cardName}" | FullName: "${fullName}" | OVR: ${p.ovr || p.overallRating || 72} | Pos: ${pos || "MID"} | PlayStyle: ${playStyle} | Stats: ${p.goals || 0}G/${p.assists || 0}A (${p.matchesCount || 0}M) ${body ? `| Body: ${body}` : ""}`;
        })
        .join("\n");
    }

    // System prompt instruction
    const systemPrompt = `You are "11AI", the official AI Tactical Analyst and Personal Career Coach for the 11Players football platform.
You possess multimodal vision capabilities to analyze images (screenshots of match stats, formations, tactics, cards, or squad lineups).

LANGUAGE ADAPTATION RULE:
- ALWAYS respond in the EXACT same language as the user's input message!
- If the user types in English (e.g., "hi", "who is the best player?", "analyze my stats", "how to raise my OVR"), respond in clean, natural, professional English.
- If the user types in Arabic (e.g., "أهلاً", "مين أفضل لاعب؟", "تحليل تقييمي"), respond in natural, professional Arabic.

Current Player Live Context:
- Name: ${playerContext?.fullName || "Player"}
- OVR Rating: ${playerContext?.overall || 72}
- Position: ${playerContext?.primaryPosition || "Midfielder"}
- Stats: ${playerContext?.goals || 0} Goals, ${playerContext?.assists || 0} Assists, ${playerContext?.matchesCount || 0} Matches Played
- PlayStyle: ${cleanPlayStyleName(playerContext?.playStyle)}
- Active Community: ${playerContext?.communityName || "Current Community"}

Active Community Roster Context (PLAYERS STRICTLY IN THIS COMMUNITY):
${rosterSummary}

Strict Behavioral & Data Access Guidelines:
1. NEVER output raw database strings containing underscores! (NEVER write "extra_frontman", "the_destroyer", "defensive_gk", "classic_no_10"). ALWAYS translate them to natural human language: write "المهاجم الإضافي" / "Extra Frontman", write "المحطم" / "The Destroyer", write "الحارس الدفاعي" / "Defensive Goalkeeper", write "صانع الألعاب الكلاسيكي" / "Classic No. 10".
2. DO NOT repeat the player's full profile script ("بصفتك أحمد علاء...") on every turn! Only mention profile details when directly relevant to the question.
3. When the user says casual remarks or greetings like "hi", "hello", "سلام", "خلاص", "ماشي", "شكراً", respond naturally and warmly in 1-2 short sentences in the user's language without repeating their full profile intro script!
4. NEVER repeat the exact same player multiple times in a list! Ensure every player in any response list appears strictly once.
5. You have COMPLETE access to the active community roster above! When a user asks about ANY player by nickname/cardName (e.g., "OMDA", "OMAR", "RADWAN", "HAMO", "JIMMY", "عماد", "عماد عادل", "يوسف راضوان") or position, ALWAYS check the roster list above first!
6. If asked about player attributes or best players (e.g., "who is the best in abilities?" or "مين احسن واحد في القدرات؟"), compare OVR, physical attributes (height, weight, age), playStyle, and stats from the roster context above intelligently and accurately.
7. ALWAYS highlight key player names, card names in parentheses, OVR ratings, positions, stats, and "11Players" using Markdown bold syntax **text** (e.g. **11Players**, **Youssef Radwan (RADWAN)**, **81 OVR**, **79**). This ensures key details render in bright emerald green text!
8. Write immaculate, natural text in the user's language with 100% precise spelling.
9. At the very end of your response, ALWAYS add a line formatted exactly as:
[SUGGESTIONS: Question 1 | Question 2 | Question 3]
Provide 2-3 short, highly relevant follow-up questions tailored to the conversation (in the same language as user prompt).`;

    const formattedHistory: { role: "user" | "model"; parts: { text: string }[] }[] = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: (h.role === "user" || h.sender === "user" ? "user" : "model") as "user" | "model",
          parts: [{ text: String(h.parts?.[0]?.text || h.text || "") }],
        }))
      : [];

    const result = await generate11AIResponse({
      message: message || "Analyze squad and my profile",
      systemPrompt,
      history: formattedHistory,
      imageInlineData,
      category: "chat",
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("AI API Error:", err);
    return NextResponse.json(
      {
        error: "api_limit",
        message: "وصلت إلى الحد المؤقت لطلبات الذكاء الاصطناعي. يرجى الانتظار بضع لحظات ثم المحاولة مجدداً! ⚡",
        messageEn: "You've reached the temporary request limit for AI responses. Please wait a few moments and try again! ⚡",
        details: err?.message,
      },
      { status: 429 }
    );
  }
}
