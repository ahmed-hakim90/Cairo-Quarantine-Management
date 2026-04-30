import Image from "next/image";
import type { Messages } from "@/lib/i18n/messages";

/** Same Unsplash asset as the original hero (wing / aerial — pre-refactor). */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80";

type HeroSectionProps = {
  content: Messages["hero"];
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section
      className="overflow-hidden bg-gov-navy-deep"
      aria-labelledby="hero-title"
    >
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 pt-14 sm:gap-10 sm:pb-14 sm:pt-16 md:pt-20">
        <div className="space-y-6">
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

        <div className="relative w-full" aria-hidden>
          <div className="relative aspect-[16/10] min-h-[200px] overflow-hidden rounded-xl shadow-xl ring-1 ring-white/15 sm:aspect-[21/9] sm:min-h-[240px] md:min-h-[280px]">
            <Image
              src={HERO_IMAGE}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1152px"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-gov-navy/80 via-gov-accent/20 to-gov-navy-deep/90" />
            <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-gov-navy-deep/85 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
