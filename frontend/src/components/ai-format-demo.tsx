"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BEFORE =
  "my boss john took the money from the safe on march 5 and he told me not to tell anyone about it he does this every month";

const AFTER =
  "On March 5th, I witnessed my manager, John, remove funds from the office safe. He instructed me not to disclose this to anyone. This appears to be a recurring incident, happening on a monthly basis.";

type Phase = "before" | "shimmer" | "after";

export function AiFormatDemo() {
  const [phase, setPhase] = useState<Phase>("before");

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setPhase("after");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    function cycle() {
      setPhase("before");
      timeout = setTimeout(() => {
        setPhase("shimmer");
        timeout = setTimeout(() => {
          setPhase("after");
          timeout = setTimeout(cycle, 3000);
        }, 1000);
      }, 2000);
    }

    cycle();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative h-[200px] flex flex-col items-center justify-center overflow-hidden select-none px-5">
      <AnimatePresence mode="wait">
        {phase === "before" && (
          <motion.div
            key="before"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 w-full"
          >
            <p className="text-white/30 text-xs font-mono tracking-wide uppercase">
              Original
            </p>
            <p className="text-white/50 text-sm leading-relaxed font-mono">
              {BEFORE}
            </p>
          </motion.div>
        )}

        {phase === "shimmer" && (
          <motion.div
            key="shimmer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 w-full relative"
          >
            <p className="text-white/30 text-xs font-mono tracking-wide uppercase">
              Enhancing...
            </p>
            <div className="relative overflow-hidden">
              <p className="text-white/20 text-sm leading-relaxed font-mono blur-[1px]">
                {BEFORE}
              </p>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00653E]/20 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {phase === "after" && (
          <motion.div
            key="after"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 w-full"
          >
            <p className="text-[#00653E] text-xs font-mono tracking-wide uppercase">
              Enhanced
            </p>
            <p className="text-white/70 text-sm leading-relaxed">
              {AFTER}
            </p>
            {/* Accept / Keep buttons */}
            <div className="flex items-center gap-2 pt-1">
              <div className="px-3 py-1 rounded-md bg-[#00653E]/20 text-[#00653E] text-xs font-semibold border border-[#00653E]/30">
                Accept
              </div>
              <div className="px-3 py-1 rounded-md bg-white/5 text-white/30 text-xs font-medium border border-white/10">
                Keep Original
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
