import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SYSTEM_PROMPT = `You are a senior compliance intelligence analyst. A compliance officer is reviewing a whistleblower report and needs data-driven insights based on ALL reports in the system.

You will receive:
1. THE CURRENT REPORT — full description, category, severity, status.
2. ALL OTHER REPORTS — full descriptions, categories, severities, statuses, tracking IDs.

Analyze the current report by cross-referencing it against every other report in the database.

CRITICAL INSTRUCTIONS:
- Compare DESCRIPTIONS carefully. Look for mentions of the same people, departments, locations, monetary amounts, dates, or types of misconduct.
- Two reports are "related" ONLY if they share specific details — same person named, same department, same incident type in the same location, or same time period. Do NOT relate reports simply because they share a category.
- Read each description word by word. Extract names, places, departments, amounts, dates. Match them across reports.
- If the same individual is named in multiple reports, that is a strong pattern signal.
- Count distinct reporters: each report comes from a different anonymous person (the platform is anonymous — every report = 1 unique reporter).

RESPOND WITH VALID JSON ONLY — no markdown fences, no explanation text.

{
  "relatedCases": [
    { "trackingId": "SS-XXXX-XXXX", "relevance": "Both reports name [person/dept] and describe [specific overlap]" }
  ],
  "patternAnalysis": {
    "isPattern": boolean,
    "summary": "Explain what recurring behavior was found, citing specific evidence from the reports. If none, say so clearly."
  },
  "victimEstimate": {
    "count": number,
    "confidence": "LOW" | "MEDIUM" | "HIGH",
    "reasoning": "Based on X reports from different reporters describing similar issues"
  },
  "credibilitySignals": {
    "level": "LOW" | "MEDIUM" | "HIGH",
    "factors": ["Each factor cites specific evidence from the report text"]
  },
  "recommendedActions": ["Specific professional actions — name departments, people, evidence types to investigate"]
}

Credibility criteria:
- HIGH: Multiple independent reports corroborate the same facts, or single report with highly specific details (exact dates, names, amounts, locations)
- MEDIUM: Moderate specificity, some corroboration, or plausible account with partial details
- LOW: Vague allegations, no specifics, single unverifiable claim, or inconsistencies`;

interface ReportData {
  tracking_id: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  location?: string | null;
  occurred_at?: string | null;
  created_at?: string;
}

export async function POST(req: NextRequest) {
  let token: string;
  let reportId: string;
  let description: string;
  let category: string;
  let severity: string;
  let status: string;
  let location: string | null;
  let occurredAt: string | null;

  try {
    const body = await req.json();
    token = body.token;
    reportId = body.reportId;
    description = body.description;
    category = body.category;
    severity = body.severity;
    status = body.status ?? "OPEN";
    location = body.location ?? null;
    occurredAt = body.occurredAt ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!token || !reportId || !description || !category) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  /* ── Fetch ALL reports from backend (admin-authenticated) ── */
  let allReports: ReportData[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/v1/reports?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      const reports = json.data ?? [];
      allReports = (Array.isArray(reports) ? reports : [])
        .filter((r: ReportData) => r.tracking_id)
        .map((r: ReportData) => ({
          tracking_id: r.tracking_id,
          category: r.category,
          severity: r.severity,
          status: r.status,
          description: r.description ?? "",
          location: r.location,
          occurred_at: r.occurred_at,
          created_at: r.created_at,
        }));
    }
  } catch {
    /* proceed with only the current report */
  }

  /* Separate current report from others */
  const otherReports = allReports.filter((r) => r.tracking_id !== reportId);

  /* ── Build data-rich prompt ── */
  const currentSection = [
    "═══ CURRENT REPORT (under review) ═══",
    `Tracking ID: ${reportId}`,
    `Category: ${category}`,
    `Severity: ${severity}`,
    `Status: ${status}`,
    location ? `Location: ${location}` : null,
    occurredAt ? `Date of incident: ${occurredAt}` : null,
    "",
    "Full description:",
    description,
  ].filter(Boolean).join("\n");

  let othersSection: string;
  if (otherReports.length > 0) {
    const entries = otherReports.map((r, i) => [
      `── Report ${i + 1}: ${r.tracking_id} ──`,
      `Category: ${r.category} | Severity: ${r.severity} | Status: ${r.status}`,
      r.location ? `Location: ${r.location}` : null,
      r.occurred_at ? `Date of incident: ${r.occurred_at}` : null,
      r.created_at ? `Submitted: ${r.created_at.split("T")[0]}` : null,
      "",
      "Description:",
      r.description || "(no description)",
    ].filter(Boolean).join("\n"));

    othersSection = `\n\n═══ ALL OTHER REPORTS IN DATABASE (${otherReports.length} total) ═══\n\n${entries.join("\n\n")}`;
  } else {
    othersSection = "\n\n═══ ALL OTHER REPORTS IN DATABASE ═══\nNo other reports exist in the system yet. Analyze the current report on its own merits.";
  }

  const prompt = currentSection + othersSection;

  /* ── Call Gemini ── */
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT ?? "wbtool-494011",
      location: process.env.VERTEX_AI_LOCATION ?? "us-central1",
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.15,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text?.trim() ?? "";

    /* Parse JSON — strip code fences if Gemini wraps them */
    const cleaned = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
    let insights: Record<string, unknown>;
    try {
      insights = JSON.parse(cleaned);
    } catch {
      console.error("[AI Patterns] Invalid JSON from model:", cleaned.slice(0, 200));
      return NextResponse.json(
        { error: "AI returned an unparseable response. Please try again." },
        { status: 502 },
      );
    }

    if (
      !insights ||
      typeof insights !== "object" ||
      !("patternAnalysis" in insights) ||
      !("credibilitySignals" in insights)
    ) {
      console.error("[AI Patterns] Unexpected shape:", JSON.stringify(insights).slice(0, 200));
      return NextResponse.json(
        { error: "AI returned an unexpected response format. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[AI Patterns]", err);
    return NextResponse.json(
      { error: "Unable to generate insights right now. Please try again." },
      { status: 500 },
    );
  }
}
