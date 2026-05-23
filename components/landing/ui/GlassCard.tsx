"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
};

const motionByTag = {
  div: motion.div,
  article: motion.article,
  li: motion.li,
} as const;

export function GlassCard({
  children,
  className = "",
  as: Tag = "div",
}: GlassCardProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motionByTag[Tag];

  return (
    <MotionTag
      className={`glass-panel rounded-2xl p-6 transition-shadow ${className}`}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {children}
    </MotionTag>
  );
}
