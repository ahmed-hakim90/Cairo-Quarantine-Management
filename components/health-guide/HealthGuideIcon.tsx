import type { HealthGuideIconId } from "@/lib/health-guides/icon-ids";

type HealthGuideIconProps = {
  id: HealthGuideIconId;
  className?: string;
};

const iconClass = "h-12 w-12 text-gov-accent";

export function HealthGuideIcon({ id, className }: HealthGuideIconProps) {
  const cls = className ?? iconClass;
  switch (id) {
    case "heartPulse":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
            opacity={0.25}
          />
          <path
            d="M4 12h3l2-3 2 6 2-4 2 3h3"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "kaabaRitual":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 2.18 5.5 2.75v7.74L12 19.82l-5.5-2.75V7.93L12 5.18ZM11 9v6h2V9h-2Z" />
          <path
            d="M3 20h18"
            stroke="currentColor"
            strokeWidth={1.2}
            fill="none"
            opacity={0.6}
          />
        </svg>
      );
    case "peopleShield":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      );
    case "virusShield":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2l7 3v6c0 4.5-3.2 8.2-7 9-3.8-.8-7-4.5-7-9V5l7-3z"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="currentColor"
            fillOpacity={0.12}
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "syringeVial":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 4l6 6M9.5 8.5L4 14m5.5-5.5L8 6m1.5 1.5L15 12m-3-3l3 3M6 18l-1.5 1.5M4 20l2-2"
          />
          <rect x="15" y="3" width="5" height="8" rx="1" fill="currentColor" fillOpacity={0.2} stroke="currentColor" />
        </svg>
      );
    case "covid":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="4" opacity={0.3} />
          <circle cx="12" cy="4" r="1.5" />
          <circle cx="12" cy="20" r="1.5" />
          <circle cx="4" cy="12" r="1.5" />
          <circle cx="20" cy="12" r="1.5" />
          <circle cx="6.3" cy="6.3" r="1.2" opacity={0.7} />
          <circle cx="17.7" cy="17.7" r="1.2" opacity={0.7} />
          <circle cx="17.7" cy="6.3" r="1.2" opacity={0.7} />
          <circle cx="6.3" cy="17.7" r="1.2" opacity={0.7} />
        </svg>
      );
    case "lungs":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v4m0 12v-4M8 8c-2 0-3 2-3 5v3c0 2 2 4 4 4m7-12c2 0 3 2 3 5v3c0 2-2 4-4 4"
          />
        </svg>
      );
    case "otherVaccines":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2l7 3v6c0 4.5-3.2 8.2-7 9-3.8-.8-7-4.5-7-9V5l7-3z"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="currentColor"
            fillOpacity={0.15}
          />
          <path d="M12 8v4m0 3h.01" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
    case "handWash":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 11V7a2 2 0 114 0v1m0 0V7a2 2 0 114 0v4m-4 0h8m-8 0a4 4 0 004 4h0a4 4 0 004-4m-8 0V9"
          />
          <circle cx="6" cy="5" r="1" fill="currentColor" opacity={0.5} />
          <circle cx="9" cy="3" r="0.8" fill="currentColor" opacity={0.4} />
        </svg>
      );
    case "clipboard":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      );
    case "doctor":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
          <path strokeLinecap="round" d="M12 11v4m-2-2h4" />
        </svg>
      );
    case "calendar":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l2 2 4-4" />
        </svg>
      );
    case "water":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3c-3 4-6 7-6 11a6 6 0 1012 0c0-4-3-7-6-11z"
          />
        </svg>
      );
    case "mask":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4 10c0-1 2-3 8-3s8 2 8 3v2c0 2-2 4-8 4s-8-2-8-4v-2zm2 2c1.5 1 4.5 1.5 6 1.5s4.5-.5 6-1.5" opacity={0.3} fill="none" stroke="currentColor" strokeWidth={1} />
          <path d="M6 9c1.5-.5 4-.8 6-.8s4.5.3 6 .8M6 15c1.5.5 4 .8 6 .8s4.5-.3 6-.8" fill="none" stroke="currentColor" strokeWidth={1.2} />
        </svg>
      );
    case "crowd":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.09 9.09 0 003.742-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      );
    case "walk":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM12 10.5v3.75m0 0l-2.25 4.5M12 14.25l2.25 4.5M9 12.75h6"
          />
        </svg>
      );
    case "sun":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      );
    case "tissue":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <path strokeLinecap="round" d="M14 4v6l-2 2-2-2V4" />
        </svg>
      );
    case "personalItems":
      return (
        <svg
          className={cls}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.036l1.5 9a1.5 1.5 0 01-1.48 1.776H4.874a1.5 1.5 0 01-1.48-1.776l1.5-9M8.25 10.5h7.5"
          />
        </svg>
      );
    case "chronicCare":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
            opacity={0.25}
          />
          <path
            d="M4 12h3l2-3 2 6 2-4 2 3h3"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
