type SplashProgressTrackProps = {
  className?: string;
};

export function SplashProgressTrack({ className = "" }: SplashProgressTrackProps) {
  return (
    <div
      className={`mx-auto h-1 w-[min(16rem,40vw)] overflow-hidden rounded-full bg-white/15 ${className}`.trim()}
      aria-hidden
    >
      <div className="splash-bar-animate h-full w-2/5 rounded-full bg-gov-accent" />
    </div>
  );
}
