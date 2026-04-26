"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [
  { key: "LOW", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { key: "MEDIUM", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { key: "HIGH", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { key: "CRITICAL", color: "bg-red-500/20 text-red-400 border-red-500/30" },
] as const;

const LINES = [
  "██████ ████ ██████████ ████ ███",
  "████ ██████ ████████ ██ ██████",
  "███████ ████ ██ ████████████",
];

type Phase = "idle" | "scanning" | "result";

export function AiSeverityDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeLevel, setActiveLevel] = useState(3); // CRITICAL

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setPhase("result");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    function cycle() {
      setPhase("idle");
      timeout = setTimeout(() => {
        setPhase("scanning");
        timeout = setTimeout(() => {
          setActiveLevel((prev) => (prev + 1) % 4);
          setPhase("result");
          timeout = setTimeout(cycle, 2500);
        }, 1200);
      }, 800);
    }

    cycle();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative h-[200px] flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Blurred report lines */}
      <AnimatePresence mode="wait">
        {(phase === "idle" || phase === "scanning") && (
          <motion.div
            key="lines"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6"
          >
            {LINES.map((line, i) => (
              <div
                key={i}
                className="text-white/10 text-sm font-mono tracking-[0.2em] blur-[2px] whitespace-nowrap overflow-hidden max-w-full"
              >
                {line}
              </div>
            ))}

            {/* Scanning line */}
            {phase === "scanning" && (
              <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00653E] to-transparent"
                initial={{ top: "20%" }}
                animate={{ top: "80%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result: severity badge */}
      <AnimatePresence>
        {phase === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Large badge */}
            <div
              className={`px-5 py-2 rounded-lg border text-lg font-bold tracking-wide ${LEVELS[activeLevel].color}`}
            >
              {LEVELS[activeLevel].key}
            </div>

            {/* Level bar */}
            <div className="flex items-center gap-1.5">
              {LEVELS.map((level, i) => (
                <div
                  key={level.key}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= activeLevel
                      ? i === activeLevel
                        ? `w-8 ${level.color.split(" ")[0]}`
                        : "w-4 bg-white/10"
                      : "w-4 bg-white/5"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
