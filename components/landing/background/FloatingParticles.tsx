"use client";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  top: `${(i * 23 + 11) % 100}%`,
  size: 4 + (i % 3) * 2,
  delay: `${(i % 6) * 0.7}s`,
  duration: `${12 + (i % 5) * 2}s`,
}));

export function FloatingParticles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
      aria-hidden
    >
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="landing-pulse-glow absolute rounded-full bg-landing-accent/40"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
