import { jsPDF } from "jspdf";

interface ReportData {
  trackingId: string;
  severity: string;
  category: string;
  description: string;
  occurredAt: string;
  location: string;
  fileCount: number;
  submittedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  FRAUD: "Financial Misconduct",
  HARASSMENT: "Harassment & Bullying",
  DISCRIMINATION: "Discrimination",
  DATA_MISUSE: "Data & Privacy Breach",
  POLICY_VIOLATION: "Policy Violation",
  SAFETY_CONCERN: "Health & Safety",
  CORRUPTION: "Corruption & Bribery",
  ENVIRONMENTAL: "Environmental Concern",
  RETALIATION: "Retaliation",
  OTHER: "Other Concern",
};

// Theme colors
const GREEN = { r: 0, g: 101, b: 62 }; // #00653E
const BLACK = { r: 0, g: 0, b: 0 };
const GRAY_63 = { r: 99, g: 99, b: 99 }; // #636363
const GRAY_90 = { r: 144, g: 144, b: 144 }; // #909090
const GRAY_BE = { r: 190, g: 190, b: 190 }; // #BEBEBE
const GRAY_EB = { r: 235, g: 235, b: 235 }; // #EBEBEB
const BG_LIGHT = { r: 249, g: 253, b: 251 }; // #F9FDFB
const WHITE = { r: 255, g: 255, b: 255 };

