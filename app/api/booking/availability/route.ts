import { NextResponse } from "next/server";
import { isRequestBodyTooLarge } from "@/lib/api/request-body-limit";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { listOffices } from "@/lib/office-requests/store";
import { getBookingDayAvailability } from "@/lib/office-requests/booking-day-stats";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_OFFICE_ID_LENGTH = 120;

export async function GET(req: Request) {
  if (isRequestBodyTooLarge(req)) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKeyFromHeaders(req.headers, "booking-availability"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const url = new URL(req.url);
  const officeId = url.searchParams.get("officeId")?.trim() ?? "";
  const preferredDate = url.searchParams.get("preferredDate")?.trim() ?? "";

  if (
    !officeId ||
    officeId.length > MAX_OFFICE_ID_LENGTH ||
    !DATE_RE.test(preferredDate)
  ) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({
      available: true,
      count: 0,
      cap: null as number | null,
    });
  }

  try {
    const office = (await listOffices()).find((item) => item.id === officeId);
    if (!office) {
      return NextResponse.json({ error: "office_not_found" }, { status: 404 });
    }

    const cap = office.dailyBookingCap;
    if (typeof cap !== "number" || cap <= 0) {
      return NextResponse.json({
        available: true,
        count: 0,
        cap: null as number | null,
      });
    }

    const { used: count, available } = await getBookingDayAvailability({
      officeId,
      preferredDate,
      cap,
    });

    return NextResponse.json({
      available,
      count,
      cap,
      fullMessage: available
        ? undefined
        : "لا يمكن الحجز في هذا اليوم؛ تم بلوغ العدد المسموح لهذا المكتب.",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "server",
        message: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}
