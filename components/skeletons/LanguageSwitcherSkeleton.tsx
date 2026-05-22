import { Skeleton } from "@/components/ui/Skeleton";

export function LanguageSwitcherSkeleton({
  variant = "header",
}: {
  variant?: "header" | "mobile";
}) {
  const className =
    variant === "mobile"
      ? "inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 sm:size-11"
      : "inline-flex min-h-10 min-w-[2.75rem] shrink-0 items-center justify-center gap-1.5 rounded-md border border-white/25 bg-white/10 px-2 sm:min-h-11 sm:min-w-[3.25rem] sm:px-3";

  return (
    <span className={className} aria-hidden>
      <Skeleton className="size-5 rounded-sm bg-white/20" decorative />
      <Skeleton className="hidden h-3 w-6 rounded sm:inline bg-white/20" decorative />
    </span>
  );
}
