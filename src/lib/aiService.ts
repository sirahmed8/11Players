// Centralized 11AI Gemini Service with Multi-Model Fallback & Rate-Limit Caching

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
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-2.0-flash",
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

          // Cache for 10 minutes to save quota
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

  throw new Error(`All 11AI candidate models failed. Last error: ${JSON.stringify(lastError)}`);
}
