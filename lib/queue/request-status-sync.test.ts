import { describe, expect, it } from "vitest";
import {
  statusAfterCheckIn,
  statusAfterQueueComplete,
} from "@/lib/queue/request-status-sync";

describe("request status sync with queue", () => {
  it("moves new or contacted requests to in_progress on check-in", () => {
    expect(statusAfterCheckIn("new")).toBe("in_progress");
    expect(statusAfterCheckIn("contacted")).toBe("in_progress");
    expect(statusAfterCheckIn("in_progress")).toBeNull();
    expect(statusAfterCheckIn("completed")).toBeNull();
    expect(statusAfterCheckIn("cancelled")).toBeNull();
  });

  it("marks open requests completed when queue ticket is done", () => {
    expect(statusAfterQueueComplete("new")).toBe("completed");
    expect(statusAfterQueueComplete("contacted")).toBe("completed");
    expect(statusAfterQueueComplete("in_progress")).toBe("completed");
    expect(statusAfterQueueComplete("completed")).toBeNull();
    expect(statusAfterQueueComplete("cancelled")).toBeNull();
  });
});
