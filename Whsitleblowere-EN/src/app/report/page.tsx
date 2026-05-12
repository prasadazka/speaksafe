"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicNav } from "@/components/public-nav";
import { DarkFooter } from "@/components/dark-footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  CheckCircle2,
  CheckCircle,
  Lock,
  AlertTriangle,
  Loader2,
  CloudUpload,
  X,
  FileText,
  Sparkles,
  Calendar,
  User,
  Info,
} from "lucide-react";
import { submitReport, uploadEvidence } from "@/lib/api";

// ─── categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    value: "FRAUD",
    label: "Financial Misconduct",
    desc: "Embezzlement, bribery, expense fraud, accounting irregularities",
    img: "/images/cash.png",
  },
  {
    value: "HARASSMENT",
    label: "Harassment & Bullying",
    desc: "Workplace bullying, intimidation, hostile behavior",
    img: "/images/target.png",
  },
  {
    value: "DISCRIMINATION",
    label: "Discrimination",
    desc: "Bias based on race, gender, age, disability, religion, orientation",
    img: "/images/gender-equality.png",
  },
  {
    value: "DATA_MISUSE",
    label: "Data & Privacy Breach",
    desc: "Unauthorized access, data leaks, privacy violations",
    img: "/images/database.png",
  },
  {
    value: "POLICY_VIOLATION",
    label: "Policy Violation",
    desc: "Breach of internal policies, code of conduct, or procedures",
    img: "/images/document.png",
  },
  {
    value: "SAFETY_CONCERN",
    label: "Health & Safety",
    desc: "Unsafe conditions, unreported incidents, regulatory non-compliance",
    img: "/images/heart.png",
  },
  {
    value: "CORRUPTION",
    label: "Corruption & Bribery",
    desc: "Kickbacks, conflicts of interest, improper gifts, nepotism",
    img: "/images/money-deposit.png",
  },
  {
    value: "ENVIRONMENTAL",
    label: "Environmental",
    desc: "Pollution, illegal dumping, environmental regulatory violations",
    img: "/images/earth-day.png",
  },
  {
    value: "RETALIATION",
    label: "Retaliation",
    desc: "Punishment for prior reporting, whistleblower intimidation",
    img: "/images/antivirus.png",
  },
  {
    value: "OTHER",
    label: "Other Concern",
    desc: "Any issue not covered by the categories above",
    img: "/images/comment.png",
  },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

// ─── form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  category: z.enum(CATEGORIES.map((c) => c.value) as [CategoryValue, ...CategoryValue[]]),
  description: z.string().min(10, "Please describe the concern (at least 10 characters).").max(5000),
  occurredAt: z.string().optional(),
  location: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

// ─── step labels ──────────────────────────────────────────────────────────────

const STEP_LABELS = ["Concern Type", "Details", "Evidence", "Review"];
const TOTAL_STEPS = 4;

// ─── result type ─────────────────────────────────────────────────────────────

