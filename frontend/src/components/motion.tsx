"use client";

import { motion, type Variants } from "framer-motion";
import type { ComponentPropsWithoutRef } from "react";

/* ── Shared viewport config ── */
const viewport = { once: true, margin: "-60px" } as const;

/* ── Fade-up (default section animation) ── */
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

type FadeUpProps = ComponentPropsWithoutRef<typeof motion.div> & {
  delay?: number;
  duration?: number;
};

export function FadeUp({
  delay = 0,
  duration = 0.6,
  children,
  ...props
}: FadeUpProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Fade-in (no vertical movement) ── */
const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function FadeIn({
  delay = 0,
  duration = 0.5,
  children,
  ...props
}: FadeUpProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Slide-in from left or right ── */
type SlideInProps = FadeUpProps & {
  from?: "left" | "right";
};

export function SlideIn({
  from = "left",
  delay = 0,
  duration = 0.7,
  children,
  ...props
}: SlideInProps) {
  const variants: Variants = {
    hidden: { opacity: 0, x: from === "left" ? -48 : 48 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Scale-in (pop) ── */
export function ScaleIn({
  delay = 0,
  duration = 0.5,
  children,
  ...props
}: FadeUpProps) {
  const variants: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger container + child ── */
type StaggerProps = ComponentPropsWithoutRef<typeof motion.div> & {
  stagger?: number;
  delayChildren?: number;
};

export function StaggerContainer({
  stagger = 0.1,
  delayChildren = 0,
  children,
  ...props
}: StaggerProps) {
  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  ...props
}: ComponentPropsWithoutRef<typeof motion.div>) {
  return (
    <motion.div
      variants={fadeUpVariants}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
