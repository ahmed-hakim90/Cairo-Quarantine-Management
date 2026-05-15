const MUTE_STORAGE_KEY = "cqm_admin_notify_mute";

export function isNewRequestSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNewRequestSoundMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function playWebAudioBeep() {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  window.setTimeout(() => {
    oscillator.stop();
    void ctx.close();
  }, 220);
}

/** Short alert tone; uses Web Audio (no asset required). */
export function playNewRequestSound() {
  if (typeof window === "undefined" || isNewRequestSoundMuted()) return;
  try {
    playWebAudioBeep();
  } catch {
    /* ignore */
  }
}
