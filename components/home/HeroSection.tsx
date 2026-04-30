import Image from "next/image";
import type { Messages } from "@/lib/i18n/messages";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80";

type HeroSectionProps = {
  content: Messages["hero"];
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section
      className="relative min-h-[min(100vh,520px)] overflow-hidden bg-gov-navy-deep"
      aria-labelledby="hero-title"
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center opacity-40"
        sizes="100vw"
        role="presentation"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-gov-navy-deep/90 via-gov-navy/85 to-gov-navy-deep/95"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl flex-col justify-end gap-6 px-4 py-16 sm:min-h-[min(100vh,520px)] sm:justify-center sm:py-20">
        <h1
          id="hero-title"
          className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl"
        >
          {content.title}
        </h1>
        <div className="max-w-2xl space-y-4 text-base leading-relaxed text-white/95 sm:text-lg">
          <p>
            <span className="font-semibold text-gov-accent-muted">
              {content.visionLabel}{" "}
            </span>
            {content.vision}
          </p>
          <p>
            <span className="font-semibold text-gov-accent-muted">
              {content.missionLabel}{" "}
            </span>
            {content.mission}
          </p>
        </div>
      </div>
    </section>
  );
}
