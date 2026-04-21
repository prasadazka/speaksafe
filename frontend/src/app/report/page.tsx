"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  AlertTriangle,
  Lock,
  DollarSign,
  Users,
  Scale,
  Database,
  FileWarning,
  HardHat,
  Landmark,
  Leaf,
  ShieldAlert,
  MessageCircle,
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
  FileStack,
  Quote,
  CalendarDays,
  Sparkles,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileDropzone } from "@/components/file-dropzone";
import {
  submitReport,
  uploadEvidence,
  formatDescription,
  scoreSeverity,
} from "@/lib/api";
import { generateReportPdf } from "@/lib/generate-pdf";
import { GridPattern } from "@/components/illustrations";

/* ── Categories ── */
const categories = [
  {
    value: "FRAUD",
    label: "Financial Misconduct",
    desc: "Embezzlement, bribery, expense fraud, accounting irregularities",
    icon: DollarSign,
  },
  {
    value: "HARASSMENT",
    label: "Harassment & Bullying",
    desc: "Workplace bullying, intimidation, hostile behavior",
    icon: Users,
  },
  {
    value: "DISCRIMINATION",
    label: "Discrimination",
    desc: "Bias based on race, gender, age, disability, religion, orientation",
    icon: Scale,
  },
  {
    value: "DATA_MISUSE",
    label: "Data & Privacy Breach",
    desc: "Unauthorized access, data leaks, privacy violations",
    icon: Database,
  },
  {
    value: "POLICY_VIOLATION",
    label: "Policy Violation",
    desc: "Breach of internal policies, code of conduct, or procedures",
    icon: FileWarning,
  },
  {
    value: "SAFETY_CONCERN",
    label: "Health & Safety",
    desc: "Unsafe conditions, unreported incidents, regulatory non-compliance",
    icon: HardHat,
  },
  {
    value: "CORRUPTION",
    label: "Corruption & Bribery",
    desc: "Kickbacks, conflicts of interest, improper gifts, nepotism",
    icon: Landmark,
  },
  {
    value: "ENVIRONMENTAL",
    label: "Environmental Concern",
    desc: "Pollution, illegal dumping, environmental regulatory violations",
    icon: Leaf,
  },
  {
    value: "RETALIATION",
    label: "Retaliation",
    desc: "Punishment for prior reporting, whistleblower intimidation",
    icon: ShieldAlert,
  },
  {
    value: "OTHER",
    label: "Other Concern",
    desc: "Any issue not covered by the categories above",
    icon: MessageCircle,
  },
] as const;

type CategoryValue = (typeof categories)[number]["value"];