export function generateReportPdf(data: ReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  /* ── Page background ── */
  doc.setFillColor(BG_LIGHT.r, BG_LIGHT.g, BG_LIGHT.b);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  /* ══════════════════════════════════════════════
     Header — Green bar
     ══════════════════════════════════════════════ */
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.rect(0, 0, pageWidth, 44, "F");

  // Brand name
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.text("Sawt Safe", margin, 18);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  doc.text("Confidential Disclosure Report", margin, 26);

  // Date on right
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Generated: ${formatDate(data.submittedAt)}`,
    pageWidth - margin,
    18,
    { align: "right" },
  );

  // Shield icon placeholder — small circle with checkmark
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth - margin - 2, 30, 5, "F");
  doc.setFontSize(8);
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.setFont("helvetica", "bold");
  doc.text("\u2713", pageWidth - margin - 3.8, 32);

  y = 56;

  /* ══════════════════════════════════════════════
     Tracking ID Card
     ══════════════════════════════════════════════ */
  // Card background
  doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");
  // Card border
  doc.setDrawColor(GRAY_EB.r, GRAY_EB.g, GRAY_EB.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "S");

  // Left green accent bar
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.roundedRect(margin, y, 3, 28, 1.5, 1.5, "F");

  // "YOUR TRACKING ID" label
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
  doc.text("YOUR TRACKING ID", margin + 10, y + 9);

  // Tracking ID value
  doc.setFontSize(18);
  doc.setFont("courier", "bold");
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(data.trackingId, margin + 10, y + 22);

  // Severity badge on the right
  const severityColors: Record<string, { r: number; g: number; b: number }> = {
    CRITICAL: { r: 220, g: 50, b: 50 },
    HIGH: { r: 230, g: 120, b: 40 },
    MEDIUM: { r: 200, g: 160, b: 30 },
    LOW: GREEN,
  };
  const sevColor = severityColors[data.severity] ?? GRAY_90;
  const badgeText = `${data.severity} PRIORITY`;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const badgeW = doc.getTextWidth(badgeText) + 10;

  // Badge pill
  doc.setDrawColor(sevColor.r, sevColor.g, sevColor.b);
  doc.setLineWidth(0.4);
  doc.roundedRect(
    pageWidth - margin - badgeW - 6,
    y + 8,
    badgeW,
    10,
    5,
    5,
    "S",
  );
  doc.setTextColor(sevColor.r, sevColor.g, sevColor.b);
  doc.text(
    badgeText,
    pageWidth - margin - badgeW / 2 - 6,
    y + 14.5,
    { align: "center" },
  );

  y += 38;

  /* ══════════════════════════════════════════════
     Report Details Section
     ══════════════════════════════════════════════ */
  y = drawSectionHeader(doc, "Report Details", margin, y);

  // Details card
  const detailsStartY = y;
  const fields: [string, string][] = [
    ["Category", CATEGORY_LABELS[data.category] ?? data.category],
  ];
  if (data.occurredAt) {
    fields.push(["Date of Incident", formatDateShort(data.occurredAt)]);
  }
  if (data.location) {
    fields.push(["Location", data.location]);
  }
  fields.push(["Evidence Files", `${data.fileCount} file(s) attached`]);

  const cardH = fields.length * 14 + 6;

  // Card bg
  doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
  doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, "F");
  doc.setDrawColor(GRAY_EB.r, GRAY_EB.g, GRAY_EB.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, cardH, 3, 3, "S");

  y += 6;
  for (const [label, value] of fields) {
    y = drawField(doc, label, value, margin, y, contentWidth);
  }
  y = detailsStartY + cardH + 8;

  /* ══════════════════════════════════════════════
     Description Section
     ══════════════════════════════════════════════ */
  y = drawSectionHeader(doc, "Description of Concern", margin, y);

  // Calculate description height for card
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(data.description, contentWidth - 16);
  const descH = descLines.length * 5.5 + 12;

  // Description card
  doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
  doc.roundedRect(margin, y, contentWidth, descH, 3, 3, "F");
  doc.setDrawColor(GRAY_EB.r, GRAY_EB.g, GRAY_EB.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, descH, 3, 3, "S");

  doc.setTextColor(GRAY_63.r, GRAY_63.g, GRAY_63.b);
  let descY = y + 8;
  for (const line of descLines) {
    if (descY > pageHeight - 30) {
      doc.addPage();
      // Repeat background on new page
      doc.setFillColor(BG_LIGHT.r, BG_LIGHT.g, BG_LIGHT.b);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      descY = 20;
    }
    doc.text(line, margin + 8, descY);
    descY += 5.5;
  }
  y = descY + 8;

  /* ══════════════════════════════════════════════
     Warning Banner
     ══════════════════════════════════════════════ */
  if (y > pageHeight - 50) {
    doc.addPage();
    doc.setFillColor(BG_LIGHT.r, BG_LIGHT.g, BG_LIGHT.b);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    y = 20;
  }

  // Red warning box
  doc.setFillColor(254, 242, 242); // red-50
  doc.roundedRect(margin, y, contentWidth, 16, 3, 3, "F");
  doc.setDrawColor(252, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 16, 3, 3, "S");

  // Warning triangle (text symbol)
  doc.setFontSize(10);
  doc.setTextColor(220, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("\u26A0", margin + 6, y + 10);

  // Warning text
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 40, 40);
  doc.text(
    "Save your Tracking ID. It is your only way to follow up on this disclosure.",
    margin + 14,
    y + 10,
  );

  y += 26;

  /* ══════════════════════════════════════════════
     Footer
     ══════════════════════════════════════════════ */
  if (y > pageHeight - 30) {
    doc.addPage();
    doc.setFillColor(BG_LIGHT.r, BG_LIGHT.g, BG_LIGHT.b);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    y = 20;
  }

  // Separator
  doc.setDrawColor(GRAY_EB.r, GRAY_EB.g, GRAY_EB.b);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(GRAY_BE.r, GRAY_BE.g, GRAY_BE.b);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This document is confidential. Generated by Sawt Safe — Secure Reporting Platform.",
    margin,
    y,
  );
  y += 3.5;
  doc.text(
    "Do not share with unauthorized individuals. Store securely.",
    margin,
    y,
  );

  // Green bottom bar
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
    doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
  }

  /* ── Save ── */
  doc.save(`SawtSafe-Report-${data.trackingId}.pdf`);
}

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  margin: number,
  y: number,
): number {
  // Green accent dot
  doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
  doc.circle(margin + 3, y + 3, 2, "F");

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(title, margin + 9, y + 5.5);

  return y + 14;
}

function drawField(
  doc: jsPDF,
  label: string,
  value: string,
  margin: number,
  y: number,
  _contentWidth: number,
): number {
  // Label
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(GRAY_90.r, GRAY_90.g, GRAY_90.b);
  doc.text(label.toUpperCase(), margin + 8, y + 2);

  // Value
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(value, margin + 8, y + 8);

  // Subtle divider
  doc.setDrawColor(GRAY_EB.r, GRAY_EB.g, GRAY_EB.b);
  doc.setLineWidth(0.15);
  doc.line(margin + 8, y + 11, margin + _contentWidth - 8, y + 11);

  return y + 14;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
