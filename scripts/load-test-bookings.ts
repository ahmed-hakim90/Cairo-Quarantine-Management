/**
 * إنشاء حجوزات تجريبية عبر نفس مسار الإنتاج (`createOfficeRequest`).
 *
 * تشغيل (100 طلب — الافتراضي):
 *   npm run load-test:bookings
 *
 * تخصيص العدد أو المكتب:
 *   LOAD_TEST_COUNT=100 LOAD_TEST_OFFICE_ID=cairo-trav-1 npm run load-test:bookings
 */
import { DEFAULT_GOVERNORATE_ID } from "@/data/governorates";
import { getCairoMinBookingYmd } from "@/lib/cairo-today-ymd";
import { officeAcceptsTravelerState } from "@/lib/office-requests/office-traveler-state";
import { createOfficeRequest, getOffice } from "@/lib/office-requests/store";
import { DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR } from "@/lib/office-requests/types";

const COUNT = Math.max(
  1,
  Number.parseInt(process.env.LOAD_TEST_COUNT ?? "100", 10) || 100,
);
const CONCURRENCY = Math.max(
  1,
  Math.min(
    25,
    Number.parseInt(process.env.LOAD_TEST_CONCURRENCY ?? "5", 10) || 5,
  ),
);
const OFFICE_ID = process.env.LOAD_TEST_OFFICE_ID?.trim() || "cairo-trav-1";
const TRAVELER_STATE_ID =
  process.env.LOAD_TEST_TRAVELER_STATE_ID?.trim() || "international";

function loadTestPhone(index: number): string {
  return `2099${String(index).padStart(8, "0")}`;
}

function resolveTravelerStateId(
  office: NonNullable<Awaited<ReturnType<typeof getOffice>>>,
): string {
  const candidates = [
    TRAVELER_STATE_ID,
    "international",
    "hajj_umrah",
    "citizen",
  ];
  for (const id of candidates) {
    if (officeAcceptsTravelerState(office, id)) return id;
  }
  throw new Error(
    `No traveler state accepted by office ${office.id}. Set LOAD_TEST_TRAVELER_STATE_ID.`,
  );
}

async function createOne(args: {
  index: number;
  officeId: string;
  travelerStateId: string;
  preferredDate: string;
}): Promise<{ index: number; requestId: string; requestNumber: string }> {
  const { index, officeId, travelerStateId, preferredDate } = args;
  const created = await createOfficeRequest({
    governorateId: DEFAULT_GOVERNORATE_ID,
    officeId,
    type: "booking",
    travelerStateId,
    preferredDate,
    name: `اختبار حمل ${index}`,
    phone: loadTestPhone(index),
    details: `طلب تجريبي للحمل — #${index}`,
  });
  return {
    index,
    requestId: created.id,
    requestNumber: created.requestNumber,
  };
}

async function main() {
  const office = await getOffice(OFFICE_ID);
  if (!office?.active) {
    throw new Error(
      `Office "${OFFICE_ID}" غير موجود أو غير نشط. عيّن LOAD_TEST_OFFICE_ID.`,
    );
  }

  const travelerStateId = resolveTravelerStateId(office);
  const preferredDate = getCairoMinBookingYmd(new Date(), {
    sameDayCutoffHour: DEFAULT_BOOKING_SAME_DAY_CUTOFF_HOUR,
  });

  console.log(
    [
      "Load test — bookings",
      `count=${COUNT}`,
      `concurrency=${CONCURRENCY}`,
      `office=${office.id} (${office.nameAr})`,
      `travelerState=${travelerStateId}`,
      `preferredDate=${preferredDate}`,
    ].join("\n  "),
  );

  const started = Date.now();
  let ok = 0;
  let failed = 0;
  const errors: { index: number; message: string }[] = [];

  for (let offset = 0; offset < COUNT; offset += CONCURRENCY) {
    const size = Math.min(CONCURRENCY, COUNT - offset);
    const indexes = Array.from({ length: size }, (_, j) => offset + j + 1);
    const results = await Promise.allSettled(
      indexes.map((index) =>
        createOne({ index, officeId: office.id, travelerStateId, preferredDate }),
      ),
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const index = indexes[i];
      if (r.status === "fulfilled") {
        ok++;
        if (ok <= 3 || ok === COUNT) {
          console.log(
            `  ok #${index} → ${r.value.requestNumber} (${r.value.requestId})`,
          );
        } else if (ok === 4) {
          console.log("  …");
        }
      } else {
        failed++;
        const message =
          r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.push({ index, message });
        if (errors.length <= 5) {
          console.error(`  fail #${index}: ${message}`);
        }
      }
    }
  }

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `\nDone in ${elapsedSec}s — success: ${ok}, failed: ${failed}, total: ${COUNT}`,
  );
  if (errors.length > 5) {
    console.error(`(showing first 5 errors only; ${errors.length} failures total)`);
  }
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
