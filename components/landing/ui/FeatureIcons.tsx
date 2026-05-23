import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = "h-10 w-10 text-landing-secondary";

export function IconCalendarHealth(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14v4M10 16h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M4 21V5a1 1 0 011-1h5v17M10 21V3h10v18M6 9h2M6 13h2M14 9h2M14 13h2M14 17h2" strokeLinecap="round" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLink(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5" strokeLinecap="round" />
      <path d="M14 11a5 5 0 00-7.07 0L5.52 12.41a5 5 0 007.07 7.07L14 19" strokeLinecap="round" />
    </svg>
  );
}

export function IconQr(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3" />
    </svg>
  );
}

export function IconDashboard(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="10" width="8" height="11" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

export const FEATURE_ICONS = [
  IconCalendarHealth,
  IconBuilding,
  IconClipboard,
  IconLink,
  IconQr,
  IconDashboard,
] as const;

export function IconShield(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" />
    </svg>
  );
}

export function IconPrivacy(props: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10a3 3 0 116 0c0 2-3 2-3 4M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}

export const SECURITY_ICONS = [IconLock, IconShield, IconPrivacy, IconQr] as const;
