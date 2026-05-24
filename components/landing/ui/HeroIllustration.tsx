"use client";

import { motion, useReducedMotion } from "framer-motion";

type HeroIllustrationProps = {
  ariaLabel: string;
};

export function HeroIllustration({ ariaLabel }: HeroIllustrationProps) {
  const reduceMotion = useReducedMotion();
  const float = reduceMotion
    ? {}
    : {
        animate: { y: [0, -8, 0] },
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
      };

  return (
    <div className="relative mx-auto w-full max-w-lg" role="img" aria-label={ariaLabel}>
      <svg
        viewBox="0 0 480 400"
        className="hero-illustration h-auto w-full drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-highlight)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand-secondary)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="building" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-secondary)" />
            <stop offset="100%" stopColor="var(--brand-primary)" />
          </linearGradient>
        </defs>
        <rect width="480" height="400" fill="url(#sky)" rx="24" />
        <circle cx="400" cy="70" r="36" fill="var(--brand-highlight)" opacity="0.5" />
        <g fill="var(--brand-success)" opacity="0.85">
          <ellipse cx="70" cy="320" rx="8" ry="50" />
          <path d="M70 270 Q40 250 55 230 Q70 245 70 270" />
          <path d="M70 270 Q100 250 85 230 Q70 245 70 270" />
          <ellipse cx="410" cy="310" rx="7" ry="42" />
          <path d="M410 268 Q385 252 398 238 Q410 250 410 268" />
          <path d="M410 268 Q435 252 422 238 Q410 250 410 268" />
        </g>
        <ellipse
          cx="240"
          cy="360"
          rx="200"
          ry="28"
          fill="var(--brand-primary)"
          opacity="0.12"
        />
        <motion.g {...float}>
          <rect x="140" y="120" width="200" height="200" rx="8" fill="url(#building)" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={160 + col * 55}
                y={140 + row * 42}
                width="38"
                height="28"
                rx="3"
                fill="var(--brand-highlight)"
                opacity="0.45"
              />
            )),
          )}
          <rect
            x="215"
            y="260"
            width="50"
            height="60"
            rx="4"
            fill="var(--brand-surface)"
            opacity="0.9"
          />
          <path d="M140 120 L240 80 L340 120" fill="var(--brand-secondary)" />
          <rect x="220" y="95" width="40" height="30" rx="4" fill="#fff" opacity="0.9" />
          <path
            d="M225 110 h30 M240 95 v30"
            stroke="var(--brand-primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
        <motion.g
          {...(reduceMotion
            ? {}
            : {
                animate: { x: [0, 6, 0] },
                transition: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                },
              })}
        >
          <rect
            x="48"
            y="268"
            width="88"
            height="44"
            rx="8"
            fill="#fff"
            stroke="var(--brand-primary)"
            strokeWidth="2"
          />
          <rect
            x="48"
            y="268"
            width="36"
            height="44"
            rx="8"
            fill="var(--brand-success)"
            opacity="0.9"
          />
          <circle cx="68" cy="318" r="10" fill="var(--brand-gray-700)" />
          <circle cx="116" cy="318" r="10" fill="var(--brand-gray-700)" />
          <path
            d="M78 285 h20 M88 275 v20"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
        <path
          d="M350 300 L380 250 L410 300 Z"
          fill="var(--brand-secondary)"
          opacity="0.25"
        />
        <path
          d="M370 300 L395 265 L420 300 Z"
          fill="var(--brand-primary)"
          opacity="0.2"
        />
      </svg>
    </div>
  );
}
