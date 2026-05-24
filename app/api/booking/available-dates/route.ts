import { NextResponse } from "next/server";
import { isRequestBodyTooLarge } from "@/lib/api/request-body-limit";
import {
  enumerateCairoYmdRange,
  getCairoMinBookingYmd,
} from "@/lib/cairo-today-ymd";
import { isProductionRuntime } from "@/lib/env";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { BOOKING_DATE_HORIZON_DAYS } from "@/lib/office-requests/booking-constants";
import {
  defaultBookingDateRange,
  listOfficeAvailableBookingDatesForOffice,
} from "@/lib/office-requests/booking-day-stats";
import { getBookingSettings, listOffices } from "@/lib/office-requests/store";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_OFFICE_ID_LENGTH = 120;
const MAX_RANGE_DAYS = BOOKING_DATE_HORIZON_DAYS + 7;

export async function GET(req: Request) {
  if (isRequestBodyTooLarge(req)) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKeyFromHeaders(req.headers, "booking-available-dates"),
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
  const fromParam = url.searchParams.get("from")?.trim() ?? "";
  const toParam = url.searchParams.get("to")?.trim() ?? "";

  if (!officeId || officeId.length > MAX_OFFICE_ID_LENGTH) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }
  if (
    (fromParam && !DATE_RE.test(fromParam)) ||
    (toParam && !DATE_RE.test(toParam))
  ) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }

  const { bookingSameDayCutoffHour } = await getBookingSettings();
  const minYmd = getCairoMinBookingYmd(new Date(), {
    sameDayCutoffHour: bookingSameDayCutoffHour,
  });
  const defaults = defaultBookingDateRange(minYmd);
  const from = fromParam || defaults.from;
  const to = toParam || defaults.to;

  if (from > to) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }

  const rangeDays = enumerateCairoYmdRange(from, to).length;
  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: "bad_params" }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured()) {
    if (isProductionRuntime()) {
      return NextResponse.json(
        {
          error: "service_unavailable",
          message:
            "خدمة الحجز غير مهيأة. راجع إعداد Firebase Admin SDK على الاستضافة.",
        },
        { status: 503 },
      );
    }
    const effectiveFrom = from > minYmd ? from : minYmd;
    return NextResponse.json({
      dates: enumerateCairoYmdRange(effectiveFrom, to),
      fullDates: [] as string[],
      cap: null as number | null,
      from: effectiveFrom,
      to,
      _devFallback: true,
    });
  }

  try {
    const office = (await listOffices()).find((item) => item.id === officeId);
    if (!office) {
      return NextResponse.json({ error: "office_not_found" }, { status: 404 });
    }

    const result = await listOfficeAvailableBookingDatesForOffice({
      officeId,
      cap: office.dailyBookingCap,
      sameDayCutoffHour: bookingSameDayCutoffHour,
      fromYmd: from,
      toYmd: to,
    });

    return NextResponse.json({
      dates: result.availableDates,
      fullDates: result.fullDates,
      cap: result.cap,
      from: result.from,
      to: result.to,
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