/* ── Zod schema ── */
const reportSchema = z.object({
  category: z.enum(
    categories.map((c) => c.value) as [CategoryValue, ...CategoryValue[]],
  ),
  description: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(5000, "Maximum 5 000 characters"),
  occurredAt: z.string().optional(),
  location: z.string().max(200, "Maximum 200 characters").optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

/* ── Step transition variants ── */
const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const TOTAL_STEPS = 4;
const stepLabels = ["Concern Type", "Details", "Evidence", "Review"];

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */
export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    trackingId: string;
    severity: string;
    category: string;
    description: string;
    occurredAt: string;
    location: string;
    fileCount: number;
    submittedAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: undefined,
      description: "",
      occurredAt: "",
      location: "",
    },
    mode: "onChange",
  });

  const category = form.watch("category");
  const description = form.watch("description");

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      setStep(next);
    },
    [step],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const data = form.getValues();

      // AI severity scoring (runs in parallel-safe manner, never blocks)
      const severity = await scoreSeverity(data.description, data.category);

      const res = await submitReport({
        category: data.category,
        description: data.description,
        severity,
        occurred_at: data.occurredAt || null,
        location: data.location || null,
      });

      const reportId = res.data?.id;
      const trackingId = res.data?.tracking_id;

      if (reportId && files.length > 0) {
        for (const file of files) {
          try {
            await uploadEvidence(reportId, file);
          } catch {
            // Evidence upload failure shouldn't block
          }
        }
      }

      setResult({
        trackingId: trackingId ?? "Unknown",
        severity,
        category: data.category,
        description: data.description,
        occurredAt: data.occurredAt || "",
        location: data.location || "",
        fileCount: files.length,
        submittedAt: new Date().toISOString(),
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Success screen ── */
  if (result) {
    const severityConfig: Record<
      string,
      { label: string; color: string; bg: string; border: string }
    > = {
      CRITICAL: {
        label: "Critical",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
      },
      HIGH: {
        label: "High",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
      },
      MEDIUM: {
        label: "Medium",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
      },
      LOW: {
        label: "Low",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
      },
    };
    const sev = severityConfig[result.severity] ?? severityConfig.MEDIUM;

    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <BackgroundDecoration />
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-lg"
          >
            <Card className="bg-card/60 backdrop-blur-md border-border/40 shadow-2xl">
              <CardContent className="pt-8 pb-8">
                {/* Animated checkmark */}
                <div className="relative h-20 w-20 mx-auto mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      delay: 0.1,
                    }}
                    className="absolute inset-0 rounded-full bg-primary/10 animate-glow-pulse"
                  />
                  <svg
                    viewBox="0 0 40 40"
                    className="absolute inset-0 h-full w-full"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      fill="none"
                      stroke="oklch(0.72 0.19 160 / 0.2)"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 20 L18 26 L28 14"
                      fill="none"
                      stroke="oklch(0.72 0.19 160)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-checkmark-draw"
                    />
                  </svg>
                  {/* Particles */}
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60 * Math.PI) / 180;
                    const tx = Math.cos(angle) * 40;
                    const ty = Math.sin(angle) * 40;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{ scale: 1, x: tx, y: ty, opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -ml-0.75 -mt-0.75 rounded-full bg-primary"
                      />
                    );
                  })}
                </div>

                <h1 className="text-2xl font-bold mb-2 text-center">
                  Your Concern Has Been Received
                </h1>
                <p className="text-muted-foreground mb-6 text-center">
                  Your disclosure is now being securely processed. Save your
                  tracking ID to follow up on its progress.
                </p>

                {/* Tracking ID card */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-xl bg-primary/[0.04] border border-primary/20 p-5 mb-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-primary/70 font-semibold uppercase tracking-wider">
                      Your Tracking ID
                    </p>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sev.bg} ${sev.color} ${sev.border} border`}
                    >
                      {sev.label} Priority
                    </motion.div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono font-bold text-primary tracking-wider flex-1">
                      {result.trackingId}
                    </span>
                    <motion.div whileTap={{ scale: 0.92 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyId}
                        className={`gap-1.5 transition-all duration-200 ${
                          copied
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-primary/30 hover:bg-primary/10"
                        }`}
                      >
                        {copied ? (
                          <>
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Download PDF */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    variant="outline"
                    className="w-full mb-4 gap-2 border-border/40 bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-all"
                    onClick={() => generateReportPdf(result)}
                  >
                    <Download className="h-4 w-4 text-primary/70" />
                    Download Report as PDF
                  </Button>
                </motion.div>

                {/* Warning */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-6 flex items-start gap-2 text-left"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">
                    Save this ID now. It is your only way to follow up on this
                    disclosure. We do not store any identifying information.
                  </p>
                </motion.div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link href="/track" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Check Status
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button className="w-full shadow-lg shadow-primary/20">
                      Done
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ── Wizard ── */
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 relative z-10">
        {/* Premium stepper */}
        <Stepper current={step} />

        {/* Animated step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && (
              <StepCategory
                value={category}
                onSelect={(v) => {
                  form.setValue("category", v, { shouldValidate: true });
                }}
                onNext={() => goTo(2)}
              />
            )}

            {step === 2 && (
              <StepDetails
                form={form}
                description={description}
                category={category}
                onBack={() => goTo(1)}
                onNext={() => goTo(3)}
              />
            )}

            {step === 3 && (
              <StepEvidence
                files={files}
                onChange={setFiles}
                onBack={() => goTo(2)}
                onNext={() => goTo(4)}
              />
            )}

            {step === 4 && (
              <StepReview
                form={form}
                files={files}
                confirmed={confirmed}
                onToggleConfirm={() => setConfirmed((c) => !c)}
                submitting={submitting}
                submitError={submitError}
                onBack={() => goTo(3)}
                onSubmit={handleSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Background Decoration
   ═══════════════════════════════════════════════════════════════════ */
function BackgroundDecoration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <GridPattern />
      </div>
      {/* Emerald orb top-right */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      {/* Smaller orb bottom-left */}
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Header
   ═══════════════════════════════════════════════════════════════════ */
function Header() {
  return (
    <header className="relative border-b border-border/40 bg-card/60 backdrop-blur-md z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          <span className="text-lg font-bold tracking-tight">SpeakSafe</span>
        </Link>
        <Badge
          variant="secondary"
          className="gap-1.5 bg-primary/5 border-primary/20 text-primary/90"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Lock className="h-3 w-3" />
          </motion.div>
          Anonymous & Encrypted
        </Badge>
      </div>
      {/* Subtle glow line under header */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Premium Stepper
   ═══════════════════════════════════════════════════════════════════ */
function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          const isFuture = stepNum > current;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  layout
                  className={`relative h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary text-primary-foreground shadow-[0_0_16px_oklch(0.72_0.19_160_/_0.3)]"
                      : isCurrent
                        ? "bg-transparent border-2 border-primary text-primary animate-glow-pulse"
                        : "bg-muted/50 border border-border/60 text-muted-foreground/50"
                  }`}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    stepNum
                  )}
                </motion.div>
                {/* Label */}
                <span
                  className={`mt-2 text-[11px] font-medium transition-colors hidden sm:block ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-primary/70"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {stepNum < TOTAL_STEPS && (
                <div className="flex-1 h-[2px] mx-3 rounded-full overflow-hidden bg-border/40 mt-[-20px] sm:mt-0 sm:-translate-y-3">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={false}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 1: Category
   ═══════════════════════════════════════════════════════════════════ */
