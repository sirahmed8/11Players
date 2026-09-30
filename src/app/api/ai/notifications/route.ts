import { NextResponse } from "next/server";
import { generate11AIResponse } from "@/lib/aiService";
import { z } from "zod";

const notificationRequestSchema = z.object({
  playerContext: z.object({
    fullName: z.string().max(100).optional(),
    primaryPosition: z.string().max(10).optional(),
    overall: z.number().min(0).max(100).optional(),
    goals: z.number().optional(),
    playStyle: z.string().max(50).optional(),
  }).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = notificationRequestSchema.safeParse(json);
    const playerContext = parsed.success ? parsed.data.playerContext : undefined;

    const systemPrompt = `You are "11AI Tactical Alert Engine". Generate ONE short, high-impact, personalized tactical career alert notification (1 sentence) for this player in Arabic:
Player: ${playerContext?.fullName || "Captain"}
Position: ${playerContext?.primaryPosition || "Midfielder"}
OVR: ${playerContext?.overall || 72}
Goals: ${playerContext?.goals || 0}
PlayStyle: ${playerContext?.playStyle || "Standard"}

Rule:
- Write exactly 1 short natural Arabic sentence without brackets or filler words.
- Encourage them on OVR growth, match preparation, or position tips.`;

    const result = await generate11AIResponse({
      message: "Generate 11AI tactical alert notification for my current status.",
      systemPrompt,
      temperature: 0.3,
    });

    return NextResponse.json({
      title: "⚡ تنبيه تكتيكي من 11AI",
      message: result.reply,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({
      title: "⚡ تنبيه تكتيكي من 11AI",
      message: "استعد للمباراة القادمة وحافظ على تمركزك الدفاعي لرفع تقييمك بنجاح!",
      timestamp: Date.now(),
    });
  }
}
