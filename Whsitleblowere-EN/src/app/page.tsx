"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Lock, Zap, Globe, BarChart3, Clock } from "lucide-react";

// ─── data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "256-bit", label: "Encryption Standard" },
  { value: "99.9%", label: "Guaranteed Uptime" },
  { value: "<200ms", label: "Platform Response" },
  { value: "Zero", label: "Identity Data Stored" },
];

const steps = [
  {
    num: "01",
    title: "Raise Your Concern",
    desc: "Describe what you witnessed through our encrypted channel. No account, no email, no identity — ever.",
    img: "/images/step1.jpg",
  },
  {
    num: "02",
    title: "Receive a Secure Code",
    desc: "After submission, you receive a unique, anonymous tracking code. Keep it safe — it's your only link to your disclosure.",
    img: "/images/step2.png",
  },
  {
    num: "03",
    title: "Stay Informed",
    desc: "Use your secure code at any time to check your case status, receive updates, and communicate — completely anonymously.",
    img: "/images/step3.png",
  },
];

const features = [
  {
    icon: Shield,
    title: "Zero-Knowledge Privacy",
    desc: "We never collect your name, email, IP address, or device fingerprint. Anonymity is engineered into every layer — not just a policy.",
    img: "/images/data-security.png",
  },
  {
    icon: Lock,
    title: "Military-Grade Encryption",
    desc: "Every disclosure, note, and evidence file is encrypted before it leaves your device — and stays encrypted at every stage.",
    img: "/images/cloud-security.png",
  },
  {
    icon: BarChart3,
    title: "Tamper-Proof Audit Trail",
    desc: "Every action is permanently recorded in an immutable ledger. Unalterable records that stand up to any legal scrutiny.",
    img: "/images/data-validation.png",
  },
  {
    icon: Globe,
    title: "Worldwide Compliance",
    desc: "Aligned with EU Whistleblower Directive, GDPR, SOC 2, and ISO 27001 — built to satisfy global regulatory demands.",
    img: "/images/global-analytics.png",
  },
  {
    icon: Zap,
    title: "Instant Response Workflow",
    desc: "Compliance teams receive real-time alerts, prioritize by severity, and collaborate on investigations — ensuring nothing falls through the cracks.",
    img: "/images/cloud-data-sync.png",
  },
  {
    icon: Clock,
    title: "Always-On Availability",
    desc: "Resilient cloud infrastructure with 99.9% uptime guarantee. Your channel for truth stays accessible when it matters most.",
    img: "/images/web-security.png",
  },
];

const orgFeatures = [
  {
    title: "Role-Based Access",
    desc: "Admin, Compliance Officer, and Viewer roles with granular permissions.",
    img: "/images/user-profile.png",
  },
  {
    title: "Real-Time Alerts",
    desc: "Instant notifications for new reports and severity escalations.",
    img: "/images/notification.png",
  },
  {
    title: "Case Management",
    desc: "Full lifecycle — triage, investigate, annotate, and resolve.",
    img: "/images/content-management.png",
  },
  {
    title: "Audit-Ready Reports",
    desc: "Export compliance reports. Every action timestamped and recorded.",
    img: "/images/seo-report.png",
  },
  {
    title: "White-Label Ready",
    desc: "Deploy under your own brand with custom domain and colors.",
    img: "/images/web-design.png",
  },
  {
    title: "AI-Assisted Triage",
    desc: "Auto-classification, severity scoring, and duplicate detection.",
    img: "/images/setting.png",
  },
];

const aiCards = [
  {
    title: "Instant Priority Detection",
    desc: "Every report is assessed the moment it's submitted. Critical threats are surfaced immediately so compliance teams can act fast — nothing urgent gets buried.",
    img: "/images/Magnifier-icon.png",
  },
  {
    title: "Emotional Urgency Detection",
    desc: "Reads between the lines to detect fear, distress, and desperation in a reporter's own words. High-emotion reports are automatically flagged so the most vulnerable reporters get attention first.",
    img: "/images/Security-iocn.png",
  },
  {
    title: "Pattern Intelligence",
    desc: "Automatically connects related reports, detects recurring misconduct patterns, and surfaces cross-case insights — so compliance teams can identify systemic issues before they escalate.",
    img: "/images/Ai-background.png",
  },
  {
    title: "Smart Report Enhancement",
    desc: "Turns raw, informal reports into clear, structured statements — while keeping every fact, name, and date exactly as the reporter wrote them. Always optional.",
    img: "/images/antivirus.png",
  },
];

