"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  CalendarDays,
  Sparkles,
  Download,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/illustrations";

/* ── Categories (value, icon, image are hardcoded; label/desc come from t()) ── */
const categoryDefs = [
  {
    value: "FRAUD" as const,
    icon: DollarSign,
    image: "/images/illustrations/cash.png",
  },
  {
    value: "HARASSMENT" as const,
    icon: Users,
    image: "/images/illustrations/speak.png",
  },
  {
    value: "DISCRIMINATION" as const,
    icon: Scale,
    image: "/images/illustrations/justice.png",
  },
  {
    value: "DATA_MISUSE" as const,
    icon: Database,
    image: "/images/illustrations/data-storage.png",
  },
  {
    value: "POLICY_VIOLATION" as const,
    icon: FileWarning,
    image: "/images/illustrations/privacy-policy.png",
  },
  {
    value: "SAFETY_CONCERN" as const,
    icon: HardHat,
    image: "/images/illustrations/healthcare.png",
  },
  {
    value: "CORRUPTION" as const,
    icon: Landmark,
    image: "/images/illustrations/money.png",
  },
  {
    value: "ENVIRONMENTAL" as const,
    icon: Leaf,
    image: "/images/illustrations/earth.png",
  },
  {
    value: "RETALIATION" as const,
    icon: ShieldAlert,
    image: "/images/illustrations/unprotected.png",
  },
  {
    value: "OTHER" as const,
    icon: MessageCircle,
    image: "/images/illustrations/chatting.png",
  },
] as const;

type CategoryValue = (typeof categoryDefs)[number]["value"];