function StepCategory({
  value,
  onSelect,
  onNext,
}: {
  value: CategoryValue | undefined;
  onSelect: (v: CategoryValue) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        What type of concern?
      </h1>
      <p className="text-base text-muted-foreground mb-8">
        Select the category that best describes the issue you&apos;d like to
        raise.
      </p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const selected = value === cat.value;
          return (
            <motion.button
              key={cat.value}
              type="button"
              onClick={() => onSelect(cat.value)}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative text-left p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                selected
                  ? "border-primary/60 bg-primary/[0.07] shadow-[0_0_24px_oklch(0.72_0.19_160_/_0.12)] ring-1 ring-primary/30"
                  : "border-border/40 bg-card/40 hover:border-primary/30 hover:bg-card/60"
              }`}
            >
              {/* Selected check badge */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                    selected
                      ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-inner"
                      : "bg-muted/50 text-muted-foreground group-hover:text-primary/70 group-hover:bg-primary/5"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="pr-5">
                  <div
                    className={`font-semibold text-sm transition-colors ${
                      selected ? "text-primary" : ""
                    }`}
                  >
                    {cat.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {cat.desc}
                  </div>
                </div>
              </div>

              {/* Left accent bar on selected */}
              {selected && (
                <motion.div
                  layoutId="category-accent"
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Security reassurance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center gap-2.5 text-xs text-muted-foreground bg-card/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-border/30"
      >
        <Shield className="h-4 w-4 text-primary/60 shrink-0" />
        Your identity remains fully anonymous throughout this process.
      </motion.div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={onNext}
          disabled={!value}
          size="lg"
          className="px-6 shadow-lg shadow-primary/20"
        >
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 2: Details
   ═══════════════════════════════════════════════════════════════════ */
function StepDetails({
  form,
  description,
  category,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<ReportFormData>>;
  description: string;
  category: string | undefined;
  onBack: () => void;
  onNext: () => void;
}) {
  const descError = form.formState.errors.description;
  const charCount = description?.length ?? 0;
  const charPercent = Math.min((charCount / 5000) * 100, 100);

  const occurredAt = form.watch("occurredAt");
  const selectedDate = useMemo(() => {
    if (!occurredAt) return undefined;
    const d = new Date(occurredAt + "T00:00:00");
    return isNaN(d.getTime()) ? undefined : d;
  }, [occurredAt]);

  const [dateOpen, setDateOpen] = useState(false);

  /* ── AI formatting state ── */
  const [aiFormatted, setAiFormatted] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiFormat = useCallback(async () => {
    if (!description || description.length < 30 || !category) return;
    setAiLoading(true);
    setAiError(null);
    setAiFormatted(null);
    try {
      const result = await formatDescription(description, category);
      setAiFormatted(result);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Formatting failed. Try again.",
      );
    } finally {
      setAiLoading(false);
    }
  }, [description, category]);

  const acceptAiText = () => {
    if (aiFormatted) {
      form.setValue("description", aiFormatted, { shouldValidate: true });
    }
    setAiFormatted(null);
    setAiError(null);
  };

  const dismissAiText = () => {
    setAiFormatted(null);
    setAiError(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        Describe the situation
      </h1>
      <p className="text-base text-muted-foreground mb-8">
        Provide as much detail as you can. Every piece of information helps
        ensure a thorough review.
      </p>

      <Card className="bg-card/40 backdrop-blur-sm border-border/40">
        <CardContent className="pt-6 space-y-6">
          {/* Description */}
          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              What happened? <span className="text-destructive">*</span>
            </label>
            <Textarea
              {...form.register("description")}
              placeholder="Describe the situation in detail — what happened, when it occurred, where it took place, and who was involved. Include dates, times, locations, and any witnesses if possible. The more detail you provide, the more effectively we can investigate..."
              rows={12}
              className="resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors min-h-[240px]"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {descError ? (
                  <p className="text-xs text-destructive">
                    {descError.message}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      aiLoading || charCount < 30 || !category || !!aiFormatted
                    }
                    onClick={handleAiFormat}
                    className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {aiLoading ? "Formatting..." : "Format with AI"}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Mini progress ring */}
                <svg className="h-4 w-4 -rotate-90" viewBox="0 0 20 20">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-border/40"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${charPercent * 0.5} 50`}
                    strokeLinecap="round"
                    className={
                      charPercent > 90 ? "text-destructive" : "text-primary/60"
                    }
                  />
                </svg>
                <p className="text-xs text-muted-foreground">
                  {charCount.toLocaleString()}/5,000
                </p>
              </div>
            </div>

            {/* AI error */}
            <AnimatePresence>
              {aiError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2 text-xs text-destructive"
                >
                  {aiError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* AI formatted preview */}
            <AnimatePresence>
              {aiFormatted && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="rounded-xl border border-primary/30 bg-primary/[0.04] backdrop-blur-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        AI-formatted version
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        Review before accepting
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[280px] overflow-y-auto pr-2">
                      {aiFormatted}
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-primary/10">
                      <Button
                        type="button"
                        size="sm"
                        onClick={acceptAiText}
                        className="h-8 gap-1.5 text-xs shadow-md shadow-primary/20"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Use this version
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={dismissAiText}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Keep original
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* When — Date Picker */}
          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              When did this happen?
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                className="inline-flex h-10 max-w-xs w-full items-center justify-start gap-2 rounded-md border border-border/50 bg-background/50 px-3 text-sm transition-colors hover:bg-accent/30 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                {selectedDate ? (
                  <span>
                    {selectedDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Pick a date</span>
                )}
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto p-0 bg-card border-border/60"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (day) {
                      const yyyy = day.getFullYear();
                      const mm = String(day.getMonth() + 1).padStart(2, "0");
                      const dd = String(day.getDate()).padStart(2, "0");
                      form.setValue("occurredAt", `${yyyy}-${mm}-${dd}`);
                    } else {
                      form.setValue("occurredAt", "");
                    }
                    setDateOpen(false);
                  }}
                  disabled={{ after: new Date() }}
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Where */}
          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Where did this occur?
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </label>
            <Input
              {...form.register("location")}
              placeholder="Office, department, location..."
              className="max-w-md bg-background/50 border-border/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security reassurance */}
      <div className="mt-6 flex items-center gap-2.5 text-xs text-muted-foreground bg-card/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-border/30">
        <Lock className="h-4 w-4 text-primary/60 shrink-0" />
        All information is end-to-end encrypted and stored anonymously.
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!description || description.length < 10}
          size="lg"
          className="px-6 shadow-lg shadow-primary/20"
        >
          Continue <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 3: Evidence
   ═══════════════════════════════════════════════════════════════════ */
