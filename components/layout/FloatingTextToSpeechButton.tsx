"use client";

import { useEffect, useRef, useState } from "react";
import {
  getSpeechLanguage,
  selectSpeechVoice,
  splitSpeechText,
} from "@/lib/ui/text-to-speech";

type TtsState = "idle" | "speaking" | "paused";

function canUseSpeechSynthesis(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

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
    () => typeof window === "undefined" || canUseSpeechSynthesis(),
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const cancelledRef = useRef(false);
  const speechRunIdRef = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    voicesRef.current = voices;
  }, [voices]);

  useEffect(() => {
    if (!supported) {
      return;
    }

    function refreshVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }

    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
    };
  }, [supported]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      speechRunIdRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, []);

  function getPageText(): string {
    const el = document.getElementById("main-content");
    if (!el) return "";
    return (el as HTMLElement).innerText ?? "";
  }

  function resetSpeech() {
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    utteranceRef.current = null;
    setState("idle");
  }

  function speakCurrentChunk(runId: number) {
    const synthesis = window.speechSynthesis;
    const text = chunksRef.current[chunkIndexRef.current];

    if (!text || cancelledRef.current || runId !== speechRunIdRef.current) {
      resetSpeech();
      return;
    }

    const language = getSpeechLanguage(locale);
    const voice = selectSpeechVoice(
      voicesRef.current.length > 0 ? voicesRef.current : synthesis.getVoices(),
      language,
    );
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.9;
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (cancelledRef.current || runId !== speechRunIdRef.current) return;
      chunkIndexRef.current += 1;
      if (chunkIndexRef.current >= chunksRef.current.length) {
        resetSpeech();
        return;
      }
      speakCurrentChunk(runId);
    };
    utterance.onerror = () => {
      if (cancelledRef.current || runId !== speechRunIdRef.current) return;
      setLiveMessage(labels.unsupported);
      resetSpeech();
    };

    utteranceRef.current = utterance;
    synthesis.speak(utterance);
  }

  function handleMainClick() {
    if (!canUseSpeechSynthesis()) {
      setLiveMessage(labels.unsupported);
      return;
    }
    setLiveMessage("");

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

    cancelledRef.current = true;
    speechRunIdRef.current += 1;
    window.speechSynthesis.cancel();
    const chunks = splitSpeechText(getPageText());
    if (chunks.length === 0) return;

    cancelledRef.current = false;
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    setVoices(window.speechSynthesis.getVoices());
    speakCurrentChunk(speechRunIdRef.current);
    setState("speaking");
  }

  function handleStop() {
    cancelledRef.current = true;
    speechRunIdRef.current += 1;
    window.speechSynthesis?.cancel();
    resetSpeech();
  }

  const mainLabel =
    state === "speaking"
      ? labels.pause
      : state === "paused"
        ? labels.resume
        : labels.read;

  if (!supported) {
    return (
      <span className="sr-only" aria-live="polite">
        {labels.unsupported}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="sr-only" aria-live="polite">
        {liveMessage}
      </span>
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
