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
        className="h-auto w-full drop-shadow-xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2A7CC7" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="building" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A7CC7" />
            <stop offset="100%" stopColor="#0B4A8B" />
          </linearGradient>
        </defs>
        <rect width="480" height="400" fill="url(#sky)" rx="24" />
        {/* sun */}
        <circle cx="400" cy="70" r="36" fill="#4FC3F7" opacity="0.5" />
        {/* palms */}
        <g fill="#1FA971" opacity="0.85">
          <ellipse cx="70" cy="320" rx="8" ry="50" />
          <path d="M70 270 Q40 250 55 230 Q70 245 70 270" />
          <path d="M70 270 Q100 250 85 230 Q70 245 70 270" />
          <ellipse cx="410" cy="310" rx="7" ry="42" />
          <path d="M410 268 Q385 252 398 238 Q410 250 410 268" />
          <path d="M410 268 Q435 252 422 238 Q410 250 410 268" />
        </g>
        {/* ground */}
        <ellipse cx="240" cy="360" rx="200" ry="28" fill="#0B4A8B" opacity="0.12" />
        {/* building */}
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
                fill="#4FC3F7"
                opacity="0.45"
              />
            )),
          )}
          <rect x="215" y="260" width="50" height="60" rx="4" fill="#F5F9FD" opacity="0.9" />
          <path
            d="M140 120 L240 80 L340 120"
            fill="#2A7CC7"
          />
          <rect x="220" y="95" width="40" height="30" rx="4" fill="#fff" opacity="0.9" />
          <path
            d="M225 110 h30 M240 95 v30"
            stroke="#0B4A8B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
        {/* ambulance */}
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
          <rect x="48" y="268" width="88" height="44" rx="8" fill="#fff" stroke="#0B4A8B" strokeWidth="2" />
          <rect x="48" y="268" width="36" height="44" rx="8" fill="#1FA971" opacity="0.9" />
          <circle cx="68" cy="318" r="10" fill="#374151" />
          <circle cx="116" cy="318" r="10" fill="#374151" />
          <path d="M78 285 h20 M88 275 v20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
        {/* pyramids hint */}
        <path d="M350 300 L380 250 L410 300 Z" fill="#2A7CC7" opacity="0.25" />
        <path d="M370 300 L395 265 L420 300 Z" fill="#0B4A8B" opacity="0.2" />
      </svg>
    </div>
  );
}
