import { NextResponse } from "next/server";
import { generate11AIResponse } from "@/lib/aiService";

export async function POST(req: Request) {
  try {
    const { playerContext } = await req.json();

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
