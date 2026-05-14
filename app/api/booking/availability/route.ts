import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  countBookingRequestsForOfficeDay,
  getOffice,
} from "@/lib/office-requests/store";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const officeId = url.searchParams.get("officeId")?.trim() ?? "";
  const preferredDate = url.searchParams.get("preferredDate")?.trim() ?? "";

  if (!officeId || !DATE_RE.test(preferredDate)) {
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
    const office = await getOffice(officeId);
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

    const count = await countBookingRequestsForOfficeDay(
      officeId,
      preferredDate,
    );
    const available = count < cap;

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
