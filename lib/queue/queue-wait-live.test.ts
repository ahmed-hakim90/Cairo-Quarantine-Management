import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  getQueueWaitPositionView,
  QueueWaitLive,
} from "@/components/queue/QueueWaitLive";
import type { QueuePositionPublic, QueueTicket } from "@/lib/queue/types";

const ticket: QueueTicket = {
  id: "2026-05-18_office-1_request-1",
  requestId: "request-1",
  requestNumber: "CQM-000001",
  officeId: "office-1",
  queueDate: "2026-05-18",
  queueNumber: 7,
  status: "waiting",
  checkedInAt: "2026-05-18T09:00:00.000Z",
  createdFrom: "existing_request",
};

const position: QueuePositionPublic = {
  ticketId: ticket.id,
  queueNumber: ticket.queueNumber,
  status: "waiting",
  aheadCount: 3,
  queueClosed: false,
  message: "أمامك 3 أشخاص في الانتظار",
};

describe("QueueWaitLive", () => {
  it("renders the initial server position immediately", () => {
    const html = renderToStaticMarkup(
      createElement(QueueWaitLive, {
        locale: "ar",
        ticket,
        officeNameAr: "مكتب القاهرة",
        citizenName: "مواطن",
        initialPosition: position,
        iosHelp: "ثبّت التطبيق من المتصفح.",
      }),
    );

    expect(html).toContain("أمامك 3 أشخاص");
    expect(html).not.toContain("جاري حساب موضعك في الطابور");
  });

  it("keeps the last known position when live refresh fails", () => {
    const view = getQueueWaitPositionView({
      locale: "ar",
      loading: false,
      positionError: true,
      position,
    });

    expect(view.kind).toBe("ahead");
    expect(view.text).toBe("أمامك 3 أشخاص");
    expect(view.staleWarning).toContain("آخر رقم ظاهر");
  });
});