const faqs = [
  {
    q: "Is my identity truly anonymous?",
    a: "Absolutely. SpeakSafe uses a zero-knowledge architecture — no IP addresses are logged, no accounts are created, and no identifying metadata is stored. Your secure code is the only connection to your disclosure.",
  },
  {
    q: "What happens after I raise a concern?",
    a: "Your encrypted report is routed to your organization's designated compliance team. You receive a secure tracking code immediately. The team has 7 days to acknowledge and 3 months to provide feedback — in line with EU Directive requirements.",
  },
  {
    q: "Can my employer find out who I am?",
    a: "No. SpeakSafe's zero-knowledge architecture means even system administrators cannot link a report to a person. No IP, no device fingerprint, no account — nothing connects you to your disclosure.",
  },
  {
    q: "What types of concerns can I raise?",
    a: "Fraud, financial misconduct, harassment, data misuse, safety violations, policy breaches, corruption, and more. If you've witnessed something wrong, SpeakSafe is the right channel to report it safely.",
  },
  {
    q: "Does SpeakSafe meet regulatory requirements?",
    a: "Yes. SpeakSafe is designed to satisfy the EU Whistleblower Protection Directive (2019/1937), GDPR, SOC 2, ISO 27001, and regional frameworks including Nazaha compliance requirements.",
  },
];

const badges = [
  { src: "/images/standarad-gdpr.svg", alt: "GDPR" },
  { src: "/images/standarad-Nazaha 1.svg", alt: "Nazaha" },
  { src: "/images/standarad-AICPA SOC 2 TYPE II Certified 1.svg", alt: "SOC 2" },
  { src: "/images/standarad-ISO 27001 Information Security 1.svg", alt: "ISO 27001" },
];

// ─── pill badge ───────────────────────────────────────────────────────────────

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-5 py-1 rounded-full border border-[#5B94DE] text-[#5B94DE] text-sm font-semibold font-[family-name:var(--font-dm-sans)]">
      {text}
    </span>
  );
}

