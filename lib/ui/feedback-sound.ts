const MUTE_STORAGE_KEY = "cqm_feedback_sound_mute";
const LEGACY_MUTE_STORAGE_KEY = "cqm_admin_notify_mute";

export type FeedbackSoundKind = "success" | "error" | "alert";

let sharedAudioContext: AudioContext | null = null;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

function getSharedAudioContext(): AudioContext | null {
  const AudioCtx = getAudioContextClass();
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

async function resumeAudioContext(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

function playToneOnContext(
  ctx: AudioContext,
  frequency: number,
  durationMs: number,
  startDelayMs = 0,
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const startAt = ctx.currentTime + startDelayMs / 1000;
  oscillator.start(startAt);
  window.setTimeout(() => {
    oscillator.stop();
  }, startDelayMs + durationMs);
}

export function isFeedbackSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = window.localStorage.getItem(MUTE_STORAGE_KEY);
    if (current === "1") return true;
    if (current === "0") return false;
    return window.localStorage.getItem(LEGACY_MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setFeedbackSoundMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
    window.localStorage.setItem(LEGACY_MUTE_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** @deprecated Use isFeedbackSoundMuted */
export function isNewRequestSoundMuted(): boolean {
  return isFeedbackSoundMuted();
}

/** @deprecated Use setFeedbackSoundMuted */
export function setNewRequestSoundMuted(muted: boolean) {
  setFeedbackSoundMuted(muted);
}

/** Unlocks Web Audio after a user gesture (required by browsers). */
export async function unlockFeedbackSound(): Promise<void> {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    await resumeAudioContext(ctx);
  } catch {
    /* ignore */
  }
}

/** @deprecated Use unlockFeedbackSound */
export async function unlockNewRequestSound(): Promise<void> {
  await unlockFeedbackSound();
}

async function playFeedbackSoundInternal(
  kind: FeedbackSoundKind,
  ignoreMute: boolean,
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!ignoreMute && isFeedbackSoundMuted()) return;

  const ctx = getSharedAudioContext();
  if (!ctx) return;

  try {
    await resumeAudioContext(ctx);
    if (kind === "success") {
      playToneOnContext(ctx, 660, 180);
    } else if (kind === "error") {
      playToneOnContext(ctx, 440, 140);
      playToneOnContext(ctx, 440, 140, 180);
    } else {
      playToneOnContext(ctx, 880, 220);
    }
  } catch {
    /* ignore */
  }
}

/** Short tones via Web Audio (no asset required). */
export function playFeedbackSound(kind: FeedbackSoundKind) {
  void playFeedbackSoundInternal(kind, false);
}

/** Short alert tone for new admin requests. */
export function playNewRequestSound() {
  void playFeedbackSoundInternal("alert", false);
}

/** Plays alert test tone (e.g. after unmuting); ignores mute flag. */
export function playNewRequestSoundTest() {
  void playFeedbackSoundInternal("alert", true);
}
