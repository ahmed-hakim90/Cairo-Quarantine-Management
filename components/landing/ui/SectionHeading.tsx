type SectionHeadingProps = {
  id?: string;
  heading: string;
  intro?: string;
  className?: string;
};

export function SectionHeading({
  id,
  heading,
  intro,
  className = "",
}: SectionHeadingProps) {
  return (
    <header className={`mx-auto max-w-3xl text-center ${className}`}>
      <h2
        id={id}
        className="font-heading text-2xl font-bold text-landing-primary sm:text-3xl"
      >
        {heading}
      </h2>
      {intro ? (
        <p className="mt-3 text-base leading-relaxed text-landing-primary/75 sm:text-lg">
          {intro}
        </p>
      ) : null}
    </header>
  );
}
