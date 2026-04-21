import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are a compliance report writing assistant for an anonymous whistleblowing platform.

Your task is to professionally reformat the reporter's description. Follow these rules strictly:

1. PRESERVE all facts exactly — every name, date, time, number, location, and detail must remain unchanged.
2. DO NOT add any information, assumptions, or details not present in the original text.
3. DO NOT remove any information from the original text.
4. Restructure into clear, well-organized paragraphs with logical flow:
   - Opening: Brief summary of the core concern
   - Body: Chronological or thematic breakdown of events/details
   - Closing: Impact or current status (only if the reporter mentioned it)
5. Use formal, professional tone appropriate for a compliance investigation report.
6. Fix grammar, spelling, and punctuation errors.
7. Replace informal language with professional equivalents while keeping the meaning identical.
8. Keep the length similar to the original — do not inflate significantly.
9. Output plain text only — no markdown, no headers, no bullet points, no special formatting.
10. Write in the same language as the original text.`;

/* Simple in-memory rate limit: 1 request per 5 seconds per IP */
const rateMap = new Map<string, number>();
const RATE_LIMIT_MS = 5_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = rateMap.get(ip);
  if (last && now - last < RATE_LIMIT_MS) return true;
  rateMap.set(ip, now);
  // Cleanup old entries every 100 requests
  if (rateMap.size > 500) {
    for (const [key, ts] of rateMap) {
      if (now - ts > RATE_LIMIT_MS * 2) rateMap.delete(key);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  /* ── Rate limit ── */
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Please wait a few seconds before trying again." },
      { status: 429 },
    );
  }

  /* ── Parse body ── */
  let description: string;
  let category: string;

  try {
    const body = await req.json();
    description = body.description;
    category = body.category;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (
    typeof description !== "string" ||
    description.length < 30 ||
    description.length > 5000
  ) {
    return NextResponse.json(
      { error: "Description must be between 30 and 5000 characters." },
      { status: 400 },
    );
  }

  if (typeof category !== "string" || !category) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400 },
    );
  }

  /* ── Call Vertex AI Gemini ── */
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT ?? "wbtool-494011",
      location: process.env.VERTEX_AI_LOCATION ?? "us-central1",
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Category: ${category}\n\n${description}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    });

    const formatted = response.text?.trim();

    if (!formatted) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ formatted });
  } catch (err) {
    console.error("[AI Format]", err);
    return NextResponse.json(
      {
        error:
          "Unable to format your description right now. Please try again later.",
      },
      { status: 500 },
    );
  }
}