// ─── accordion item ───────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-[#E9E9E9] rounded-xl bg-white shadow-[0_10px_20px_rgba(0,0,0,0.07)] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-base font-semibold text-black/90 font-[family-name:var(--font-sora)]">{q}</span>
        {open ? (
          <ChevronUp className="shrink-0 w-5 h-5 text-[#5B94DE]" />
        ) : (
          <ChevronDown className="shrink-0 w-5 h-5 text-[#5B94DE]" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm leading-7 text-black/70 font-[family-name:var(--font-sora)]">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#F0F0F0]">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-[72px]">
          {/* logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#5B94DE] rounded-md flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#00254A] font-[family-name:var(--font-sora)]">
              SpeakSafe
            </span>
          </a>

          {/* links */}
          <div className="hidden md:flex items-center gap-10">
            {["Features", "Pricing", "Gallery"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-[#01151C] text-base font-[family-name:var(--font-sora)] hover:text-[#5B94DE] transition-colors"
              >
                {link}
              </a>
            ))}
            <a
              href="/admin"
              className="flex items-center gap-1.5 text-[#01151C] text-base font-[family-name:var(--font-sora)] hover:text-[#5B94DE] transition-colors"
            >
              Admin
            </a>
          </div>

          {/* cta */}
          <a
            href="/report"
            className="hidden md:flex items-center gap-2 bg-[#5B94DE] text-white text-sm font-semibold font-[family-name:var(--font-figtree)] px-6 py-2.5 rounded"
          >
            Raise a Concern
          </a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#F8F8F8] pt-20 pb-0">
        {/* bg image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-section-bg.png"
            alt=""
            fill
            className="object-cover object-top opacity-30"
            priority
          />
        </div>

        <div className="max-w-[1280px] mx-auto px-6 flex flex-col items-center text-center">
          {/* badge */}
          <div className="mb-8">
            <Pill text="End-to-end encrypted · Anonymous" />
          </div>

          {/* heading */}
          <h1 className="max-w-5xl text-[clamp(40px,6vw,96px)] font-bold leading-[1.05] tracking-tight text-black font-[family-name:var(--font-sora)] mb-6">
            When People Feel Safe,<br />They Speak Up
          </h1>

          {/* subtext */}
          <p className="max-w-3xl text-base md:text-lg text-black/70 font-[family-name:var(--font-figtree)] leading-relaxed mb-10">
            A secure and anonymous reporting platform that turns concerns into clarity—without
            exposing identities. Built with enterprise-grade protection to help organizations act
            early and lead with integrity.
          </p>

          {/* cta buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <a
              href="/report"
              className="flex items-center justify-center gap-2 bg-[#5B94DE] text-white font-semibold font-[family-name:var(--font-figtree)] px-8 py-3.5 rounded text-base hover:bg-[#4a83cd] transition-colors"
            >
              Raise a Concern
            </a>
            <a
              href="/track"
              className="flex items-center justify-center gap-2 bg-[#222222] text-white font-semibold font-[family-name:var(--font-figtree)] px-8 py-3.5 rounded text-base hover:bg-[#333] transition-colors"
            >
              Check the Status
            </a>
          </div>

          {/* hero image */}
          <div className="relative w-full max-w-4xl mx-auto h-[420px] md:h-[560px]">
            <Image
              src="/images/hero-section-main-image.png"
              alt="SpeakSafe platform preview"
              fill
              className="object-contain object-bottom drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-b border-[#F0F0F0] py-14">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.value} className="flex flex-col items-center gap-1 text-center">
                <span className="text-[40px] md:text-[48px] font-bold text-black font-[family-name:var(--font-sora)] leading-none">
                  {s.value}
                </span>
                <span className="text-[#A6A6A6] text-base font-[family-name:var(--font-sora)]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why SpeakSafe ──────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-[1280px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* left */}
          <div>
            <div className="mb-6">
              <Pill text="Why SpeakSafe" />
            </div>
            <h2 className="text-[clamp(32px,3.5vw,56px)] font-bold text-black font-[family-name:var(--font-sora)] leading-tight mb-6">
              Your voice matters. Your safety is non-negotiable.
            </h2>
            <p className="text-base md:text-lg text-black/70 font-[family-name:var(--font-sora)] leading-relaxed mb-8">
              Whistleblowers expose fraud worth billions every year — yet most remain silent out of
              fear of retaliation. SpeakSafe eliminates that fear entirely. Your identity is never
              collected, never stored, and never at risk.
            </p>
            <ul className="space-y-3">
              {[
                "Zero personal data collected — by design, not by policy",
                "Encrypted before it leaves your device, encrypted at every stage",
                "Aligned with EU, GDPR, and international protection standards",
                "Chosen by compliance leaders across industries worldwide",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 shrink-0 rounded-full bg-[#5B94DE] flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-base text-black font-[family-name:var(--font-sora)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* right — 2×2 image grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative rounded-2xl overflow-hidden h-48 md:h-60">
              <Image src="/images/hunters-race-MYbhN8KaaEc-unsplash.jpg" alt="Compliance" fill className="object-cover" />
            </div>
            <div className="relative rounded-2xl overflow-hidden h-48 md:h-60">
              <Image src="/images/image -security.jpg" alt="Security" fill className="object-cover" />
            </div>
            <div className="relative rounded-2xl overflow-hidden h-48 md:h-60 col-span-2">
              <Image src="/images/hero-section-bg.png" alt="Platform" fill className="object-cover opacity-50" />
              <div className="absolute inset-0 bg-[#5B94DE]/20 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="bg-[#F8F8F8] py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-6 flex justify-center">
              <Pill text="How It Works" />
            </div>
            <h2 className="text-[clamp(32px,3.5vw,56px)] font-bold text-black font-[family-name:var(--font-sora)]">
              Simple. Secure. Confidential.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.07)] overflow-hidden flex flex-col"
              >
                <div className="relative h-52">
                  <Image src={step.img} alt={step.title} fill className="object-cover" />
                </div>
                <div className="p-6 flex flex-col gap-3 flex-1">
                  <span className="text-[#5B94DE] text-sm font-bold font-[family-name:var(--font-sora)]">
                    {step.num}
                  </span>
                  <h3 className="text-xl font-bold text-black font-[family-name:var(--font-sora)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-7 text-black/60 font-[family-name:var(--font-sora)]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-6 flex justify-center">
              <Pill text="Features" />
            </div>
            <h2 className="text-[clamp(32px,3.5vw,56px)] font-bold text-[#5B94DE] font-[family-name:var(--font-sora)] mb-4">
              Built for trust. Engineered for courage.
            </h2>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-black/60 font-[family-name:var(--font-sora)]">
              Every layer of SpeakSafe is purpose-built to protect the people who protect
              organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[#F0F0F0] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.07)] p-8 flex flex-col items-center text-center gap-5"
              >
                <div className="relative w-[120px] h-[120px]">
                  <Image src={f.img} alt={f.title} fill className="object-contain" />
                </div>
                <h3 className="text-xl font-bold text-black font-[family-name:var(--font-figtree)]">
                  {f.title}
                </h3>
                <p className="text-sm leading-7 text-black/60 font-[family-name:var(--font-figtree)]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture ───────────────────────────────────────────────────── */}
      <section className="bg-[#F8F8F8] py-24">
        <div className="max-w-[1280px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* left image */}
          <div className="relative rounded-3xl overflow-hidden h-80 md:h-[480px] shadow-2xl">
            <Image
              src="/images/cloud-security.png"
              alt="Zero knowledge architecture"
              fill
              className="object-contain bg-gradient-to-br from-[#E8F0FB] to-[#F8F8F8] p-10"
            />
          </div>

          {/* right */}
          <div>
            <div className="mb-6">
              <Pill text="Architecture" />
            </div>
            <h2 className="text-[clamp(28px,3vw,48px)] font-bold text-[#5B94DE] font-[family-name:var(--font-sora)] leading-tight mb-6">
              Zero-knowledge by design, not by promise.
            </h2>
            <p className="text-base md:text-lg text-[#01151C]/70 font-[family-name:var(--font-sora)] leading-relaxed mb-8">
              SpeakSafe&apos;s architecture ensures that even system administrators cannot link a
              report to a person. Data flows through isolated, encrypted layers with no single point
              capable of identifying a reporter.
            </p>
            <ul className="space-y-3">
              {[
                "IP addresses stripped at network ingress — never logged",
                "All sensitive fields encrypted at rest with per-record keys",
                "Append-only audit logs — tamper-proof compliance evidence",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 shrink-0 rounded-full bg-[#5B94DE] flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-base text-[#01151C] font-[family-name:var(--font-sora)]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Compliance Badges ──────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <div className="mb-6 flex justify-center">
            <Pill text="Regulatory Compliance" />
          </div>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-black/60 font-[family-name:var(--font-figtree)] mb-12">
            SpeakSafe is designed from the ground up to satisfy international whistleblower
            protection and data privacy regulations.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {badges.map((b) => (
              <div key={b.alt} className="relative h-16 w-32">
                <Image src={b.src} alt={b.alt} fill className="object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Organizations ──────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#F8F8F8] py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-6 flex justify-center">
              <Pill text="For Organizations" />
            </div>
            <h2 className="text-[clamp(32px,3.5vw,56px)] font-bold text-black font-[family-name:var(--font-figtree)] mb-4">
              Empower your compliance team.
            </h2>
            <p className="max-w-3xl mx-auto text-base md:text-lg text-black/60 font-[family-name:var(--font-figtree)] leading-relaxed">
              A powerful admin dashboard designed for speed, clarity, and accountability. Manage
              cases, collaborate securely, and generate audit-ready reports.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orgFeatures.map((f) => (
              <div
                key={f.title}
                className="relative bg-white border border-[#EBEBEB] rounded-2xl p-8 overflow-hidden"
              >
                {/* faded bg icon */}
                <div className="absolute right-4 bottom-4 opacity-20 w-[100px] h-[100px]">
                  <Image src={f.img} alt="" fill className="object-contain" />
                </div>
                <h3 className="text-xl font-bold text-black font-[family-name:var(--font-figtree)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm leading-7 text-[#222222] font-[family-name:var(--font-figtree)]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-6 flex justify-center">
              <Pill text="Powered by AI" />
            </div>
            <h2 className="text-[clamp(32px,3.5vw,56px)] font-bold text-[#5B94DE] font-[family-name:var(--font-sora)] mb-4">
              Intelligence that protects.
            </h2>
            <p className="max-w-3xl mx-auto text-base md:text-lg text-black/60 font-[family-name:var(--font-sora)] text-center">
              AI features that help reporters speak clearly and ensure the most critical issues get
              attention first.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {aiCards.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-[#F0F0F0] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.07)] p-8 flex gap-6 items-start"
              >
                <div className="relative w-16 h-16 shrink-0 bg-[#5B94DE] rounded-xl flex items-center justify-center overflow-hidden">
                  <Image src={card.img} alt={card.title} fill className="object-contain p-2" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black font-[family-name:var(--font-sora)] mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-7 text-black/60 font-[family-name:var(--font-sora)]">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F8F8] py-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-6 flex justify-center">
              <Pill text="FAQ" />
            </div>
            <h2 className="text-[clamp(32px,3.5vw,56px)] font-bold text-black font-[family-name:var(--font-figtree)]">
              Frequently asked questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#F8F8F8] pb-24 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-[#5B94DE] rounded-[50px] px-8 md:px-20 py-20 text-center shadow-[0_4px_15px_rgba(0,0,0,0.15)]">
            <h2 className="text-[clamp(28px,3vw,48px)] font-bold text-white font-[family-name:var(--font-sora)] mb-4">
              Enterprise-grade anonymous reporting.
            </h2>
            <p className="text-white/80 text-lg font-[family-name:var(--font-figtree)] mb-10 max-w-xl mx-auto">
              Protecting those who protect organizations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/report"
                className="bg-white text-black font-semibold font-[family-name:var(--font-figtree)] px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Raise a Concern
              </a>
              <a
                href="#features"
                className="bg-white text-black font-semibold font-[family-name:var(--font-figtree)] px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                View Compliance
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#F0F0F0]">
        <div className="max-w-[1280px] mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            {/* brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#5B94DE] rounded-md flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-[#00254A] font-[family-name:var(--font-sora)]">
                  SpeakSafe
                </span>
              </div>
              <p className="text-sm text-black/50 font-[family-name:var(--font-sora)] leading-relaxed">
                Secure, anonymous whistleblowing platform for modern organizations.
              </p>
            </div>

            {/* links */}
            <div className="flex flex-wrap gap-12">
              <div>
                <p className="text-xs font-semibold text-black/40 uppercase tracking-widest mb-3 font-[family-name:var(--font-sora)]">
                  Platform
                </p>
                <ul className="space-y-2">
                  {["Features", "Security", "Compliance", "Pricing"].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-black/60 hover:text-[#5B94DE] font-[family-name:var(--font-sora)] transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-black/40 uppercase tracking-widest mb-3 font-[family-name:var(--font-sora)]">
                  Legal
                </p>
                <ul className="space-y-2">
                  {["Privacy Policy", "Terms of Service", "GDPR", "Cookie Policy"].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-black/60 hover:text-[#5B94DE] font-[family-name:var(--font-sora)] transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-black/40 uppercase tracking-widest mb-3 font-[family-name:var(--font-sora)]">
                  Company
                </p>
                <ul className="space-y-2">
                  {["About", "Contact", "Blog", "Careers"].map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-black/60 hover:text-[#5B94DE] font-[family-name:var(--font-sora)] transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="bg-[#5B94DE] rounded-xl px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-white text-sm font-[family-name:var(--font-sora)]">
              © 2026 SpeakSafe. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {["FAQs", "Compliance"].map((l) => (
                <a key={l} href="#" className="text-white/80 text-sm hover:text-white font-[family-name:var(--font-sora)] transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
