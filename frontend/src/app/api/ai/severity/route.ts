import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are a compliance triage analyst for an anonymous whistleblowing platform.

Your task is to assess the severity of a reported concern based on the category and description provided. Assign exactly ONE severity level:

- CRITICAL: Imminent danger to life, large-scale fraud (>$100K), active data breach exposing thousands, ongoing physical violence or sexual assault, evidence of systemic cover-up by senior leadership.
- HIGH: Significant financial loss, repeated harassment or discrimination affecting multiple people, serious regulatory violations, data privacy breach, retaliation against a whistleblower, safety hazards likely to cause injury.
- MEDIUM: Policy violations without immediate harm, isolated incidents of misconduct, minor financial irregularities, procedural non-compliance, workplace conflicts that have not escalated.
- LOW: Minor policy infractions, general complaints without specific incidents, suggestions for improvement, vague or unsubstantiated concerns, single low-impact events.

Rules:
1. Base your assessment ONLY on the information provided. Do not assume facts.
2. When in doubt between two levels, choose the higher one — err on the side of caution.
3. Respond with ONLY the severity level as a single word: CRITICAL, HIGH, MEDIUM, or LOW.
4. Do not include any explanation, punctuation, or additional text.`;

export async function POST(req: NextRequest) {
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

  if (typeof description !== "string" || description.length < 10) {
    return NextResponse.json(
      { error: "Description must be at least 10 characters." },
      { status: 400 },
    );
  }

  if (typeof category !== "string" || !category) {
    return NextResponse.json(
      { error: "Category is required." },
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
      contents: `Category: ${category}\n\n${description}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 10,
      },
    });

    const raw = response.text?.trim().toUpperCase() ?? "";
    const valid = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const severity = valid.includes(raw) ? raw : "MEDIUM";

    return NextResponse.json({ severity });
  } catch (err) {
    console.error("[AI Severity]", err);
    // Fallback: don't block submission — default to MEDIUM
    return NextResponse.json({ severity: "MEDIUM" });
  }
}
