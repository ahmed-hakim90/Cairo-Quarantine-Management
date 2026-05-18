import { describe, expect, it } from "vitest";
import {
  getQueuePollIntervalMs,
  shouldStopQueuePolling,
} from "@/lib/queue/queue-poll-interval";

describe("getQueuePollIntervalMs", () => {
  it("uses longer intervals when far from turn", () => {
    expect(getQueuePollIntervalMs(25)).toBe(60_000);
    expect(getQueuePollIntervalMs(10)).toBe(30_000);
    expect(getQueuePollIntervalMs(3)).toBe(12_000);
  });
});

describe("shouldStopQueuePolling", () => {
  it("stops when completed or closed", () => {
    expect(
      shouldStopQueuePolling({ status: "completed", queueClosed: false }),
    ).toBe(true);
    expect(
      shouldStopQueuePolling({ status: "waiting", queueClosed: true }),
    ).toBe(true);
    expect(
      shouldStopQueuePolling({ status: "waiting", queueClosed: false }),
    ).toBe(false);
  });
});
