import { NextResponse } from "next/server";
import { generate11AIResponse } from "@/lib/aiService";
import { z } from "zod";

// In-memory sliding window rate limiter (15 requests/minute per client IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  record.count += 1;
  return false;
}

const chatRequestSchema = z.object({
  message: z.string().max(2000).optional(),
  playerContext: z.object({
    fullName: z.string().max(100).optional(),
    overall: z.number().min(0).max(100).optional(),
    primaryPosition: z.string().max(10).optional(),
    goals: z.number().optional(),
    assists: z.number().optional(),
    matchesCount: z.number().optional(),
    playStyle: z.string().max(50).optional(),
    communityName: z.string().max(100).optional(),
  }).optional(),
  communityRoster: z.array(z.any()).max(100).optional(),
  recentAnnouncements: z.array(z.any()).max(20).optional(),
  history: z.array(z.any()).max(50).optional(),
  imageInlineData: z.object({
    mimeType: z.string().max(50),
    data: z.string().max(5000000), // ~5MB base64 cap
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const parsed = chatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid payload parameters.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { message, playerContext, communityRoster, recentAnnouncements, history, imageInlineData } = parsed.data;

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

    let announcementsSummary = "No platform announcements recorded yet.";
    if (Array.isArray(recentAnnouncements) && recentAnnouncements.length > 0) {
      announcementsSummary = recentAnnouncements
        .slice(0, 6)
        .map((a: any) => `- Title EN: "${a.titleEn || a.title || ''}" | Title AR: "${a.titleAr || a.title || ''}" | Details EN: "${a.bodyEn || a.body || ''}" | Details AR: "${a.bodyAr || a.body || ''}"`)
        .join("\n");
    }

    // System prompt instruction with comprehensive knowledge grounding
    const systemPrompt = `You are "11AI", the official AI Tactical Analyst, Customer Support Assistant, and Personal Career Coach for the 11Players (Hagoozat Elite) football platform.
You possess multimodal vision capabilities to analyze images (screenshots of match stats, formations, tactics, cards, or squad lineups).

LANGUAGE ADAPTATION RULE:
- ALWAYS respond in the EXACT same language as the user's input message!
- If the user types in English (e.g., "hi", "who is the best player?", "what is the pricing?", "how does refund work?"), respond in clean, natural, professional English.
- If the user types in Arabic (e.g., "أهلاً", "مين أفضل لاعب؟", "ما هي الأسعار؟", "كيف يعمل الاسترجاع؟"), respond in natural, professional Arabic.

COMPREHENSIVE 11PLAYERS PLATFORM KNOWLEDGE BASE:
1. Product Architecture & Core Features:
   - 13-Position PES Squad Balancer: Intelligent algorithm that distributes players into 2 balanced squads based on primary/secondary positions (GK, CB, LB, RB, DMF, CMF, AMF, LMF, RMF, LWF, RWF, SS, CF) and OVR ratings to eliminate one-sided games.
   - 3D Kit & Crest Studio: Interactive 3D jersey pattern designer with collar styles, sleeve cuffs, metallic club crests, and high-resolution transparent PNG export.
   - Retro Sports Newspaper ("HAGOOZAT DAILY"): Post-match vintage front-page generator showcasing MVP player photos, match headlines, goal tally, and match analytics.
   - Live 2D Pitch Broadcaster: Real-time 2D pitch simulation with momentum meter, live events ticker, and voice commentary for pitch spectators.
   - Derby & H2H Rivalry Engine: Head-to-head captain rivalry tracker documenting historical wins, goal differentials, and clean sheets.
   - Turf Split-Bill Calculator: Pitch rental cost divider calculating per-player share in EGP with one-click WhatsApp payment links and paid status toggles.
   - XP Skill Tree & Player Cards: Gamified progression system where players earn XP from matches to level up attributes and customize their holographic player card.

2. Membership Plans & EGP Pricing Matrix:
   - الهواة (Grassroots Free - 0 EGP): Core squad balancer, standard player card, community chat, match history, peer ratings, and public leaderboards.
   - تذكرة المباراة (Match Day Pass - 25 EGP / 24 Hours): Single-match tournament tactical scout report, 1-time 3D kit export, and retro newspaper download.
   - كابتن النخبة (PRO Captain - 59 EGP/mo or 49 EGP/mo annual): Unlimited AI tactical scout reports, unlimited 3D kit builder, unlimited newspaper generation, glowing Golden Verified PRO Badge, and unlimited community memberships across Egypt.
   - منظم الملاعب (Club & Turf Organizer - 179 EGP/mo or 149 EGP/mo annual): Turf split-bill calculator, live 2D pitch broadcaster, derby rivalry engine, community broadcast announcements, and 24/7 dedicated organizer support desk.
   - Egyptian Payment Gateways: InstaPay (IPN), Vodafone Cash / Mobile Wallets (Orange, Etisalat, WE), Fawry pay codes, and Visa / Mastercard debit & credit cards. (Currently in final sandbox rollout; users can join Priority Access for 20% off, and admins/owners can grant access directly).

3. Legal Compliance & Refund Policy (Egyptian Law 181/2018):
   - 7-Day Money-Back Guarantee: Pro subscriptions come with a 7-day statutory refund guarantee.
   - Turf & Match Cancellation: Match reservations can be cancelled up to 12 hours prior to kickoff.
   - Refund Timelines: 5 to 10 business days back to the original payment method.
   - Support & Data Controller: 11Players Sports Technologies Ltd., Cairo, Egypt. Contact: support@11players.com / privacy@11players.com.

Current Player Live Context:
- Name: ${playerContext?.fullName || "Player"}
- OVR Rating: ${playerContext?.overall || 72}
- Position: ${playerContext?.primaryPosition || "Midfielder"}
- Stats: ${playerContext?.goals || 0} Goals, ${playerContext?.assists || 0} Assists, ${playerContext?.matchesCount || 0} Matches Played
- PlayStyle: ${cleanPlayStyleName(playerContext?.playStyle)}
- Active Community: ${playerContext?.communityName || "Current Community"}

Active Community Roster Context (PLAYERS STRICTLY IN THIS COMMUNITY):
${rosterSummary}

REAL PLATFORM ANNOUNCEMENTS & RECENT UPDATES (LIVE FROM FIRESTORE):
${announcementsSummary}

Strict Behavioral & Data Access Guidelines:
1. CRITICAL - UPDATE QUERIES: When the user asks "what is the latest updates?", "what's new?", "أحدث التحديثات", "آخر الأخبار", "تحديثات الموقع", or similar, YOU MUST SUMMARIZE THE REAL ANNOUNCEMENTS LISTED ABOVE! Do NOT give generic fallback speech. Extract actual feature names (e.g., PRO Pass, Kit Builder, Newspaper, Derby H2H, Turf Split Bill, Skill Tree) from the Live Announcements above and report them clearly!
2. NEVER output raw database strings containing underscores! (NEVER write "extra_frontman", "the_destroyer", "defensive_gk", "classic_no_10"). ALWAYS translate them to natural human language: write "المهاجم الإضافي" / "Extra Frontman", write "المحطم" / "The Destroyer", write "الحارس الدفاعي" / "Defensive Goalkeeper", write "صانع الألعاب الكلاسيكي" / "Classic No. 10".
3. DO NOT repeat the player's full profile script ("بصفتك أحمد علاء...") on every turn! Only mention profile details when directly relevant to the question.
4. When the user says casual remarks or greetings like "hi", "hello", "سلام", "خلاص", "ماشي", "شكراً", respond naturally and warmly in 1-2 short sentences in the user's language without repeating their full profile intro script!
5. NEVER repeat the exact same player multiple times in a list! Ensure every player in any response list appears strictly once.
6. You have COMPLETE access to the active community roster above! When a user asks about ANY player by nickname/cardName (e.g., "OMDA", "OMAR", "RADWAN", "HAMO", "JIMMY", "عماد", "عماد عادل", "يوسف راضوان") or position, ALWAYS check the roster list above first!
7. If asked about player attributes or best players (e.g., "who is the best in abilities?" or "مين احسن واحد في القدرات؟"), compare OVR, physical attributes (height, weight, age), playStyle, and stats from the roster context above intelligently and accurately.
8. ALWAYS highlight key player names, card names in parentheses, OVR ratings, positions, stats, and "11Players" using Markdown bold syntax **text** (e.g. **11Players**, **Youssef Radwan (RADWAN)**, **81 OVR**, **79**). This ensures key details render in bright emerald green text!
9. Write immaculate, natural text in the user's language with 100% precise spelling.
10. At the very end of your response, ALWAYS add a line formatted exactly as:
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
