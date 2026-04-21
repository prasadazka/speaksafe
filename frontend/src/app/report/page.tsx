"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, ArrowRight, Check, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const categories = [
  { value: "FRAUD", label: "Fraud", desc: "Financial misconduct, embezzlement, bribery" },
  { value: "HARASSMENT", label: "Harassment", desc: "Workplace bullying, discrimination, abuse" },
  { value: "DATA_MISUSE", label: "Data Misuse", desc: "Unauthorized data access or sharing" },
  { value: "POLICY_VIOLATION", label: "Policy Violation", desc: "Breach of company policies or regulations" },
  { value: "OTHER", label: "Other", desc: "Any other compliance concern" },
];

const severities = [
  { value: "LOW", label: "Low", color: "bg-emerald-100 text-emerald-700" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-100 text-amber-700" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-100 text-red-700" },
];

export default function ReportPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("LOW");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const trackingId = "SS-2026-4821";
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const copyId = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">SpeakSafe</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
              <p className="text-muted-foreground mb-6">
                Your report has been securely submitted. Save your tracking ID to check status later.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">Your Tracking ID</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-primary">{trackingId}</span>
                  <Button size="sm" variant="outline" onClick={copyId}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 mb-6 flex items-start gap-2 text-left">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">
                  Save this ID now. It is your only way to track this report. We do not store any identifying information.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/track" className="flex-1">
                  <Button variant="outline" className="w-full">Track Report</Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button className="w-full">Done</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">SpeakSafe</span>
          </Link>
          <Badge variant="secondary">Anonymous Report</Badge>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {step === 1 ? "Category" : step === 2 ? "Details" : "Review"}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Category */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">What type of concern?</h1>
            <p className="text-muted-foreground mb-6">Select the category that best describes your report.</p>
            <div className="space-y-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    category === cat.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-accent"
                  }`}
                >
                  <div className="font-semibold">{cat.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{cat.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!category} size="lg">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Describe the situation</h1>
            <p className="text-muted-foreground mb-6">Provide as much detail as you can. All information is encrypted.</p>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, when, where, and who was involved..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/5000 characters (minimum 10)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Severity Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {severities.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        severity === s.value
                          ? "border-primary ring-2 ring-primary/20 " + s.color
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Attach Evidence (optional)</label>
                <Input type="file" className="cursor-pointer" />
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, images, documents up to 100 MB
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={description.length < 10} size="lg">
                Review <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">Review your report</h1>
            <p className="text-muted-foreground mb-6">Please review the details before submitting.</p>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                  <p className="font-semibold mt-1">{categories.find(c => c.value === category)?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Severity</p>
                  <Badge variant="secondary" className="mt-1">
                    {severities.find(s => s.value === severity)?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="mt-1 text-sm leading-relaxed">{description}</p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p>By submitting, you confirm that the information provided is truthful to the best of your knowledge. Your submission is fully anonymous and encrypted.</p>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button onClick={handleSubmit} size="lg" className="px-8">
                <Shield className="h-4 w-4 mr-2" /> Submit Report
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
