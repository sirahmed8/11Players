import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, lang = "ar" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text parameter is required." }, { status: 400 });
    }

    // Clean markdown symbols for natural speech readout
    const cleanText = text.replace(/[*_#\-•]/g, " ").replace(/\s+/g, " ").trim();

    // Limit chunk to first 180 characters to prevent Google TTS 400 URL limits
    const textToSpeak = cleanText.slice(0, 180).trim();
    const targetLang = lang === "ar" || /[\u0600-\u06FF]/.test(textToSpeak) ? "ar" : "en";

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSpeak)}&tl=${targetLang}&client=tw-ob`;

    const res = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    if (!res.ok) {
      throw new Error(`TTS fetch failed: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    console.error("TTS API Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate speech" }, { status: 500 });
  }
}
