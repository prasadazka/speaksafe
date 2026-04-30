import Image from "next/image";
import Link from "next/link";
import {
  Shield, FileText, Eye, Lock, ArrowRight, CheckCircle2,
  Fingerprint, ServerCrash, Globe, ShieldCheck, Zap, Users,
  MessageSquareWarning, Timer,
  Database, KeyRound, Network, Scale,
} from "lucide-react";
import {
  FadeUp,
  FadeIn,
  SlideIn,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";

/* ── Icon mappings (non-translatable) ── */

const statIcons = [Lock, Timer, Zap, Database];

const featureImages = [
  "/images/illustrations/privacy-policy.png",
  "/images/illustrations/unprotected.png",
  "/images/illustrations/justice.png",
  "/images/illustrations/earth.png",
  "/images/illustrations/chatting.png",
  "/images/illustrations/data-storage.png",
];

const complianceBadges = [
  "/images/icons/gdpr.svg",
  "/images/compliance/nazaha.svg",
  "/images/compliance/soc2.svg",
  "/images/compliance/iso27001.svg",
];

const architectureIcons = [Network, Database, KeyRound, Scale];
const orgIcons = [Users, Zap, FileText, Scale, Globe, ShieldCheck];
const complianceBottomIcons = [Timer, CheckCircle2, Database];
const aiCards = [
  { key: "severity", image: "/images/ai/ai-card-1.png" },
  { key: "format", image: "/images/ai/ai-card-2.png" },
  { key: "patterns", image: "/images/ai/ai-card-3.jpg" },
  { key: "sentiment", image: "/images/ai/ai-card-4.png" },
] as const;

/* ── Page ── */

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFFFE]">
      {/* ── Header (dark) ── */}
      <header className="bg-[#01151C] sticky top-0 z-50">
        <div className="max-w-[1660px] mx-auto px-6 lg:px-[150px] h-[80px] md:h-[106px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg width="22" height="25" viewBox="0 0 22 25" fill="none">
                <path d="M10.8 0L0 4.4V11C0 17.1 4.6 22.8 10.8 24.4C17 22.8 21.6 17.1 21.6 11V4.4L10.8 0Z" fill="white"/>
                <rect x="8" y="8" width="5.6" height="5.6" rx="1" fill="#01151C"/>
              </svg>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">{tc("brand")}</span>
          </div>

          {/* Center nav */}
          <nav className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-10 text-white text-xl font-[family-name:var(--font-dm)]">
              <a href="#how-it-works" className="hover:text-white/80 transition-colors">{tc("nav.about")}</a>
              <a href="#features" className="hover:text-white/80 transition-colors">{tc("nav.features")}</a>
              <a href="#ai" className="hover:text-white/80 transition-colors">{tc("nav.ai")}</a>
              <a href="#compliance" className="hover:text-white/80 transition-colors">{tc("nav.compliance")}</a>
              <a href="#faq" className="hover:text-white/80 transition-colors">{tc("nav.faq")}</a>
            </div>
            {/* Language */}
            <LanguageSwitcher />
          </nav>

          {/* Right — desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/admin/login" className="text-white text-xl font-[family-name:var(--font-dm)] hover:text-white/80 transition-colors">
              {tc("nav.admin")}
            </Link>
            <Link href="/report">
              <button title="Raise a Concern" className="cursor-pointer flex items-center gap-2.5 bg-[#00653E] text-white px-9 py-3 rounded font-semibold text-base shadow-[0_0_20px_rgba(0,101,62,0.5)] border border-white/15 hover:bg-[#007A4A] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(0,101,62,0.7)] active:translate-y-0 transition-all duration-200">
                <FileText className="h-5 w-5" />
                {tc("nav.raiseConcern")}
              </button>
            </Link>
          </div>

          {/* Right — mobile: hamburger only (CTA inside menu) */}
          <div className="flex lg:hidden items-center">
            <MobileNav
              links={[
                { href: "#how-it-works", label: tc("nav.about") },
                { href: "#features", label: tc("nav.features") },
                { href: "#ai", label: tc("nav.ai") },
                { href: "#compliance", label: tc("nav.compliance") },
                { href: "#faq", label: tc("nav.faq") },
              ]}
              adminLabel={tc("nav.admin")}
              ctaLabel={tc("nav.raiseConcern")}
              brandLabel={tc("brand")}
            />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero (dark bg) ── */}
        <section className="relative bg-[#01151C] overflow-hidden">
          {/* Background pattern image */}
          <div className="absolute inset-0">
            <div className="absolute right-0 top-0 w-[85%] h-full">
              <Image
                src="/images/backgrounds/hero-bg.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="85vw"
                priority
              />
            </div>
            {/* Gradient overlay — dark left fading to transparent right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00181E] via-[#01151B] to-[#01151B]/0" style={{ background: "linear-gradient(90deg, #00181E 0%, #01151B 46.15%, rgba(1, 27, 33, 0) 100%)" }} />
          </div>

          <div className="relative max-w-[1660px] mx-auto px-6 lg:px-[150px] pt-20 pb-40 md:pt-28 md:pb-52">
            <div className="max-w-[650px]">
              <FadeUp>
                {/* Pill badge */}
                <div className="inline-flex items-center border border-[#00653E] rounded-full px-5 py-1 mb-8">
                  <span className="text-[#00653E] font-semibold text-base font-[family-name:var(--font-dm)]">
                    {t("hero.pill")}
                  </span>
                </div>

                {/* Hero heading */}
                <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[102px] font-bold leading-[1.2] text-white mb-8">
                  {t("hero.heading1")}
                  <br />
                  {t("hero.heading2")}
                </h1>

                {/* Description */}
                <p className="text-lg md:text-xl text-[#D5D5D5] leading-[30px] mb-10 max-w-[650px]">
                  {t("hero.description")}
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/report">
                    <button title="Raise a Concern" className="cursor-pointer flex items-center justify-center gap-2.5 bg-[#00653E] text-white px-9 py-3.5 rounded font-semibold text-xl shadow-[0_0_20px_rgba(0,101,62,0.5)] border border-white/15 hover:bg-[#007A4A] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(0,101,62,0.7)] active:translate-y-0 transition-all duration-200 w-full sm:w-auto">
                      <FileText className="h-6 w-6" />
                      {t("hero.raiseConcern")}
                    </button>
                  </Link>
                  <Link href="/track">
                    <button title="Check report status" className="cursor-pointer flex items-center justify-center gap-2.5 bg-[#222222] text-white px-9 py-3.5 rounded font-semibold text-xl shadow-[0_0_20px_rgba(34,34,34,0.5)] border border-white/15 hover:bg-[#333333] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(34,34,34,0.7)] active:translate-y-0 transition-all duration-200 w-full sm:w-auto">
                      <CheckCircle2 className="h-6 w-6" />
                      {t("hero.checkStatus")}
                    </button>
                  </Link>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── Stats Bar (white floating card) ── */}
        <section className="relative z-10 -mt-[130px] mb-16">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px]">
            <ScaleIn>
              <div className="bg-white rounded-[20px] shadow-[0_4px_40px_rgba(0,0,0,0.15)] px-8 md:px-16 py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  {(["encryption", "uptime", "response", "data"] as const).map((key, i) => {
                    const Icon = statIcons[i];
                    return (
                      <div key={key} className="text-center">
                        <div className="flex justify-center mb-4">
                          <Icon className="h-11 w-11 text-[#00653E]" />
                        </div>
                        <p className="text-3xl md:text-5xl font-bold text-black">{t(`stats.${key}Value`)}</p>
                        <p className="text-base md:text-xl text-[#A6A6A6] mt-2">{t(`stats.${key}Label`)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScaleIn>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="bg-[#FAFFFE]">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            <FadeUp className="text-center mb-16">
              <div className="inline-flex items-center border border-[#00151A] rounded-full px-5 py-1 mb-6">
                <span className="text-[#01151B] font-semibold text-base font-[family-name:var(--font-dm)]">
                  {t("howItWorks.pill")}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bold leading-tight text-[#0D200E]">
                {t("howItWorks.heading")}
              </h2>
              <p className="mt-4 text-lg md:text-2xl lg:text-[28px] text-black max-w-[964px] mx-auto">
                {t("howItWorks.subtitle")}
              </p>
            </FadeUp>

            <StaggerContainer stagger={0.15} className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {([0, 1, 2] as const).map((i) => {
                const cardTypes = ["categories", "code", "tracker"] as const;
                const cardType = cardTypes[i];
                const stepTitle = t(`howItWorks.steps.${i}.title`);
                const stepDesc = t(`howItWorks.steps.${i}.desc`);

                return (
                  <StaggerItem key={i}>
                    <div className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] overflow-hidden h-full flex flex-col">
                      {/* Dark top section with interactive mockup */}
                      <div className="bg-[#202B21] min-h-[320px] md:min-h-[360px] relative overflow-hidden flex items-center justify-center p-6">
                        {cardType === "categories" && (
                          <div className="w-full flex flex-col items-center gap-2.5">
                            {[[0, 1], [2, 3], [4, 5], [6]].map((group, gi) => (
                              <div key={gi} className="flex flex-wrap justify-center gap-2">
                                {group.map((ci) => {
                                  const catName = t(`howItWorks.cardCategories.${ci}`);
                                  return (
                                    <div key={ci} className="bg-[#00653E] rounded-full px-4 py-2">
                                      <span className="text-white/50 text-sm font-medium">{catName}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                            <div className="mt-3 w-16 h-16 rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] flex items-center justify-center">
                              <ArrowRight className="h-7 w-7 text-[#3F3F3F]" />
                            </div>
                          </div>
                        )}
                        {cardType === "code" && (
                          <div className="text-center">
                            <div className="bg-[#00653E] rounded-[20px] px-10 py-6 mb-4">
                              <p className="text-white font-semibold text-xl md:text-[28px] mb-3">{t("howItWorks.secureCode")}</p>
                              <div className="border border-white rounded px-8 py-3">
                                <p className="text-white font-semibold text-2xl md:text-[36px] tracking-[0.18em] font-mono">{t("howItWorks.secureCodePlaceholder")}</p>
                              </div>
                            </div>
                            <div className="mt-3 w-12 h-12 rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.15)] flex items-center justify-center mx-auto">
                              <ArrowRight className="h-6 w-6 text-[#3F3F3F]" />
                            </div>
                          </div>
                        )}
                        {cardType === "tracker" && (
                          <div className="w-full max-w-[420px]">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 rounded-full bg-[#00653E] shrink-0" />
                              <div className="bg-[#00653E] rounded-[20px] flex-1 h-[52px] flex items-center px-5">
                                <span className="text-[#B2B2B2] text-base font-semibold">{t("howItWorks.statusOpen")}</span>
                              </div>
                            </div>
                            <div className="ml-3 w-0.5 h-6 bg-gray-500/50" />
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-6 h-6 rounded-full bg-[#8DA18E]/50 shrink-0" />
                              <div className="bg-[#E1E1E1] rounded-[20px] flex-1 h-[52px] flex items-center px-5">
                                <span className="text-[#B2B2B2] text-base font-semibold">{t("howItWorks.statusUnderReview")}</span>
                              </div>
                            </div>
                            <div className="ml-3 w-0.5 h-6 bg-gray-500/50" />
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#8DA18E]/50 shrink-0" />
                              <div className="bg-[#E1E1E1] rounded-[20px] flex-1 h-[52px] flex items-center px-5">
                                <span className="text-[#B2B2B2] text-base font-semibold">{t("howItWorks.statusClosed")}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* White bottom section */}
                      <div className="p-8 flex-1">
                        <h3 className="text-2xl md:text-3xl lg:text-[40px] font-bold text-black leading-tight mb-4 whitespace-pre-line">
                          {stepTitle}
                        </h3>
                        <p className="text-base md:text-lg lg:text-2xl text-black leading-relaxed">{stepDesc}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Why Sawt Safe ── */}
        <section className="bg-[#FAFFFE]">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <SlideIn from="left">
                <div className="inline-flex items-center border border-black rounded-full px-5 py-1 mb-6">
                  <span className="text-black font-semibold text-base font-[family-name:var(--font-dm)]">
                    {t("whySawtSafe.pill")}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-[64px] font-bold leading-tight text-black mb-8">
                  {t("whySawtSafe.heading1")}
                  <br />
                  {t("whySawtSafe.heading2")}
                </h2>
                <p className="text-lg md:text-xl lg:text-[28px] text-black leading-[42px] mb-10">
                  {t("whySawtSafe.description")}
                </p>
                <div className="space-y-5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#006840] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-base md:text-lg lg:text-xl text-black">{t(`whySawtSafe.bullets.${i}`)}</span>
                    </div>
                  ))}
                </div>
              </SlideIn>
              <SlideIn from="right" delay={0.15}>
                <div className="relative rounded-[20px] overflow-hidden aspect-[738/661]">
                  <Image
                    src="/images/photos/trust-handshake.jpeg"
                    alt="Trusted partnership"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section id="features" className="bg-[#FAFFFE]">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            <FadeUp className="text-center mb-16">
              <div className="inline-flex items-center border border-[#00653E] rounded-full px-5 py-1 mb-6">
                <span className="text-[#00653E] font-semibold text-base font-[family-name:var(--font-dm)]">
                  {t("features.pill")}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bold leading-tight text-[#00653E]">
                {t("features.heading")}
              </h2>
              <p className="mt-4 text-lg md:text-xl lg:text-[28px] text-black max-w-[1115px] mx-auto">
                {t("features.subtitle")}
              </p>
            </FadeUp>

            <StaggerContainer stagger={0.1} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <StaggerItem key={i}>
                  <div className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] p-8 h-full">
                    <div className="relative h-14 w-14 mb-5">
                      <Image src={featureImages[i]} alt={t(`features.items.${i}.title`)} fill className="object-contain" sizes="56px" />
                    </div>
                    <h3 className="text-xl md:text-2xl lg:text-[28px] font-bold text-black mb-3 leading-tight">{t(`features.items.${i}.title`)}</h3>
                    <p className="text-base md:text-lg text-black leading-relaxed">{t(`features.items.${i}.desc`)}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Architecture ── */}
        <section className="bg-[#FAFFFE]">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <SlideIn from="left">
                <div className="inline-flex items-center border border-[#00653E] rounded-full px-5 py-1 mb-6">
                  <span className="text-[#00653E] font-semibold text-base font-[family-name:var(--font-dm)]">
                    {t("architecture.pill")}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bold leading-tight text-[#00653E] mb-8">
                  {t("architecture.heading1")}
                  <br />
                  {t("architecture.heading2")}
                </h2>
                <p className="text-lg md:text-xl lg:text-[28px] text-black leading-[42px] mb-10">
                  {t("architecture.description")}
                </p>
                <div className="space-y-5">
                  {[0, 1, 2, 3].map((i) => {
                    const Icon = architectureIcons[i];
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#00653E]/10 flex items-center justify-center shrink-0 mt-1">
                          <Icon className="h-5 w-5 text-[#00653E]" />
                        </div>
                        <p className="text-base md:text-lg lg:text-xl text-black leading-relaxed pt-1">{t(`architecture.bullets.${i}`)}</p>
                      </div>
                    );
                  })}
                </div>
              </SlideIn>

              <ScaleIn delay={0.2}>
                <div className="relative rounded-[20px] overflow-hidden aspect-4/3">
                  <Image
                    src="/images/backgrounds/security-bg.jpg"
                    alt="Zero-knowledge security architecture"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* ── Compliance ── */}
        <section id="compliance" className="bg-[#FAFFFE]">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            <FadeUp className="text-center mb-16">
              <div className="inline-flex items-center border border-[#00653E] rounded-full px-5 py-1 mb-6">
                <span className="text-[#00653E] font-semibold text-base font-[family-name:var(--font-dm)]">
                  {t("compliance.pill")}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bold leading-tight text-[#00653E]">
                {t("compliance.heading")}
              </h2>
              <p className="mt-4 text-lg md:text-xl lg:text-[28px] text-black max-w-[1115px] mx-auto">
                {t("compliance.subtitle")}
              </p>
            </FadeUp>

            <StaggerContainer stagger={0.12} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((i) => (
                <StaggerItem key={i}>
                  <div className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] p-8 text-center h-full">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <Image src={complianceBadges[i]} alt={t(`compliance.items.${i}.name`)} fill className="object-contain" sizes="80px" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-black mb-1">{t(`compliance.items.${i}.name`)}</h3>
                    <p className="text-sm md:text-base text-[#A6A6A6]">{t(`compliance.items.${i}.desc`)}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <FadeUp delay={0.3} className="mt-14 grid sm:grid-cols-3 gap-8 text-center">
              {[0, 1, 2].map((i) => {
                const Icon = complianceBottomIcons[i];
                return (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <Icon className="h-6 w-6 text-[#00653E]" />
                    <p className="text-base md:text-lg text-black">{t(`compliance.bottomStats.${i}`)}</p>
                  </div>
                );
              })}
            </FadeUp>
          </div>
        </section>

        {/* ── For Organizations ── */}
        <section className="bg-[#FAFFFE]">
          <div className="max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <SlideIn from="left" className="order-2 lg:order-1">
                <div className="inline-flex items-center border border-[#00653E] rounded-full px-5 py-1 mb-6">
                  <span className="text-[#00653E] font-semibold text-base font-[family-name:var(--font-dm)]">
                    {t("forOrganizations.pill")}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bold leading-tight text-[#00653E] mb-8">
                  {t("forOrganizations.heading")}
                </h2>
                <p className="text-lg md:text-xl lg:text-[28px] text-black leading-[42px] mb-10">
                  {t("forOrganizations.description")}
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const Icon = orgIcons[i];
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#00653E]/10 flex items-center justify-center shrink-0 mt-1">
                          <Icon className="h-5 w-5 text-[#00653E]" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-black">{t(`forOrganizations.features.${i}.title`)}</p>
                          <p className="text-sm text-[#A6A6A6] mt-1 leading-relaxed">{t(`forOrganizations.features.${i}.desc`)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SlideIn>
              <SlideIn from="right" delay={0.15} className="order-1 lg:order-2">
                <div className="relative rounded-[20px] overflow-hidden aspect-4/3">
                  <Image
                    src="/images/photos/security-biometric.jpg"
                    alt="Secure admin dashboard"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </SlideIn>
            </div>
          </div>
        </section>

        {/* ── AI Features ── */}
        <section id="ai" className="bg-[#01151C] relative overflow-hidden">
          <div className="relative max-w-[1660px] mx-auto px-6 lg:px-[130px] py-20 md:py-28">
            {/* Header */}
            <FadeUp className="text-center mb-16">
              <div className="inline-flex items-center border border-white/40 rounded-full px-5 py-1 mb-6">
                <span className="text-[#C8C8C8] font-semibold text-base font-[family-name:var(--font-dm)]">
                  {t("ai.pill")}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[56px] font-semibold leading-tight text-white">
                {t("ai.heading")}
              </h2>
              <p className="mt-6 text-lg md:text-[28px] md:leading-[34px] text-[#909090] max-w-[868px] mx-auto">
                {t("ai.subtitle")}
              </p>
            </FadeUp>

            {/* 2×2 Card Grid */}
            <StaggerContainer stagger={0.15} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {aiCards.map(({ key, image }) => (
                <StaggerItem key={key}>
                  <div className="bg-white rounded-[20px] shadow-[0_10px_20px_rgba(0,0,0,0.1)] overflow-hidden h-full flex flex-col">
                    {/* Image area with green-to-white gradient */}
                    <div className="relative w-full aspect-[2/1.1] flex items-center justify-center p-6 bg-gradient-to-b from-[#E5FFF5] to-white">
                      <Image
                        src={image}
                        alt={key}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
                    {/* Text area */}
                    <div className="px-8 pb-8 pt-4 flex-1">
                      <h3 className="text-2xl lg:text-[28px] xl:text-[36px] font-bold text-black leading-tight mb-3">
                        {t(`ai.${key}.title`)}
                      </h3>
                      <p className="text-base lg:text-lg xl:text-[20px] text-black/70 leading-relaxed">
                        {t(`ai.${key}.desc`)}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="bg-[#FAFFFE]">
          <div className="max-w-[1100px] mx-auto px-6 py-20 md:py-28">
            <FadeUp className="text-center mb-16">
              <div className="inline-flex items-center border border-[#00653E] rounded-full px-5 py-1 mb-6">
                <span className="text-[#00653E] font-semibold text-base font-[family-name:var(--font-dm)]">
                  {t("faq.pill")}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-[56px] font-bold leading-tight text-[#00653E]">
                {t("faq.heading")}
              </h2>
            </FadeUp>

            <StaggerContainer stagger={0.1} className="space-y-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <StaggerItem key={i}>
                  <div className="bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] p-8">
                    <h3 className="font-bold text-lg md:text-xl text-black mb-3 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-[#00653E] shrink-0 mt-0.5" />
                      {t(`faq.items.${i}.q`)}
                    </h3>
                    <p className="text-base md:text-lg text-[#666666] leading-relaxed pl-8">
                      {t(`faq.items.${i}.a`)}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── Final CTA (green rounded card) ── */}
        <section className="bg-[#FAFFFE] px-6 lg:px-[130px] py-12 md:py-20">
          <div className="max-w-[1660px] mx-auto">
            <ScaleIn>
              <div className="relative bg-[#00653E] rounded-[20px] overflow-hidden">
                {/* Mountain/nature background pattern */}
                <div className="absolute inset-0">
                  <Image
                    src="/images/backgrounds/cta-bg.png"
                    alt=""
                    fill
                    className="object-cover opacity-30 mix-blend-soft-light"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0F6040 0%, #01151C 100%)", opacity: 0.4 }} />
                </div>

                <div className="relative px-8 md:px-16 py-16 md:py-24 text-center">
                  <h2 className="text-3xl md:text-5xl lg:text-[76px] font-semibold text-white leading-tight mb-6">
                    {t("cta.heading")}
                  </h2>
                  <p className="text-lg md:text-2xl text-white max-w-[820px] mx-auto mb-10">
                    {t("cta.subtitle")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/report">
                      <button title="Raise a Concern" className="cursor-pointer flex items-center justify-center gap-2.5 bg-white text-[#00653E] px-9 py-3.5 rounded font-semibold text-lg md:text-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:bg-white/90 transition-colors w-full sm:w-auto">
                        <FileText className="h-5 w-5" />
                        {t("cta.raiseConcern")}
                      </button>
                    </Link>
                    <Link href="/track">
                      <button title="Follow up on report" className="cursor-pointer flex items-center justify-center gap-2.5 bg-[#01151C] text-white px-9 py-3.5 rounded font-semibold text-lg md:text-xl hover:bg-[#021F28] transition-colors w-full sm:w-auto border border-white/20">
                        <CheckCircle2 className="h-5 w-5" />
                        {t("cta.followUp")}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </div>
        </section>
      </main>

      {/* ── Footer (dark) ── */}
      <footer className="bg-[#01151C]">
        <FadeIn className="max-w-[1660px] mx-auto px-6 lg:px-[150px] py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="20" viewBox="0 0 22 25" fill="none">
                  <path d="M10.8 0L0 4.4V11C0 17.1 4.6 22.8 10.8 24.4C17 22.8 21.6 17.1 21.6 11V4.4L10.8 0Z" fill="white"/>
                  <rect x="8" y="8" width="5.6" height="5.6" rx="1" fill="#01151C"/>
                </svg>
                <span className="text-white font-bold text-lg">{tc("brand")}</span>
              </div>
              <p className="text-base text-white/60 leading-relaxed max-w-[340px]">
                {tc("brandTagline")}
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold text-base mb-4">{tc("footer.platform")}</h4>
              <ul className="space-y-3 text-base text-white/60">
                <li><Link href="/report" className="hover:text-white transition-colors">{tc("footer.raiseAConcern")}</Link></li>
                <li><Link href="/track" className="hover:text-white transition-colors">{tc("footer.checkStatus")}</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{tc("footer.howItWorks")}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{tc("footer.faqs")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-base mb-4">{tc("footer.security")}</h4>
              <ul className="space-y-3 text-base text-white/60">
                <li><a href="#features" className="hover:text-white transition-colors">{tc("footer.encryption")}</a></li>
                <li><a href="#compliance" className="hover:text-white transition-colors">{tc("footer.compliance")}</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">{tc("footer.architecture")}</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">{tc("footer.auditTrail")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-base mb-4">{tc("footer.organization")}</h4>
              <ul className="space-y-3 text-base text-white/60">
                <li><Link href="/admin/login" className="hover:text-white transition-colors">{tc("footer.adminPortal")}</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">{tc("footer.documentation")}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tc("footer.contact")}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{tc("footer.privacyPolicy")}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
              <p>&copy; {new Date().getFullYear()} {tc("footer.copyright")}</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-white transition-colors">{tc("footer.privacy")}</a>
                <a href="#" className="hover:text-white transition-colors">{tc("footer.terms")}</a>
                <a href="#" className="hover:text-white transition-colors">{tc("footer.securityLink")}</a>
              </div>
            </div>
          </div>
        </FadeIn>
      </footer>
    </div>
  );
}
