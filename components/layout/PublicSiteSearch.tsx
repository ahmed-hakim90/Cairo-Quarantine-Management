"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type {
  SiteKnowledgeResultType,
  SiteSearchResult,
} from "@/lib/chat/site-knowledge";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n/messages";
import { lockDocumentScroll } from "@/lib/ui/scroll-lock";

type PublicSiteSearchProps = {
  locale: Locale;
  labels: Messages["bottomNav"];
  nav: Messages["nav"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type QuickLink = {
  href: string;
  label: string;
};

function isDeepLinkHref(href: string): boolean {
  return (
    href.includes("#") || href.includes("country=") || href.includes("?q=")
  );
}

function SearchIcon({ className = "size-6 text-brand-primary/45" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  );
}

function resultTypeLabel(
  type: SiteKnowledgeResultType,
  labels: Messages["bottomNav"],
): string {
  switch (type) {
    case "office":
      return labels.resultTypeOffice;
    case "country":
      return labels.resultTypeCountry;
    case "vaccine":
      return labels.resultTypeVaccine;
    case "section":
      return labels.resultTypeSection;
    default:
      return labels.resultTypePage;
  }
}

export function PublicSiteSearchTrigger({
  labels,
  onClick,
  variant = "bottom",
}: {
  labels: Messages["bottomNav"];
  onClick: () => void;
  variant?: "bottom" | "header";
}) {
  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={labels.searchAria}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-brand-primary/20 bg-brand-primary/5 px-2.5 text-sm font-medium leading-none text-brand-primary transition-colors hover:bg-brand-primary/10 min-h-10 sm:min-h-11 sm:px-3"
      >
        <SearchIcon className="size-[1.125rem] shrink-0 text-brand-primary" />
        <span className="hidden text-xs font-semibold tracking-wide sm:inline">
          {labels.search}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={labels.searchAria}
      className="flex min-h-8 flex-col items-center justify-center gap-0.5 px-1 py-0.5 text-[10px] font-semibold leading-tight text-brand-primary/50 transition-colors sm:text-[11px]"
    >
      <SearchIcon />
      <span className="max-w-[4.25rem] truncate text-center">{labels.search}</span>
    </button>
  );
}

export function PublicSiteSearch({
  locale,
  labels,
  nav,
  open,
  onOpenChange,
}: PublicSiteSearchProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SiteSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogHeadingId = useId();
  const dialogId = useId();

  const quickLinks: QuickLink[] = [
    { href: "/international-traveler", label: nav.international },
    { href: "/hajj-umrah", label: nav.hajjUmrah },
    { href: "/booking", label: nav.bookVaccination },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.removeAttribute("data-site-search-open");
      return;
    }

    document.body.setAttribute("data-site-search-open", "");
    return lockDocumentScroll();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          locale,
          q: trimmed,
          limit: "10",
        });
        const res = await fetch(`/api/site-search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { results?: SiteSearchResult[] };
        setResults(data.results ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [locale, open, query]);

  const navigateTo = useCallback(
    (href: string) => {
      onOpenChange(false);
      const path = `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
      if (isDeepLinkHref(href)) {
        window.location.assign(path);
        return;
      }
      router.push(path);
    },
    [locale, onOpenChange, router],
  );

  const submitSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    if (results.length > 0) {
      navigateTo(results[0]!.href);
    }
  }, [loading, navigateTo, query, results]);

  if (!open || !mounted) return null;

  const trimmed = query.trim();

  return createPortal(
    <SearchOverlay
      dialogId={dialogId}
      dialogHeadingId={dialogHeadingId}
      labels={labels}
      query={query}
      setQuery={setQuery}
      inputRef={inputRef}
      loading={loading}
      results={results}
      quickLinks={quickLinks}
      trimmed={trimmed}
      onClose={() => onOpenChange(false)}
      onNavigate={navigateTo}
      onSubmitSearch={submitSearch}
    />,
    document.body,
  );
}

function SearchOverlay({
  dialogId,
  dialogHeadingId,
  labels,
  query,
  setQuery,
  inputRef,
  loading,
  results,
  quickLinks,
  trimmed,
  onClose,
  onNavigate,
  onSubmitSearch,
}: {
  dialogId: string;
  dialogHeadingId: string;
  labels: Messages["bottomNav"];
  query: string;
  setQuery: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  results: SiteSearchResult[];
  quickLinks: QuickLink[];
  trimmed: string;
  onClose: () => void;
  onNavigate: (href: string) => void;
  onSubmitSearch: () => void;
}) {
  return (
    <SearchDialogRoot onClose={onClose}>
      <div
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogHeadingId}
        className="relative z-10 flex w-full max-h-[100dvh] flex-col bg-white shadow-2xl pt-[max(0.75rem,env(safe-area-inset-top))] md:max-h-[min(85dvh,40rem)] md:max-w-xl md:rounded-xl md:pt-0 md:shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-gray-200 px-4 py-3">
          <h2
            id={dialogHeadingId}
            className="min-w-0 flex-1 font-heading text-lg font-bold leading-tight text-brand-primary"
          >
            {labels.searchDialogTitle}
          </h2>
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand-gray-200 text-brand-gray-700 transition-colors hover:bg-brand-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
            aria-label={labels.closeSearchAria}
            onClick={onClose}
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22">
              <path
                d="M5 5l12 12M17 5L5 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-brand-gray-200 px-4 py-3">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmitSearch();
              }
            }}
            placeholder={labels.searchPlaceholder}
            className="min-h-12 w-full rounded-lg border border-brand-gray-200 bg-white px-4 text-base text-brand-primary shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>

        <SearchDialogBody
          trimmed={trimmed}
          loading={loading}
          labels={labels}
          quickLinks={quickLinks}
          results={results}
          onNavigate={onNavigate}
        />
      </div>
    </SearchDialogRoot>
  );
}

function SearchDialogRoot({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center md:items-center md:p-4"
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px] touch-none"
        onClick={onClose}
      />
      {children}
    </div>
  );
}

function SearchDialogBody({
  trimmed,
  loading,
  labels,
  quickLinks,
  results,
  onNavigate,
}: {
  trimmed: string;
  loading: boolean;
  labels: Messages["bottomNav"];
  quickLinks: QuickLink[];
  results: SiteSearchResult[];
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {!trimmed ? (
        <QuickLinksSection
          heading={labels.quickLinksHeading}
          links={quickLinks}
          onNavigate={onNavigate}
        />
      ) : loading ? (
        <p className="px-3 py-4 text-sm text-brand-gray-600">…</p>
      ) : results.length === 0 ? (
        <p className="px-3 py-4 text-sm text-brand-gray-600">{labels.noResults}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => onNavigate(result.href)}
                className="flex w-full flex-col gap-0.5 rounded-lg px-3 py-3 text-start transition-colors hover:bg-brand-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                    {resultTypeLabel(result.resultType, labels)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-brand-primary">
                    {result.title}
                  </span>
                </span>
                {result.subtitle ? (
                  <span className="line-clamp-2 text-sm leading-snug text-brand-gray-600">
                    {result.subtitle}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickLinksSection({
  heading,
  links,
  onNavigate,
}: {
  heading: string;
  links: QuickLink[];
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="px-2 py-1">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray-500">
        {heading}
      </p>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <button
              type="button"
              onClick={() => onNavigate(link.href)}
              className="w-full rounded-lg px-3 py-3 text-start text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
