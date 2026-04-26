import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const VALID_TONES = [
  "FEAR_THREAT",
  "DISTRESS",
  "ANGER",
  "DESPERATION",
  "CONCERN",
  "NEUTRAL",
] as const;

const VALID_URGENCIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const SYSTEM_PROMPT = `You are a sentiment analysis specialist for an anonymous whistleblowing platform.

Your task is to analyze the emotional tone and urgency of a reported concern based on the description provided. The report may be in ANY language (English, Arabic, Telugu, French, Hindi, etc.) — analyze the sentiment regardless of language.

Classify the report into exactly ONE emotional tone:

- FEAR_THREAT: Reporter expresses fear for their safety, mentions threats, intimidation, or danger to themselves or others. Signals: afraid, threatened, scared, danger, retaliation, harm, worried about consequences.
- DISTRESS: Reporter is deeply upset, traumatized, or emotionally overwhelmed. Signals: devastated, can't sleep, crying, broken, helpless, traumatic, suffering.
- ANGER: Reporter is frustrated, outraged, or indignant about injustice. Signals: furious, unacceptable, disgusting, outraged, how dare they, fed up.
- DESPERATION: Reporter feels trapped, has tried other channels, or this is a last resort. Signals: no one listens, last hope, nowhere to turn, been ignored, exhausted all options, begging.
- CONCERN: Reporter is worried but measured, raising an issue professionally. Signals: concerned, noticed, want to flag, seems inappropriate, potential issue, bringing to attention.
- NEUTRAL: Reporter is factual, clinical, or detached — simply documenting facts without visible emotion. Signals: reporting that, on [date], for the record, observed, documenting.

Then derive an urgency level based on the tone:
- CRITICAL: FEAR_THREAT or DESPERATION tone
- HIGH: DISTRESS or ANGER tone
- MEDIUM: CONCERN tone
- LOW: NEUTRAL tone

Rules:
1. Base your assessment ONLY on the language and emotional signals in the text. Do not assume facts not present.
2. When in doubt between two tones, choose the more emotionally intense one — err on the side of caution.
3. The summary MUST be 1-2 sentences explaining the key emotional signals you detected.
4. Respond with VALID JSON ONLY — no markdown fences, no explanation outside the JSON.

Response format:
{"tone":"TONE_VALUE","urgency":"URGENCY_VALUE","summary":"Brief explanation"}`;

const FALLBACK = { tone: "NEUTRAL" as const, urgency: "LOW" as const, summary: "" };

export async function POST(req: NextRequest) {
  let description: string;

  try {
    const body = await req.json();
    description = body.description;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (typeof description !== "string" || description.length < 10) {
    return NextResponse.json(
      { error: "Description must be at least 10 characters." },
      { status: 400 },
    );
  }

  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT ?? "wbtool-494011",
      location: process.env.VERTEX_AI_LOCATION ?? "us-central1",
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: description,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    });

    const raw = response.text?.trim() ?? "";
    // Strip markdown fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?\s*```$/, "");
    const parsed = JSON.parse(cleaned);

    const tone = VALID_TONES.includes(parsed.tone) ? parsed.tone : "NEUTRAL";
    const urgency = VALID_URGENCIES.includes(parsed.urgency)
      ? parsed.urgency
      : "LOW";
    const summary =
      typeof parsed.summary === "string"
        ? parsed.summary.slice(0, 300)
        : "";

    return NextResponse.json({
      sentiment: { tone, urgency, summary },
    });
  } catch (err) {
    console.error("[AI Sentiment]", err);
    // Fallback: never block submission
    return NextResponse.json({ sentiment: FALLBACK });
  }
}
