"use client";

import { useEffect, useRef, useState } from "react";

type TtsState = "idle" | "speaking" | "paused";

const LANG_MAP: Record<string, string> = {
  ar: "ar-EG",
  en: "en-US",
  zh: "zh-CN",
};

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
      <path d="M6 6h12v12H6z" />
    </svg>
  );
}

type Props = {
  locale: string;
  labels: {
    read: string;
    pause: string;
    resume: string;
    stop: string;
    unsupported: string;
  };
};

export function FloatingTextToSpeechButton({ locale, labels }: Props) {
  const [state, setState] = useState<TtsState>("idle");
  const [supported] = useState(
    () => typeof window === "undefined" || "speechSynthesis" in window,
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!supported) return null;

  function getPageText(): string {
    const el = document.getElementById("main-content");
    if (!el) return "";
    return (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim() ?? "";
  }

  function handleMainClick() {
    if (!("speechSynthesis" in window)) return;

    if (state === "speaking") {
      window.speechSynthesis.pause();
      setState("paused");
      return;
    }

    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("speaking");
      return;
    }

    window.speechSynthesis.cancel();
    const text = getPageText();
    if (!text) return;

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG_MAP[locale] ?? "ar-EG";
    utt.rate = 0.9;
    utt.onend = () => setState("idle");
    utt.onerror = () => setState("idle");
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setState("speaking");
  }

  function handleStop() {
    window.speechSynthesis?.cancel();
    setState("idle");
  }

  const mainLabel =
    state === "speaking"
      ? labels.pause
      : state === "paused"
        ? labels.resume
        : labels.read;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleMainClick}
        aria-label={mainLabel}
        title={mainLabel}
        className="flex size-14 items-center justify-center rounded-full bg-gov-navy text-white shadow-lg shadow-gov-gray-900/25 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gov-navy active:scale-95"
      >
        {state === "speaking" ? (
          <PauseIcon />
        ) : state === "paused" ? (
          <PlayIcon />
        ) : (
          <SpeakerIcon />
        )}
      </button>

      {state !== "idle" && (
        <button
          type="button"
          onClick={handleStop}
          aria-label={labels.stop}
          title={labels.stop}
          className="flex size-10 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <StopIcon />
        </button>
      )}
    </div>
  );
}