interface SubmitResult {
  trackingId: string;
  category: string;
  description: string;
  fileCount: number;
  submittedAt: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Left Sidebar Stepper ─────────────────────────────────────────────────────

function Sidebar({ step }: { step: number }) {
  return (
    <aside className="hidden lg:flex flex-col w-[280px] shrink-0 py-12 px-8 border-r border-[#EBEBEB] bg-white">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-16">
        <div className="w-8 h-8 bg-[#5B94DE] rounded-md flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-[#00254A] font-[family-name:var(--font-sora)]">
          SpeakSafe
        </span>
      </Link>

      {/* Steps */}
      <div className="flex flex-col gap-0">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isCompleted = num < step;
          const isCurrent = num === step;
          const isLast = num === TOTAL_STEPS;

          return (
            <div key={label} className="flex flex-col">
              <div className="flex items-center gap-4">
                {/* Circle */}
                <motion.div
                  animate={{
                    borderColor: isCurrent || isCompleted ? "#5B94DE" : "#BEBEBE",
                    color: isCurrent || isCompleted ? "#5B94DE" : "#BEBEBE",
                  }}
                  className={cn(
                    "w-[38px] h-[38px] rounded-full border-2 flex items-center justify-center shrink-0 text-base font-[family-name:var(--font-sora)] transition-colors",
                    isCurrent ? "border-[#5B94DE] text-[#5B94DE]" : isCompleted ? "border-[#5B94DE] bg-[#5B94DE] text-white" : "border-[#BEBEBE] text-[#BEBEBE]",
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : num}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    "text-base font-[family-name:var(--font-sora)]",
                    isCurrent ? "font-bold text-[#5B94DE]" : isCompleted ? "font-semibold text-[#5B94DE]" : "font-normal text-[#BEBEBE]",
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "w-[2px] h-[56px] ml-[18px] rounded-full my-1",
                    num < step ? "bg-[#5B94DE]" : "bg-[#EBEBEB]",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Anonymous pill */}
      <div className="mt-auto pt-8">
        <div className="border border-[#5B94DE]/30 rounded-full px-4 py-2 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#5B94DE] shrink-0" />
          <span className="text-xs text-[#5B94DE] font-semibold font-[family-name:var(--font-dm-sans)]">
            Your identity remains fully anonymous
          </span>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile top stepper ───────────────────────────────────────────────────────

function MobileStepper({ step }: { step: number }) {
  return (
    <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-[#EBEBEB] bg-white">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const isCompleted = num < step;
        const isCurrent = num === step;
        const isLast = num === TOTAL_STEPS;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold",
                  isCurrent ? "border-[#5B94DE] text-[#5B94DE]" : isCompleted ? "border-[#5B94DE] bg-[#5B94DE] text-white" : "border-[#BEBEBE] text-[#BEBEBE]",
                )}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : num}
              </div>
              <span className={cn("text-[10px] font-[family-name:var(--font-sora)] hidden sm:block", isCurrent ? "text-[#5B94DE] font-bold" : "text-[#BEBEBE]")}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={cn("flex-1 h-[2px] mx-2 rounded-full", num < step ? "bg-[#5B94DE]" : "bg-[#EBEBEB]")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared button ────────────────────────────────────────────────────────────

function Btn({
  onClick,
  disabled,
  variant = "primary",
  loading,
  children,
  type = "button",
}: {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "dark" | "outline";
  loading?: boolean;
  children: React.ReactNode;
  type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 px-8 py-3.5 rounded text-base font-semibold font-[family-name:var(--font-figtree)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-[#5B94DE] text-white hover:bg-[#4a83cd]",
    dark: "bg-[#01151C] text-white hover:bg-[#0a2a36]",
    outline: "border border-[#5B94DE] text-[#5B94DE] bg-white hover:bg-[#5B94DE]/5",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cn(base, styles[variant])}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Step 1: Category ─────────────────────────────────────────────────────────

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
      <h1 className="text-[clamp(28px,3.5vw,52px)] font-bold text-[#0D200E] font-[family-name:var(--font-sora)] mb-3 leading-tight">
        What type of concern?
      </h1>
      <p className="text-base md:text-xl text-black/60 font-[family-name:var(--font-sora)] mb-10">
        Select the category that best describes the issue you&apos;d like to raise.
      </p>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {CATEGORIES.map((cat) => {
          const selected = value === cat.value;
          return (
            <motion.button
              key={cat.value}
              type="button"
              onClick={() => onSelect(cat.value)}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative flex items-start gap-4 p-5 rounded-2xl bg-white text-left transition-all duration-200",
                selected
                  ? "shadow-[0_10px_20px_rgba(91,148,222,0.2)] ring-2 ring-[#5B94DE]"
                  : "shadow-[0_10px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_20px_rgba(0,0,0,0.14)]",
              )}
            >
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#5B94DE] flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <div className="relative w-[52px] h-[52px] shrink-0">
                <Image src={cat.img} alt={cat.label} fill className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black font-[family-name:var(--font-sora)] leading-tight mb-1">
                  {cat.label}
                </p>
                <p className="text-xs text-black/50 font-[family-name:var(--font-sora)] leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="border border-[#5B94DE]/40 rounded-full px-5 py-2.5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#5B94DE]" />
          <span className="text-sm text-[#5B94DE] font-semibold font-[family-name:var(--font-dm-sans)]">
            Your identity remains fully anonymous throughout this process.
          </span>
        </div>
        <Btn onClick={onNext} disabled={!value}>
          Continue <ArrowRight className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}

// ─── Step 2: Details ──────────────────────────────────────────────────────────

function StepDetails({
  form,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<FormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const description = form.watch("description");
  const charCount = description?.length ?? 0;
  const descError = form.formState.errors.description;
  const canContinue = charCount >= 10 && !descError;

  const handleFormatWithAI = async () => {
    const desc = form.getValues("description");
    const cat = form.getValues("category");
    if (!desc || desc.length < 30) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: cat }),
      });
      const json = await res.json() as { formatted?: string; error?: string };
      if (json.formatted) {
        form.setValue("description", json.formatted, { shouldValidate: true });
      } else {
        setAiError(json.error ?? "Unable to format. Please try again.");
      }
    } catch {
      setAiError("Unable to reach AI service. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-[clamp(28px,3.5vw,52px)] font-bold text-[#0D200E] font-[family-name:var(--font-sora)] mb-3 leading-tight">
        Describe the situation
      </h1>
      <p className="text-base md:text-xl text-black/60 font-[family-name:var(--font-sora)] mb-10">
        Provide as much detail as you can. Every piece of information helps ensure a thorough review.
      </p>

      <div className="space-y-7">
        {/* What happened */}
        <div>
          <label
            htmlFor="description"
            className="block text-base font-normal text-black font-[family-name:var(--font-sora)] mb-3"
          >
            What happened? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            {...form.register("description")}
            rows={8}
            placeholder="Describe the situation in detail — what happened, when it occurred, where it took place, and who was involved. Include dates, times, locations, and any witnesses if possible. The more detail you provide, the more effectively we can investigate..."
            className="w-full resize-none rounded-xl border border-[#BEBEBE] bg-white px-5 py-4 text-base text-black placeholder:text-[#BEBEBE] font-[family-name:var(--font-sora)] focus:outline-none focus:border-[#5B94DE] transition-colors"
          />

          {/* Below textarea: Format with AI + char counter */}
          <div className="flex items-center justify-between mt-3 gap-4">
            <button
              type="button"
              onClick={handleFormatWithAI}
              disabled={aiLoading || charCount < 30}
              title="Format your text with AI assistance"
              className="inline-flex items-center gap-2 px-6 h-[46px] bg-[#5B94DE] hover:bg-[#4a83cd] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded font-[family-name:var(--font-sora)] transition-colors shrink-0"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Format with AI
            </button>
            <div className="text-right">
              {descError ? (
                <p className="text-sm text-red-500 font-[family-name:var(--font-sora)]">{descError.message}</p>
              ) : (
                <span className="text-sm text-[#BEBEBE] font-[family-name:var(--font-sora)]">
                  {charCount.toLocaleString()} / 5,000
                </span>
              )}
            </div>
          </div>

          {aiError && (
            <p className="mt-2 text-sm text-red-500 font-[family-name:var(--font-sora)]">{aiError}</p>
          )}
        </div>

        {/* When & Where */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="occurredAt"
              className="block text-base font-normal text-black font-[family-name:var(--font-sora)] mb-3"
            >
              When did this happen?
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#454545] pointer-events-none" />
              <input
                id="occurredAt"
                type="date"
                title="When did this happen?"
                {...form.register("occurredAt")}
                max={new Date().toISOString().split("T")[0]}
                className="w-full h-[56px] rounded-xl border border-[#BEBEBE] bg-white pl-12 pr-5 text-base text-black font-[family-name:var(--font-sora)] focus:outline-none focus:border-[#5B94DE] transition-colors"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-base font-normal text-black font-[family-name:var(--font-sora)] mb-3"
            >
              Where did this occur?
            </label>
            <input
              id="location"
              type="text"
              {...form.register("location")}
              placeholder="Office, Department, Location"
              className="w-full h-[56px] rounded-xl border border-[#BEBEBE] bg-white px-5 text-base text-black placeholder:text-[#BEBEBE] font-[family-name:var(--font-sora)] focus:outline-none focus:border-[#5B94DE] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Anonymous pill */}
      <div className="mt-10 flex justify-center">
        <div className="border border-[#00151A] rounded-full px-6 py-2.5 inline-flex items-center gap-2">
          <User className="w-5 h-5 text-[#00151A] shrink-0" />
          <span className="text-sm font-semibold text-[#01151B] font-[family-name:var(--font-sora)] text-center">
            All information is end-to-end encrypted and stored anonymously
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Btn onClick={onBack} variant="dark">
          <ArrowLeft className="w-4 h-4" /> Back
        </Btn>
        <Btn onClick={onNext} disabled={!canContinue}>
          Continue <ArrowRight className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}

// ─── Step 3: Evidence ─────────────────────────────────────────────────────────

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;
      const arr = Array.from(newFiles);
      onChange([...files, ...arr]);
    },
    [files, onChange],
  );

  const removeFile = (i: number) => {
    onChange(files.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <h1 className="text-[clamp(28px,3.5vw,52px)] font-bold text-[#0D200E] font-[family-name:var(--font-figtree)] mb-3 leading-tight">
        Attach Supporting Evidence
      </h1>
      <p className="text-base md:text-xl text-black font-[family-name:var(--font-figtree)] mb-10">
        Upload any documents, screenshots, or files that support your disclosure. This step is optional.
      </p>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "rounded-xl p-12 text-center cursor-pointer transition-colors",
          dragging
            ? "border-2 border-dashed border-[#5B94DE] bg-[#5B94DE]/5"
            : "border-2 border-dashed border-[#D0D0D0] bg-[#F5F5F5] hover:border-[#5B94DE] hover:bg-[#5B94DE]/[0.03]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          title="Upload evidence files"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        {/* Cloud upload icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <CloudUpload
              className={cn(
                "w-14 h-14 transition-colors",
                dragging ? "text-[#5B94DE]" : "text-[#1C274C]",
              )}
              strokeWidth={1.5}
            />
          </div>
        </div>
        <p className="text-xl font-semibold text-[#3C3C3C] font-[family-name:var(--font-sora)] mb-2">
          Drag files here or{" "}
          <span className="text-[#5B94DE] underline underline-offset-2">Browse</span>
        </p>
        <p className="text-sm text-[#A9A9A9] font-[family-name:var(--font-sora)]">
          Pdf, Image, Document, Audio or Video — up to 100MB each (max 5 files)
        </p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-3"
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="flex items-center gap-3 bg-white border border-[#EBEBEB] rounded-xl px-4 py-3"
              >
                <FileText className="w-5 h-5 text-[#5B94DE] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black font-[family-name:var(--font-sora)] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-black/40 font-[family-name:var(--font-sora)]">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  title="Remove file"
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-red-400" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security pill */}
      <div className="mt-8 flex justify-center">
        <div className="border border-[#00151A] rounded-full px-6 py-2.5 inline-flex items-center gap-2">
          <User className="w-5 h-5 text-[#00151A] shrink-0" />
          <span className="text-sm font-semibold text-[#01151B] font-[family-name:var(--font-sora)]">
            Files are encrypted before leaving your device and stored securely.
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Btn onClick={onBack} variant="dark">
          <ArrowLeft className="w-4 h-4" /> Back
        </Btn>
        <Btn onClick={onNext}>
          {files.length === 0 ? "Skip" : "Continue"} <ArrowRight className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

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
  form: ReturnType<typeof useForm<FormData>>;
  files: File[];
  confirmed: boolean;
  onToggleConfirm: () => void;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const data = form.getValues();
  const cat = CATEGORIES.find((c) => c.value === data.category);

  return (
    <div>
      <h1 className="text-[clamp(28px,3.5vw,52px)] font-bold text-[#0D200E] font-[family-name:var(--font-sora)] mb-3 leading-tight">
        Review Your Disclosure
      </h1>
      <p className="text-base md:text-xl text-black font-[family-name:var(--font-sora)] mb-10">
        Please review the details below before submitting.
      </p>

      <div className="space-y-6">
        {/* Concern Type */}
        <div>
          <p className="text-xl text-black font-[family-name:var(--font-sora)] mb-3">
            Concern Type
          </p>
          <div className="flex items-center gap-4 border border-[#BEBEBE] rounded-xl px-5 py-4">
            {cat && (
              <div className="relative w-9 h-9 shrink-0">
                <Image src={cat.img} alt={cat.label} fill className="object-contain" />
              </div>
            )}
            <span className="text-base text-black font-[family-name:var(--font-sora)]">
              {cat?.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xl text-black font-[family-name:var(--font-sora)] mb-3">
            Description
          </p>
          <div className="border border-[#BEBEBE] rounded-xl px-5 py-4 max-h-[140px] overflow-y-auto">
            <p className="text-base text-black leading-relaxed font-[family-name:var(--font-sora)] whitespace-pre-wrap">
              {data.description}
            </p>
          </div>
        </div>

        {/* Date & Location — only if filled */}
        {(data.occurredAt || data.location) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.occurredAt && (
              <div>
                <p className="text-xl text-black font-[family-name:var(--font-sora)] mb-3">
                  Date
                </p>
                <div className="border border-[#BEBEBE] rounded-xl px-5 py-4">
                  <span className="text-base text-black font-[family-name:var(--font-sora)]">
                    {new Date(data.occurredAt + "T00:00:00").toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}
            {data.location && (
              <div>
                <p className="text-xl text-black font-[family-name:var(--font-sora)] mb-3">
                  Location
                </p>
                <div className="border border-[#BEBEBE] rounded-xl px-5 py-4">
                  <span className="text-base text-black font-[family-name:var(--font-sora)]">{data.location}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evidence */}
        <div>
          <p className="text-xl text-black font-[family-name:var(--font-sora)] mb-3">
            Evidence
          </p>
          {files.length === 0 ? (
            <div className="inline-flex items-center gap-2 bg-[#F3F3F3] border border-[#BEBEBE] rounded-xl px-5 py-4">
              <Info className="w-5 h-5 text-[#636363] shrink-0" />
              <span className="text-base text-[#636363] font-[family-name:var(--font-sora)]">
                No file is attached
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-3 border border-[#BEBEBE] rounded-xl px-5 py-3"
                >
                  <FileText className="w-4 h-4 text-[#5B94DE] shrink-0" />
                  <span className="text-sm text-black font-[family-name:var(--font-sora)] truncate flex-1">
                    {file.name}
                  </span>
                  <span className="text-xs text-[#636363] font-[family-name:var(--font-sora)] shrink-0">
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmation checkbox */}
        <button
          type="button"
          onClick={onToggleConfirm}
          className="flex items-start gap-4 text-left group w-full"
        >
          <div
            className={cn(
              "mt-0.5 w-[29px] h-[29px] rounded border flex items-center justify-center shrink-0 transition-all",
              confirmed
                ? "bg-[#5B94DE] border-[#5B94DE]"
                : "border-[#B8B8B8] group-hover:border-[#5B94DE]/60",
            )}
          >
            {confirmed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Check className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </div>
          <span className="text-base text-black font-[family-name:var(--font-sora)] leading-relaxed">
            I confirm that the information provided is truthful to the best of my knowledge. I understand this submission is fully anonymous and encrypted.
          </span>
        </button>
      </div>

      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-[family-name:var(--font-sora)]">{submitError}</p>
        </motion.div>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <Btn onClick={onBack} variant="dark" disabled={submitting}>
          <ArrowLeft className="w-4 h-4" /> Back to Edit
        </Btn>
        <Btn onClick={onSubmit} disabled={!confirmed} loading={submitting}>
          {submitting ? "Submitting…" : <>Submit Securely <Check className="w-4 h-4" /></>}
        </Btn>
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ result }: { result: SubmitResult }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(result.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      <PublicNav />

      {/* ── Main ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[930px] bg-white border border-[#E8E8E8] shadow-[0px_4px_20px_rgba(0,0,0,0.10)] rounded-xl px-10 py-12"
        >
          {/* Security illustration */}
          <div className="flex justify-center mb-6">
            <Image
              src="/images/Security-iocn.png"
              alt="Secure submission"
              width={180}
              height={186}
              className="object-contain pointer-events-none select-none"
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="text-[clamp(26px,2.5vw,42px)] font-bold text-black text-center font-[family-name:var(--font-sora)] leading-tight mb-4">
            Your Concern Has Been Received
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-xl text-[#909090] text-center font-[family-name:var(--font-sora)] leading-relaxed mb-8 max-w-[833px] mx-auto">
            Your disclosure is now being securely processed. Save your tracking ID to follow up on its progress
          </p>

          {/* Tracking ID card */}
          <div className="bg-[#F6FBFF] border border-[#EBEBEB] rounded-xl px-8 py-5 mb-4 max-w-[833px] mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-base text-[#A9A9A9] font-[family-name:var(--font-sora)]">
                Your Tracking ID
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F6BE91] text-[#34291F] text-[10px] font-bold uppercase tracking-wide font-[family-name:var(--font-sora)]">
                Medium Priority
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-[clamp(24px,3vw,40px)] font-extrabold text-[#5B94DE] font-[family-name:var(--font-sora)] tracking-wide leading-none">
                {result.trackingId}
              </span>
              <button
                type="button"
                onClick={copy}
                title="Copy tracking ID"
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-all shrink-0 font-[family-name:var(--font-sora)]",
                  copied
                    ? "bg-[#5B94DE]/10 text-[#5B94DE]"
                    : "bg-[#F3F3F3] text-[#636363] hover:bg-[#EBEBEB]",
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 bg-[#5B94DE]/[0.27] rounded-lg px-5 py-3 mb-10 max-w-[833px] mx-auto">
            <Info className="w-5 h-5 text-[#154C94] shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-[#162246] font-[family-name:var(--font-sora)] leading-5 tracking-wide">
              Save this ID now. It is your only way to follow up on this disclosure. We do not store any Identifying information
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/track">
              <button
                type="button"
                className="inline-flex items-center gap-2.5 h-[52px] px-8 bg-[#DBDBDB] hover:bg-[#CFCFCF] text-[#222222] text-base font-normal rounded transition-colors font-[family-name:var(--font-sora)]"
              >
                <CheckCircle className="w-5 h-5 shrink-0" />
                Check the Status
              </button>
            </Link>
            <Link href="/">
              <button
                type="button"
                className="inline-flex items-center gap-2.5 h-[52px] px-8 bg-[#5B94DE] hover:bg-[#4a83cd] text-white text-base font-normal rounded transition-colors font-[family-name:var(--font-sora)]"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Done
              </button>
            </Link>
          </div>
        </motion.div>
      </main>

      <DarkFooter />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: undefined, description: "", occurredAt: "", location: "" },
    mode: "onChange",
  });

  const category = form.watch("category");

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
      const res = await submitReport({
        category: data.category,
        description: data.description,
        severity: "MEDIUM",
        occurred_at: data.occurredAt || null,
        location: data.location || null,
      });

      const reportId = res.data?.id;
      const trackingId = res.data?.tracking_id ?? "UNKNOWN";

      if (reportId && files.length > 0) {
        for (const file of files) {
          try { await uploadEvidence(reportId, file); } catch { /* non-blocking */ }
        }
      }

      setResult({
        trackingId,
        category: data.category,
        description: data.description,
        fileCount: files.length,
        submittedAt: new Date().toISOString(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return <SuccessScreen result={result} />;

  const stepVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD]">
      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-[#EBEBEB] px-6 h-[64px] flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#5B94DE] rounded-md flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-[#00254A] font-[family-name:var(--font-sora)]">SpeakSafe</span>
        </Link>
      </header>

      {/* Mobile stepper */}
      <MobileStepper step={step} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar step={step} />

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full max-w-3xl mx-auto px-6 py-10 md:py-14">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {step === 1 && (
                  <StepCategory
                    value={category}
                    onSelect={(v) => form.setValue("category", v, { shouldValidate: true })}
                    onNext={() => goTo(2)}
                  />
                )}
                {step === 2 && (
                  <StepDetails
                    form={form}
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
          </div>
        </main>
      </div>
    </div>
  );
}