function StepEvidence({
  files,
  onChange,
  onBack,
  onNext,
}: {
  files: File[];
  onChange: (f: File[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        Attach Supporting Evidence
      </h1>
      <p className="text-base text-muted-foreground mb-8">
        Upload any documents, screenshots, or files that support your
        disclosure. This step is optional.
      </p>

      <FileDropzone files={files} onChange={onChange} />

      {/* Security reassurance */}
      <div className="mt-6 flex items-center gap-2.5 text-xs text-muted-foreground bg-card/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-border/30">
        <Lock className="h-4 w-4 text-primary/60 shrink-0" />
        Files are encrypted before leaving your device and stored securely.
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="px-6 shadow-lg shadow-primary/20"
        >
          {files.length === 0 ? "Skip" : "Continue"}{" "}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Step 4: Review
   ═══════════════════════════════════════════════════════════════════ */
function StepReview({
  form,
  files,
  confirmed,
  onToggleConfirm,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<ReportFormData>>;
  files: File[];
  confirmed: boolean;
  onToggleConfirm: () => void;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const data = form.getValues();
  const cat = categories.find((c) => c.value === data.category);
  const CatIcon = cat?.icon ?? MessageCircle;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
        Review Your Disclosure
      </h1>
      <p className="text-base text-muted-foreground mb-8">
        Please review the details below before submitting.
      </p>

      <Card className="bg-card/40 backdrop-blur-sm border-border/40 overflow-hidden">
        <CardContent className="pt-6 space-y-0 divide-y divide-border/30">
          {/* Category */}
          <div className="pb-5 flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full bg-primary/60 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                Concern Type
              </p>
              <Badge
                variant="secondary"
                className="gap-2 bg-primary/10 border-primary/20 text-primary px-3 py-1.5 text-sm"
              >
                <CatIcon className="h-3.5 w-3.5" />
                {cat?.label}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="py-5 flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full bg-primary/30 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                Description
              </p>
              <div className="relative bg-background/30 rounded-lg p-4 border border-border/20">
                <Quote className="absolute top-3 right-3 h-4 w-4 text-muted-foreground/20" />
                <p className="text-sm leading-relaxed whitespace-pre-wrap pr-6">
                  {data.description}
                </p>
              </div>
            </div>
          </div>

          {/* Date & location */}
          {(data.occurredAt || data.location) && (
            <div className="py-5 flex items-start gap-3">
              <div className="w-1 self-stretch rounded-full bg-primary/20 shrink-0" />
              <div className="grid grid-cols-2 gap-4 flex-1">
                {data.occurredAt && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                      When
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {(() => {
                        const d = new Date(data.occurredAt + "T00:00:00");
                        return isNaN(d.getTime())
                          ? data.occurredAt
                          : d.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            });
                      })()}
                    </div>
                  </div>
                )}
                {data.location && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                      Where
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {data.location}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evidence */}
          <div className="pt-5 flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full bg-primary/10 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">
                Evidence
              </p>
              <div className="flex items-center gap-2 text-sm">
                <FileStack className="h-4 w-4 text-muted-foreground" />
                {files.length === 0
                  ? "No files attached"
                  : `${files.length} file${files.length > 1 ? "s" : ""} attached`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm toggle card */}
      <button
        type="button"
        onClick={onToggleConfirm}
        className={`mt-5 w-full flex items-start gap-3 text-left rounded-xl border p-4 transition-all duration-200 ${
          confirmed
            ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_16px_oklch(0.72_0.19_160_/_0.08)]"
            : "border-border/40 bg-card/30 hover:border-border/60"
        }`}
      >
        <div
          className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
            confirmed
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          }`}
        >
          {confirmed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check className="h-3 w-3 text-primary-foreground" />
            </motion.div>
          )}
        </div>
        <span className="text-sm text-muted-foreground leading-relaxed">
          I confirm that the information provided is truthful to the best of my
          knowledge. I understand this submission is fully anonymous and
          encrypted.
        </span>
      </button>

      {/* Error */}
      {submitError && (
        <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          size="lg"
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Edit
        </Button>
        <Button
          onClick={onSubmit}
          size="lg"
          className="px-8 shadow-lg shadow-primary/20"
          disabled={!confirmed || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" /> Submit Securely
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
