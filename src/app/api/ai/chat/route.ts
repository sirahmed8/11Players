import { NextResponse } from "next/server";
import { generate11AIResponse } from "@/lib/aiService";

export async function POST(req: Request) {
  try {
    const { message, playerContext, communityRoster, history, imageInlineData } = await req.json();

    if ((!message || typeof message !== "string") && !imageInlineData) {
      return NextResponse.json(
        { error: "bad_request", message: "Message or image parameter is required." },
        { status: 400 }
      );
    }

    // Format community roster context with rich player metadata (up to 100 players)
    let rosterSummary = "No other player data available.";
    if (Array.isArray(communityRoster) && communityRoster.length > 0) {
      rosterSummary = communityRoster
        .slice(0, 100)
        .map((p: any) => {
          const cardName = p.cardName || p.name || "Player";
          const fullName = p.name || p.fullName || cardName;
          const pos = [p.position, p.secondaryPosition, p.tertiaryPosition].filter(Boolean).join("/");
          const body = [p.height ? `${p.height}cm` : "", p.weight ? `${p.weight}kg` : "", p.calculatedAge ? `${p.calculatedAge}yo` : ""].filter(Boolean).join(" ");
          return `- CardName: "${cardName}" | FullName: "${fullName}" | OVR: ${p.ovr} | Pos: ${pos || "MID"} | PlayStyle: ${p.playStyle || "Standard"} | Stats: ${p.goals || 0}G/${p.assists || 0}A (${p.matchesCount || 0}M) ${body ? `| Body: ${body}` : ""}`;
        })
        .join("\n");
    }

    // System prompt instruction
    const systemPrompt = `You are "11AI", the official AI Tactical Analyst and Personal Career Coach for the 11Players football platform.
You possess multimodal vision capabilities to analyze images (screenshots of match stats, formations, tactics, cards, or squad lineups).

Current Player Live Context:
- Name: ${playerContext?.fullName || "Player"}
- OVR Rating: ${playerContext?.overall || 72}
- Position: ${playerContext?.primaryPosition || "Midfielder"}
- Stats: ${playerContext?.goals || 0} Goals, ${playerContext?.assists || 0} Assists, ${playerContext?.matchesCount || 0} Matches Played
- PlayStyle: ${playerContext?.playStyle || "Standard"}
- Community: ${playerContext?.communityName || "11Players Global"}

Full Registered Live Roster & Players Database (ALL PLAYERS IN COMMUNITY):
${rosterSummary}

Strict Behavioral & Data Access Guidelines:
1. You have COMPLETE access to the live roster above! When a user asks about ANY player by nickname/cardName (e.g., "OMDA", "OMAR", "RADWAN", "HAMO", "JIMMY", "عماد", "عماد عادل", "يوسف راضوان") or position, ALWAYS check the roster list above first! Every player in this list is a real active registered player on 11Players.
2. If asked about player attributes or best players (e.g., "مين احسن لاعب من ناحية القدرات"), compare OVR, physical attributes (height, weight, age), playStyle, and stats from the roster context above intelligently and accurately.
3. ALWAYS write the platform name in Arabic as "منصة 11Players" or "11Players". NEVER transliterate or write awkward phonetic spellings like "إيفليرز" or "إليفن".
4. Write immaculate, natural Arabic. Always write "بتقييم" (NOT "برتقييم" or "برتققيم").
5. DO NOT use awkward filler words at the beginning of sentences (e.g. NEVER start with "صح،" or "تمام،"). Start directly and professionally.
6. Match response length to user prompt length. If the user sends a short phrase or greeting, respond concisely in 1-2 natural sentences without unsolicited long lectures.
7. At the very end of your response, ALWAYS add a line formatted exactly as:
[SUGGESTIONS: Question 1 | Question 2 | Question 3]
Provide 2-3 short, highly relevant follow-up questions tailored to the conversation (in the same language as user prompt).`;

    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map((h: any) => ({
          role: h.sender === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: h.text }],
        }))
      : [];

    const result = await generate11AIResponse({
      message: message || (imageInlineData ? "Analyze this attached image for me." : "Hello"),
      systemPrompt,
      history: formattedHistory,
      imageInlineData,
      temperature: 0.2,
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
