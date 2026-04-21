import Image from "next/image";
import Link from "next/link";
import {
  Shield, FileText, Eye, Lock, ArrowRight, CheckCircle2,
  Fingerprint, ServerCrash, Globe, ShieldCheck, Zap, Users,
  MessageSquareWarning, ChevronRight, Timer,
  Database, KeyRound, Network, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GridPattern,
  StepIllustration,
  ComplianceBadge,
  ArchitectureFlow,
} from "@/components/illustrations";
import { HeroTerminal } from "@/components/hero-terminal";
import {
  FadeUp,
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";


const steps = [
  {
    num: "01",
    title: "Raise Your Concern",
    desc: "Describe what you witnessed through our encrypted channel. No account, no email, no identity — ever.",
    icon: MessageSquareWarning,
  },
  {
    num: "02",
    title: "Receive a Secure Code",
    desc: "Instantly get a unique, anonymous access code. This is your private key to follow up — keep it safe.",
    icon: KeyRound,
  },
  {
    num: "03",
    title: "Stay Informed",
    desc: "Return anytime with your secure code. See real-time progress updates without ever revealing who you are.",
    icon: Eye,
  },
];

const features = [
  {
    icon: Fingerprint,
    title: "Zero-Knowledge Privacy",
    desc: "We never collect your name, email, IP address, or device fingerprint. Anonymity is engineered into every layer — not just a policy.",
  },
  {
    icon: Lock,
    title: "Military-Grade Encryption",
    desc: "Every disclosure, note, and evidence file is encrypted before it leaves your device — and stays encrypted at every stage.",
  },
  {
    icon: ShieldCheck,
    title: "Tamper-Proof Audit Trail",
    desc: "Every action is permanently recorded in an immutable ledger. Unalterable records that stand up to any legal scrutiny.",
  },
  {
    icon: Globe,
    title: "Worldwide Compliance",
    desc: "Purpose-built to meet the EU Whistleblower Directive, GDPR, SOC 2 Type II, and regional regulatory frameworks.",
  },
  {
    icon: Zap,
    title: "Instant Response Workflow",
    desc: "Compliance teams receive real-time alerts, prioritize by severity, and collaborate on investigations — ensuring nothing falls through the cracks.",
  },
  {
    icon: ServerCrash,
    title: "Always-On Availability",
    desc: "Resilient cloud infrastructure with 99.9% uptime guarantee. Your channel for truth stays accessible when it matters most.",
  },
];

const stats = [
  { value: "256-bit", label: "Encryption Standard", icon: Lock },
  { value: "99.9%", label: "Guaranteed Uptime", icon: Timer },
  { value: "<200ms", label: "Platform Response", icon: Zap },
  { value: "Zero", label: "Identity Data Stored", icon: Fingerprint },
];

const compliance = [
  { name: "EU Directive 2019/1937", desc: "Whistleblower Protection" },
  { name: "GDPR", desc: "Data Privacy" },
  { name: "SOC 2 Type II", desc: "Security Controls" },
  { name: "ISO 27001", desc: "Information Security" },
];

const faqs = [
  {
    q: "Is my identity truly anonymous?",
    a: "Absolutely. SpeakSafe uses a zero-knowledge architecture — no IP addresses are logged, no accounts are created, and no identifying metadata is stored. Your secure code is the only connection to your disclosure.",
  },
  {
    q: "What happens after I raise a concern?",
    a: "Your disclosure is encrypted and stored securely. A dedicated compliance officer reviews it, investigates as needed, and updates the status. You can follow progress anytime using your secure code.",
  },
  {
    q: "Can my employer find out who I am?",
    a: "No. The platform is architected so that even system administrators cannot trace a disclosure back to any individual. There are no user accounts, no session identifiers, and all network fingerprints are stripped before processing.",
  },
  {
    q: "What types of concerns can I raise?",
    a: "Fraud, harassment, data misuse, policy violations, safety hazards, and any ethical or compliance concern. If you're unsure whether something qualifies — raise it. The compliance team will assess.",
  },
  {
    q: "Does SpeakSafe meet regulatory requirements?",
    a: "Yes. SpeakSafe is purpose-built to align with the EU Whistleblower Protection Directive (2019/1937), GDPR, SOC 2, and regional frameworks including KSA governance standards.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">SpeakSafe</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Security</a>
            <a href="#compliance" className="hover:text-foreground transition-colors">Compliance</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/admin/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Admin</Button>
            </Link>
            <Link href="/track">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Check Status</Button>
            </Link>
            <Link href="/report">
              <Button size="sm">Raise a Concern</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <GridPattern className="absolute inset-0 text-foreground" />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-100 h-100 bg-primary/3 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-32">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              {/* Text — always visible */}
              <FadeUp className="text-center lg:text-left">
                <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary px-4 py-1.5 text-sm">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  End-to-end encrypted &middot; Anonymous
                </Badge>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
                  Speak up.
                  <br />
                  <span className="text-primary">Stay safe.</span>
                </h1>

                <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                  A confidential, anonymous channel for raising workplace concerns.
                  No identity collected. No digital footprint. No risk.
                </p>

                <p className="mt-3 text-base md:text-lg text-muted-foreground/70 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Enterprise-grade protection built for those who dare to do the right thing.
                  Trusted by leading organizations across the globe.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/report">
                    <Button size="lg" className="text-base px-8 h-13 w-full sm:w-auto font-semibold">
                      <Shield className="h-5 w-5 mr-2" />
                      Raise a Concern
                      <ArrowRight className="h-4.5 w-4.5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/track">
                    <Button size="lg" variant="outline" className="text-base px-8 h-13 w-full sm:w-auto border-border/60 font-semibold">
                      <Eye className="h-5 w-5 mr-2" />
                      Check Your Status
                    </Button>
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary/70" /> No account needed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary/70" /> Fully anonymous
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary/70" /> Encrypted end-to-end
                  </span>
                </div>
              </FadeUp>

              {/* Animated terminal — typing security & marketing lines */}
              <SlideIn from="right" delay={0.3}>
                <HeroTerminal className="w-full" />
              </SlideIn>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="border-y border-border/50 bg-card/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <StaggerContainer stagger={0.12} className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <StaggerItem key={s.label} className="text-center">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <GridPattern className="absolute inset-0 text-foreground" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <FadeUp className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                Seamless &amp; Secure
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Three steps. Complete anonymity.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                No accounts. No emails. No identification. Your courage deserves protection.
              </p>
            </FadeUp>

            <StaggerContainer stagger={0.15} className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <StaggerItem key={step.num}>
                  <Card className="relative border-border/50 bg-card/50 hover:bg-card/80 transition-colors group h-full">
                    <CardContent className="pt-8 pb-6 px-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <StepIllustration step={i + 1} className="w-14 h-14" />
                        </div>
                        <span className="text-5xl font-bold text-border/60 font-mono leading-none">{step.num}</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      {i < steps.length - 1 && (
                        <ChevronRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 h-6 w-6 text-border" />
                      )}
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeUp delay={0.4} className="text-center mt-10">
              <Link href="/report">
                <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                  Speak Up Securely <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </FadeUp>
          </div>
        </section>

        {/* ── Image: Security/Trust Visual ── */}
        <section className="border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <SlideIn from="left">
                <div className="relative rounded-2xl overflow-hidden aspect-4/3">
                  <Image
                    src="https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800&q=80"
                    alt="Secure digital privacy concept"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <Badge className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">
                      <Lock className="h-3 w-3 mr-1" /> Protected by encryption
                    </Badge>
                  </div>
                </div>
              </SlideIn>
              <SlideIn from="right" delay={0.15}>
                <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                  Why SpeakSafe
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                  Your voice matters.
                  <br />
                  <span className="text-primary">Your safety is non-negotiable.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Whistleblowers expose fraud worth billions every year — yet most remain silent
                  out of fear of retaliation. SpeakSafe eliminates that fear entirely. Your identity
                  is never collected, never stored, and never at risk.
                </p>
                <div className="space-y-3">
                  {[
                    "Zero personal data collected — by design, not by policy",
                    "Encrypted before it leaves your device, encrypted at every stage",
                    "Aligned with EU, GDPR, and international protection standards",
                    "Chosen by compliance leaders across industries worldwide",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <GridPattern className="absolute inset-0 text-foreground" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <FadeUp className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                Enterprise-Grade Protection
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Built for trust. Engineered for courage.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                Every layer of SpeakSafe is purpose-built to protect the people who protect organizations.
              </p>
            </FadeUp>

            <StaggerContainer stagger={0.1} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <StaggerItem key={f.title}>
                  <Card className="border-border/40 bg-card/50 hover:border-primary/20 transition-all group h-full">
                    <CardContent className="pt-6 pb-5 px-6">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                        <f.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Architecture section — no tech names ── */}
        <section className="bg-card/20 border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <SlideIn from="left">
                <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                  Architecture
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                  Zero-knowledge by design,
                  <br />
                  <span className="text-primary">not by promise.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  SpeakSafe&apos;s architecture ensures that even system administrators cannot
                  link a report to a person. Data flows through isolated, encrypted layers
                  with no single point capable of identifying a reporter.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Network, text: "IP addresses stripped at network ingress — never logged" },
                    { icon: Database, text: "All sensitive fields encrypted at rest with per-record keys" },
                    { icon: KeyRound, text: "Encryption keys managed with automatic rotation" },
                    { icon: Scale, text: "Append-only audit logs — tamper-proof compliance evidence" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </SlideIn>

              {/* Circular architecture flow */}
              <ScaleIn delay={0.2}>
                <div className="relative">
                  <ArchitectureFlow className="w-full h-auto max-w-md mx-auto" />
                  <div className="absolute -inset-8 bg-primary/3 rounded-full blur-2xl -z-10" />
                </div>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* ── Compliance ── */}
        <section id="compliance" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <GridPattern className="absolute inset-0 text-foreground" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <FadeUp className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                Regulatory Compliance
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Meets the world&apos;s strictest standards.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                SpeakSafe is designed from the ground up to satisfy international
                whistleblower protection and data privacy regulations.
              </p>
            </FadeUp>

            <StaggerContainer stagger={0.12} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {compliance.map((c) => (
                <StaggerItem key={c.name}>
                  <Card className="border-border/40 bg-card/50 text-center group hover:border-primary/20 transition-all h-full">
                    <CardContent className="pt-6 pb-6">
                      <ComplianceBadge className="w-20 h-20 mx-auto mb-3" />
                      <h3 className="font-semibold text-sm mb-1">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeUp delay={0.3} className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
              {[
                { text: "7-day acknowledgment guarantee", icon: Timer },
                { text: "3-month feedback deadline enforced", icon: CheckCircle2 },
                { text: "Configurable data retention & auto-purge", icon: Database },
              ].map((item) => (
                <div key={item.text} className="flex flex-col items-center gap-2">
                  <item.icon className="h-5 w-5 text-primary/70" />
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </FadeUp>
          </div>
        </section>

        {/* ── Image: Team/Organization ── */}
        <section className="border-y border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <SlideIn from="left" className="order-2 lg:order-1">
                <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                  For Organizations
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                  Empower your compliance team.
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  A powerful admin dashboard designed for speed, clarity, and accountability.
                  Manage cases, collaborate securely, and generate audit-ready reports.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Users, title: "Role-Based Access", desc: "Admin, Compliance Officer, and Viewer roles with granular permissions." },
                    { icon: Zap, title: "Real-Time Alerts", desc: "Instant notifications for new reports and severity escalations." },
                    { icon: FileText, title: "Case Management", desc: "Full lifecycle — triage, investigate, annotate, and resolve." },
                    { icon: Scale, title: "Audit-Ready Reports", desc: "Export compliance reports. Every action timestamped and recorded." },
                    { icon: Globe, title: "White-Label Ready", desc: "Deploy under your own brand with custom domain and colors." },
                    { icon: ShieldCheck, title: "AI-Assisted Triage", desc: "Auto-classification, severity scoring, and duplicate detection." },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <f.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{f.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SlideIn>
              <SlideIn from="right" delay={0.15} className="order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden aspect-4/3">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="Professional team collaborating in modern office"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <GridPattern className="absolute inset-0 text-foreground" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <FadeUp className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-border/60 text-muted-foreground">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Frequently asked questions
              </h2>
            </FadeUp>

            <StaggerContainer stagger={0.1} className="space-y-4">
              {faqs.map((faq) => (
                <StaggerItem key={faq.q}>
                  <Card className="border-border/40 bg-card/50">
                    <CardContent className="pt-5 pb-5 px-6">
                      <h3 className="font-semibold text-sm mb-2 flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {faq.q}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                        {faq.a}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden border-t border-border/50">
          <div className="absolute inset-0 pointer-events-none">
            <GridPattern className="absolute inset-0 text-foreground" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center">
            <ScaleIn>
              <div className="relative mx-auto w-20 h-20 mb-8">
                <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
                <div className="relative h-full w-full rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-center">
                  <Shield className="h-9 w-9 text-primary" />
                </div>
              </div>
            </ScaleIn>

            <FadeUp delay={0.15}>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Your courage deserves protection.
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
                Anonymous. Encrypted. Untraceable.
                Raise your concern in under 3 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/report">
                  <Button size="lg" className="text-base px-10 h-12 w-full sm:w-auto">
                    Raise a Concern
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/track">
                  <Button size="lg" variant="outline" className="text-base px-10 h-12 w-full sm:w-auto border-border/60">
                    Follow Up Securely
                  </Button>
                </Link>
              </div>
            </FadeUp>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 bg-card/20">
        <FadeIn className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-bold">SpeakSafe</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enterprise-grade anonymous reporting. Protecting those who protect organizations.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/report" className="hover:text-foreground transition-colors">Raise a Concern</Link></li>
                <li><Link href="/track" className="hover:text-foreground transition-colors">Check Status</Link></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Security</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Encryption</a></li>
                <li><a href="#compliance" className="hover:text-foreground transition-colors">Compliance</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Architecture</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Audit Trail</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Organization</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/admin/login" className="hover:text-foreground transition-colors">Admin Portal</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} SpeakSafe. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Security</a>
            </div>
          </div>
        </FadeIn>
      </footer>
    </div>
  );
}
