import { describe, expect, it } from "vitest";
import { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";
import { computeAheadCount } from "@/lib/queue/queue-position";
import {
  shouldVibrateForAhead,
  shouldVibrateForTurn,
} from "@/lib/queue/queue-vibrate";

describe("computeAheadCount", () => {
  it("counts waiting tickets with lower queue numbers", () => {
    expect(computeAheadCount(10, [1, 2, 3, 5, 9, 10, 11])).toBe(5);
  });

  it("returns 0 when first in line", () => {
    expect(computeAheadCount(1, [])).toBe(0);
    expect(computeAheadCount(3, [5, 6])).toBe(0);
  });
});

describe("queue vibrate triggers", () => {
  it("vibrates once when reaching exactly five ahead", () => {
    expect(
      shouldVibrateForAhead(AHEAD_NOTIFY_AT, AHEAD_NOTIFY_AT - 1, false),
    ).toBe(true);
    expect(
      shouldVibrateForAhead(AHEAD_NOTIFY_AT, AHEAD_NOTIFY_AT, true),
    ).toBe(false);
  });

  it("vibrates once at your turn while waiting", () => {
    expect(shouldVibrateForTurn(0, "waiting", false)).toBe(true);
    expect(shouldVibrateForTurn(0, "waiting", true)).toBe(false);
    expect(shouldVibrateForTurn(0, "completed", false)).toBe(false);
  });
});
