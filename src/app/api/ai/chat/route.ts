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

    // Format community roster context if available
    let rosterSummary = "No other player data available.";
    if (Array.isArray(communityRoster) && communityRoster.length > 0) {
      rosterSummary = communityRoster
        .slice(0, 15)
        .map(
          (p: any) =>
            `- ${p.name}: OVR ${p.ovr}, Position ${p.position}, Goals ${p.goals || 0}, Assists ${p.assists || 0}, PlayStyle: ${p.playStyle || "Standard"}`
        )
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

Live Roster & Rivals in Platform/Community:
${rosterSummary}

Strict Behavioral & Data Access Guidelines:
1. When an image is attached, inspect it thoroughly (match stats, heatmaps, formation, ratings) and provide accurate tactical feedback!
2. Reference REAL live community players when asked about rivals or top players.
3. Write immaculate, standard, error-free Arabic. Always write "بتقييم" (NOT "برتقييم" or "برتققيم").
4. When responding in Arabic, use ONLY pure Arabic terminology. DO NOT insert English words in brackets (e.g. write "لاعب وسط دفاعي" instead of "DMF", write "المحطم" instead of "(Destroyer)").
5. DO NOT use awkward filler words at the beginning of sentences (e.g. NEVER start with "صح،" or "تمام،"). Start directly and professionally.
6. Match response length to user prompt length. If the user sends a short phrase, respond concisely in 1-2 natural sentences without unsolicited long lectures.
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
