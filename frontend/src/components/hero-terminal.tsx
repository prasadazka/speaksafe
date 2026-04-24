"use client";

import { useEffect, useState } from "react";
import { Shield, Lock, Fingerprint, CheckCircle2, Zap, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

interface TerminalLine {
  textKey: string;
  type: "system" | "success" | "marketing" | "highlight";
  icon?: React.ElementType;
}

const lineDefs: TerminalLine[] = [
  { textKey: "establishing", type: "system" },
  { textKey: "encryptionVerified", type: "success", icon: Lock },
  { textKey: "identityStripped", type: "success", icon: Shield },
  { textKey: "zeroData", type: "success", icon: Fingerprint },
  { textKey: "anonymousConnection", type: "success", icon: CheckCircle2 },
  { textKey: "voiceMatters", type: "marketing" },
  { textKey: "speakFreely", type: "highlight" },
  { textKey: "channelSecured", type: "success", icon: Zap },
  { textKey: "noTrace", type: "highlight" },
  { textKey: "trustedWorldwide", type: "marketing" },
  { textKey: "zeroBreaches", type: "success", icon: Eye },
  { textKey: "courageContagious", type: "highlight" },
];

export function HeroTerminal({ className }: { className?: string }) {
  const t = useTranslations("components");
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [charIndex, setCharIndex] = useState<number>(0);

  const lines = lineDefs.map((def) => ({
    ...def,
    text: t(`terminal.lines.${def.textKey}`),
  }));

  useEffect(() => {
    if (visibleLines >= lines.length) {
      const restartTimer = setTimeout(() => {
        setVisibleLines(0);
        setCharIndex(0);
      }, 4000);
      return () => clearTimeout(restartTimer);
    }

    const currentLine = lines[visibleLines];
    if (charIndex < currentLine.text.length) {
      const speed = currentLine.type === "system" ? 30 : 22;
      const timer = setTimeout(() => {
        setCharIndex((c) => c + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      const pause = currentLine.type === "highlight" ? 1200 : currentLine.type === "marketing" ? 900 : 500;
      const timer = setTimeout(() => {
        setVisibleLines((v) => v + 1);
        setCharIndex(0);
      }, pause);
      return () => clearTimeout(timer);
    }
  }, [visibleLines, charIndex, lines]);

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "system":
        return "text-muted-foreground";
      case "success":
        return "text-primary";
      case "marketing":
        return "text-foreground/80";
      case "highlight":
        return "text-foreground font-semibold";
    }
  };

  const startIdx = Math.max(0, visibleLines - 7);
  const displayLines = lines.slice(startIdx, visibleLines + 1);

  return (
    <div className={className}>
      <div className="relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-card/80">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">{t("terminal.header")}</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary/70 font-mono">{t("terminal.encrypted")}</span>
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-5 font-mono text-sm space-y-2.5 min-h-[280px] sm:min-h-[320px]">
          {displayLines.map((line, idx) => {
            const globalIdx = startIdx + idx;
            const isCurrentLine = globalIdx === visibleLines;
            const displayText = isCurrentLine
              ? line.text.slice(0, charIndex)
              : line.text;

            return (
              <div
                key={`${globalIdx}-${line.textKey}`}
                className={`flex items-start gap-2.5 transition-opacity duration-300 ${
                  isCurrentLine ? "opacity-100" : "opacity-80"
                }`}
              >
                {line.type === "success" && line.icon ? (
                  <line.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                ) : line.type === "system" ? (
                  <span className="text-muted-foreground/60 shrink-0">$</span>
                ) : line.type === "marketing" ? (
                  <span className="text-foreground/40 shrink-0">&gt;</span>
                ) : (
                  <span className="text-primary shrink-0">&gt;</span>
                )}

                <span className={getLineColor(line.type)}>
                  {displayText}
                  {isCurrentLine && (
                    <span className="inline-block w-[2px] h-[14px] bg-primary ml-0.5 align-middle animate-pulse" />
                  )}
                </span>
              </div>
            );
          })}

          {visibleLines >= lines.length && (
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground/60">$</span>
              <span className="inline-block w-[2px] h-[14px] bg-primary animate-pulse" />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