type ReportFormData = {
  category: CategoryValue;
  description: string;
  occurredAt?: string;
  location?: string;
};

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

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */
export default function ReportPage() {
  const t = useTranslations("report");
  const tc = useTranslations("common");

  const stepLabels = [
    t("stepLabels.0"),
    t("stepLabels.1"),
    t("stepLabels.2"),
    t("stepLabels.3"),
  ];

  /* ── Zod schema built inside component so t() can be used ── */
  const reportSchema = useMemo(
    () =>
      z.object({
        category: z.enum(
          categoryDefs.map((c) => c.value) as [CategoryValue, ...CategoryValue[]],
        ),
        description: z
          .string()
          .min(10, t("validation.descriptionMin"))
          .max(5000, t("validation.descriptionMax")),
        occurredAt: z.string().optional(),
        location: z
          .string()
          .max(200, t("validation.locationMax"))
          .optional(),
      }),
    [t],
  );

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
          : t("error.generic"),
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
        label: t("severity.CRITICAL"),
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
      },
      HIGH: {
        label: t("severity.HIGH"),
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
      },
      MEDIUM: {
        label: t("severity.MEDIUM"),
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
      },
      LOW: {
        label: t("severity.LOW"),
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
      },
    };
    const sev = severityConfig[result.severity] ?? severityConfig.MEDIUM;

    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <BackgroundDecoration />
        <Header tc={tc} t={t} />
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
                  {t("success.title")}
                </h1>
                <p className="text-muted-foreground mb-6 text-center">
                  {t("success.subtitle")}
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
                      {t("success.trackingIdLabel")}
                    </p>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sev.bg} ${sev.color} ${sev.border} border`}
                    >
                      {t("success.priority", { level: sev.label })}
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
                            <span className="text-xs">{t("success.copied")}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-xs">{t("success.copy")}</span>
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
                    {t("success.downloadPdf")}
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
                    {t("success.warningText")}
                  </p>
                </motion.div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link href="/track" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t("success.checkStatus")}
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button className="w-full shadow-lg shadow-primary/20">
                      {t("success.done")}
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
      <Header tc={tc} t={t} />

      <main className={cn("flex-1 mx-auto w-full px-4 relative z-10 transition-all duration-300", step === 4 ? "py-6" : "py-10", step <= 4 ? "max-w-6xl" : "max-w-2xl")}>
        {/* Premium stepper */}
        <Stepper current={step} stepLabels={stepLabels} />

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
                t={t}
              />
            )}

            {step === 2 && (
              <StepDetails
                form={form}
                description={description}
                category={category}
                onBack={() => goTo(1)}
                onNext={() => goTo(3)}
                t={t}
              />
            )}

            {step === 3 && (
              <StepEvidence
                files={files}
                onChange={setFiles}
                onBack={() => goTo(2)}
                onNext={() => goTo(4)}
                t={t}
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
                t={t}
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
function Header({
  tc,
  t,
}: {
  tc: ReturnType<typeof useTranslations>;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <header className="relative border-b border-border/40 bg-card/60 backdrop-blur-md z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Shield className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          <span className="text-lg font-bold tracking-tight">{tc("brand")}</span>
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
          {t("header.badge")}
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
function Stepper({
  current,
  stepLabels,
}: {
  current: number;
  stepLabels: string[];
}) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Circle + Label */}
              <div className="flex flex-col items-center">
                <motion.div
                  layout
                  className={cn(
                    "relative h-[42px] w-[42px] sm:h-[53px] sm:w-[53px] rounded-full flex items-center justify-center text-base sm:text-2xl transition-all duration-300",
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-2 border-primary text-primary"
                        : "border border-border text-muted-foreground/50",
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.div>
                  ) : (
                    stepNum
                  )}
                </motion.div>
                <span
                  className={cn(
                    "mt-2 text-xs sm:text-base font-normal transition-colors hidden sm:block",
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-primary/70"
                        : "text-muted-foreground/40",
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {stepNum < TOTAL_STEPS && (
                <div className="flex-1 h-[2px] mx-3 sm:mx-4 rounded-full overflow-hidden bg-border/50 sm:-translate-y-4">
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
  t,
}: {
  value: CategoryValue | undefined;
  onSelect: (v: CategoryValue) => void;
  onNext: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h1 className="text-3xl md:text-5xl font-bold mb-3 text-foreground">
        {t("step1.title")}
      </h1>
      <p className="text-lg md:text-2xl text-muted-foreground mb-10">
        {t("step1.subtitle")}
      </p>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {categoryDefs.map((cat) => {
          const selected = value === cat.value;
          const label = t(`categories.${cat.value}.label`);
          const desc = t(`categories.${cat.value}.desc`);
          return (
            <motion.button
              key={cat.value}
              type="button"
              onClick={() => onSelect(cat.value)}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "group relative flex flex-col items-center text-center p-5 pb-6 rounded-2xl transition-all duration-200",
                selected
                  ? "bg-card shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-2 ring-primary"
                  : "bg-card shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.14)]",
              )}
            >
              {/* Selected check badge */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </motion.div>
              )}

              <Image
                src={cat.image}
                alt={label}
                width={85}
                height={85}
                className="mb-3"
              />
              <h3 className="font-semibold text-base md:text-lg leading-tight mb-1">
                {label}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Anonymous badge — pill style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 inline-flex items-center gap-2.5 text-sm font-semibold border border-foreground/20 rounded-full px-5 py-2.5 mx-auto w-fit"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5 shrink-0"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
        {t("step1.anonymousBadge")}
      </motion.div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={onNext}
          disabled={!value}
          size="lg"
          className="px-9 h-[52px] text-base font-semibold shadow-lg shadow-primary/20"
        >
          {t("step1.continue")} <ArrowRight className="h-5 w-5 ml-2" />
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
  t,
}: {
  form: ReturnType<typeof useForm<ReportFormData>>;
  description: string;
  category: string | undefined;
  onBack: () => void;
  onNext: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const descError = form.formState.errors.description;
  const charCount = description?.length ?? 0;

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
        err instanceof Error ? err.message : t("error.formatFailed"),
      );
    } finally {
      setAiLoading(false);
    }
  }, [description, category, t]);

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
      <h1 className="text-3xl md:text-5xl font-bold mb-3 text-foreground">
        {t("step2.title")}
      </h1>
      <p className="text-lg md:text-2xl text-muted-foreground mb-10">
        {t("step2.subtitle")}
      </p>

      {/* Description */}
      <div className="space-y-8">
        <div>
          <label className="text-lg md:text-2xl font-medium mb-3 block">
            {t("step2.descriptionLabel")} <span className="text-destructive">{t("step2.descriptionRequired")}</span>
          </label>
          <Textarea
            {...form.register("description")}
            placeholder={t("step2.descriptionPlaceholder")}
            rows={8}
            className="resize-none border-border bg-transparent focus:border-primary/50 transition-colors min-h-[245px] text-base md:text-lg rounded-xl"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              {descError ? (
                <p className="text-sm text-destructive">
                  {descError.message}
                </p>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  disabled={
                    aiLoading || charCount < 30 || !category || !!aiFormatted
                  }
                  onClick={handleAiFormat}
                  className="h-[52px] gap-2.5 text-base font-semibold rounded bg-[#2A8F68] hover:bg-[#238458] text-white px-9"
                >
                  {aiLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  {aiLoading ? t("step2.formatting") : t("step2.formatWithAI")}
                </Button>
              )}
            </div>
            <p className="text-base md:text-lg font-medium">
              {charCount.toLocaleString()}/5,000
            </p>
          </div>

          {/* AI error */}
          <AnimatePresence>
            {aiError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 text-sm text-destructive"
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
                className="mt-4 overflow-hidden"
              >
                <div className="rounded-xl border border-primary/30 bg-primary/[0.04] backdrop-blur-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {t("step2.aiFormattedVersion")}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {t("step2.reviewBeforeAccepting")}
                    </span>
                  </div>
                  <div className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap max-h-[280px] overflow-y-auto pr-2">
                    {aiFormatted}
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-primary/10">
                    <Button
                      type="button"
                      onClick={acceptAiText}
                      className="gap-2 shadow-md shadow-primary/20"
                    >
                      <Check className="h-4 w-4" />
                      {t("step2.useThisVersion")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={dismissAiText}
                      className="text-muted-foreground"
                    >
                      {t("step2.keepOriginal")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* When & Where — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* When — Date Picker */}
          <div>
            <label className="text-lg md:text-2xl font-medium mb-3 block">
              {t("step2.whenLabel")}
            </label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                className="inline-flex h-[71px] w-full items-center justify-start gap-3 rounded-xl border border-border bg-transparent px-5 text-base md:text-lg transition-colors hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <CalendarDays className="h-7 w-7 text-muted-foreground shrink-0" />
                {selectedDate ? (
                  <span>
                    {selectedDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("step2.datePlaceholder")}</span>
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
            <label className="text-lg md:text-2xl font-medium mb-3 block">
              {t("step2.whereLabel")}
            </label>
            <Input
              {...form.register("location")}
              placeholder={t("step2.locationPlaceholder")}
              className="h-[71px] bg-transparent border-border text-base md:text-lg rounded-xl px-5"
            />
          </div>
        </div>
      </div>

      {/* Anonymous badge — pill style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 inline-flex items-center gap-2.5 text-sm font-semibold border border-foreground/20 rounded-full px-5 py-2.5 mx-auto w-fit"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <Lock className="h-5 w-5 shrink-0" />
        {t("step2.encryptedBadge")}
      </motion.div>

      <div className="mt-8 flex justify-between">
        <Button
          onClick={onBack}
          size="lg"
          className="h-[52px] px-9 bg-[#01151C] hover:bg-[#0a2a36] text-white font-semibold"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> {t("step2.back")}
        </Button>
        <Button
          onClick={onNext}
          disabled={!description || description.length < 10}
          size="lg"
          className="h-[52px] px-9 font-semibold shadow-lg shadow-primary/20"
        >
          {t("step2.continue")} <ArrowRight className="h-5 w-5 ml-2" />
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
  t,
}: {
  files: File[];
  onChange: (f: File[]) => void;
  onBack: () => void;
  onNext: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h1 className="text-3xl md:text-5xl font-bold mb-3 text-foreground">
        {t("step3.title")}
      </h1>
      <p className="text-lg md:text-2xl text-muted-foreground mb-10">
        {t("step3.subtitle")}
      </p>

      <FileDropzone files={files} onChange={onChange} />

      {/* Anonymous badge — pill style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 inline-flex items-center gap-2.5 text-sm font-semibold border border-foreground/20 rounded-full px-5 py-2.5 mx-auto w-fit"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <Lock className="h-5 w-5 shrink-0" />
        {t("step3.encryptedBadge")}
      </motion.div>

      <div className="mt-8 flex justify-between">
        <Button
          onClick={onBack}
          size="lg"
          className="h-[52px] px-9 bg-[#01151C] hover:bg-[#0a2a36] text-white font-semibold"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> {t("step3.back")}
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="h-[52px] px-9 font-semibold shadow-lg shadow-primary/20"
        >
          {files.length === 0 ? t("step3.skip") : t("step3.continue")}{" "}
          <ArrowRight className="h-5 w-5 ml-2" />
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
  t,
}: {
  form: ReturnType<typeof useForm<ReportFormData>>;
  files: File[];
  confirmed: boolean;
  onToggleConfirm: () => void;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const data = form.getValues();
  const cat = categoryDefs.find((c) => c.value === data.category);
  const catLabel = cat ? t(`categories.${cat.value}.label`) : undefined;

  return (
    <div className="w-full">
      {/* Title & subtitle — left-aligned */}
      <h1 className="text-2xl md:text-4xl font-bold text-[#0D200E] dark:text-foreground leading-tight">
        {t("step4.title")}
      </h1>
      <p className="text-base md:text-lg text-foreground/80 mt-1.5 mb-5">
        {t("step4.subtitle")}
      </p>

      {/* ── Concern Type ── */}
      <div className="mb-4">
        <h2 className="text-base md:text-xl font-medium text-foreground mb-2">
          {t("step4.concernType")}
        </h2>
        <div className="inline-flex items-center h-[48px] px-5 bg-[#F3F3F3] dark:bg-muted/40 border border-[#BEBEBE] dark:border-border/50 rounded-[10px]">
          <span className="text-base md:text-lg text-foreground">
            {catLabel}
          </span>
        </div>
      </div>

      {/* ── Description ── */}
      <div className="mb-4">
        <h2 className="text-base md:text-xl font-medium text-foreground mb-2">
          {t("step4.description")}
        </h2>
        <div className="w-full min-h-[72px] max-h-[120px] overflow-y-auto px-5 py-3 border border-[#BEBEBE] dark:border-border/50 rounded-[10px]">
          <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {data.description}
          </p>
        </div>
      </div>

      {/* ── Date & Location (if provided) ── */}
      {(data.occurredAt || data.location) && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.occurredAt && (
            <div>
              <h2 className="text-base md:text-xl font-medium text-foreground mb-2">
                {t("step4.date")}
              </h2>
              <div className="inline-flex items-center h-[48px] px-5 border border-[#BEBEBE] dark:border-border/50 rounded-[10px]">
                <CalendarIcon className="h-4 w-4 text-foreground/60 mr-2" />
                <span className="text-sm md:text-base text-foreground">
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
                </span>
              </div>
            </div>
          )}
          {data.location && (
            <div>
              <h2 className="text-base md:text-xl font-medium text-foreground mb-2">
                {t("step4.location")}
              </h2>
              <div className="inline-flex items-center h-[48px] px-5 border border-[#BEBEBE] dark:border-border/50 rounded-[10px]">
                <MapPin className="h-4 w-4 text-foreground/60 mr-2" />
                <span className="text-sm md:text-base text-foreground">
                  {data.location}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Evidence ── */}
      <div className="mb-5">
        <h2 className="text-base md:text-xl font-medium text-foreground mb-2">
          {t("step4.evidence")}
        </h2>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-foreground/70 shrink-0" />
          <span className="text-base md:text-lg text-foreground">
            {files.length === 0
              ? t("step4.noFileAttached")
              : t("step4.filesAttached", { count: files.length })}
          </span>
        </div>
      </div>

      {/* ── Confirmation checkbox ── */}
      <button
        type="button"
        onClick={onToggleConfirm}
        className="w-full flex items-start gap-3 text-left mb-5 group"
      >
        <div
          className={`mt-0.5 h-[24px] w-[24px] rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
            confirmed
              ? "border-[#00653E] bg-[#00653E]"
              : "border-[#B8B8B8] bg-transparent group-hover:border-[#00653E]/50"
          }`}
        >
          {confirmed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check className="h-3.5 w-3.5 text-white" />
            </motion.div>
          )}
        </div>
        <span className="text-sm md:text-base text-foreground leading-relaxed">
          {t("step4.confirmText")}
        </span>
      </button>

      {/* Error */}
      {submitError && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-[10px] p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="h-[46px] px-7 bg-[#01151C] hover:bg-[#01151C]/90 text-white font-semibold text-base rounded-[4px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("step4.backToEdit")}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!confirmed || submitting}
          className="h-[46px] px-7 bg-[#00653E] hover:bg-[#00653E]/90 text-white font-semibold text-base rounded-[4px]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("step4.submitting")}
            </>
          ) : (
            <>
              {t("step4.submitSecurely")} <Check className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
