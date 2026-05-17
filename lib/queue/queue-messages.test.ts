import { describe, expect, it } from "vitest";
import { AHEAD_NOTIFY_AT } from "@/lib/queue/queue-logic";
import {
  queueAheadDetail,
  queueAheadHeadline,
  queueAlertsHelpText,
  queueNotifyFiveAhead,
  queueNotifyYourTurn,
  queuePositionLoadingMessage,
  queuePositionMessage,
  queueYourTurnHeadline,
  queueYourTurnSubline,
} from "@/lib/queue/queue-messages";

describe("queueAheadHeadline", () => {
  it("returns null when no one is ahead", () => {
    expect(queueAheadHeadline(0)).toBeNull();
  });

  it("uses singular copy for one person ahead", () => {
    expect(queueAheadHeadline(1)).toBe("باقي شخص واحد على الدور");
  });

  it("uses plural copy for multiple ahead", () => {
    expect(queueAheadHeadline(2)).toBe("باقي 2 على الدور");
    expect(queueAheadHeadline(5)).toBe("باقي 5 على الدور");
  });
});

describe("queueAheadDetail", () => {
  it("returns null for zero or one ahead", () => {
    expect(queueAheadDetail(0)).toBeNull();
    expect(queueAheadDetail(1)).toBeNull();
  });

  it("describes waiting people in line", () => {
    expect(queueAheadDetail(3)).toBe("أمامك 3 أشخاص في الانتظار");
  });
});

describe("queuePositionMessage", () => {
  it("handles closed queue and completed ticket", () => {
    expect(queuePositionMessage("waiting", 2, true)).toBe(
      "تم إغلاق طابور اليوم لهذا المكتب.",
    );
    expect(queuePositionMessage("completed", 0, false)).toBe(
      "تم الانتهاء من المكتب.",
    );
  });

  it("returns turn subline when first in line", () => {
    expect(queuePositionMessage("waiting", 0, false)).toBe(
      queueYourTurnSubline(),
    );
  });

  it("returns detail or headline while waiting", () => {
    expect(queuePositionMessage("waiting", 1, false)).toBe(
      "باقي شخص واحد على الدور",
    );
    expect(queuePositionMessage("waiting", 4, false)).toBe(
      "أمامك 4 أشخاص في الانتظار",
    );
  });
});

describe("queue notifications copy", () => {
  it("matches five-ahead threshold in body", () => {
    const { title, body } = queueNotifyFiveAhead();
    expect(title).toBe("اقترب دورك");
    expect(body).toContain(String(AHEAD_NOTIFY_AT));
    expect(body).toContain("باقي");
  });

  it("uses turn headline and desk subline", () => {
    const { title, body } = queueNotifyYourTurn();
    expect(title).toBe(queueYourTurnHeadline());
    expect(body).toContain(queueYourTurnSubline());
  });
});

describe("queue UI helper copy", () => {
  it("uses loading message for initial position fetch", () => {
    expect(queuePositionLoadingMessage()).toBe(
      "جاري حساب موقعك في الطابور…",
    );
  });

  it("mentions remaining count in alerts help", () => {
    expect(queueAlertsHelpText(5)).toContain("5");
    expect(queueAlertsHelpText(5)).toContain("على الدور");
  });
});
