"use server";

import { headers } from "next/headers";
import {
  getCairoMinBookingYmd,
  getCairoTodayYmd,
} from "@/lib/cairo-today-ymd";
import { checkRateLimit, rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { officeAcceptsTravelerState } from "@/lib/office-requests/office-traveler-state";
import { DUPLICATE_BOOKING_MESSAGE } from "@/lib/office-requests/booking-duplicate";
import {
  countBookingRequestsForOfficeDay,
  createOfficeRequest,
  findDuplicateBookingRequest,
  getBookingSettings,
  getOffice,
  listTravelerStatesForPublicBooking,
} from "@/lib/office-requests/store";
import type {
  OfficeRequestType,
  PublicOfficeRequestStatus,
} from "@/lib/office-requests/types";

export type BookingFormState = {
  ok: boolean;
  message: string;
  duplicate?: boolean;
  errors?: Record<string, string>;
  values?: {
    officeId: string;
    type: OfficeRequestType;
    travelerStateId: string;
    preferredDate: string;
    name: string;
    phone: string;
    details: string;
  };
  request?: PublicOfficeRequestStatus & { phone: string; passToken: string };
};

const requestTypes: OfficeRequestType[] = ["booking", "complaint", "proposal"];
const MAX_OFFICE_ID_LENGTH = 120;
const MAX_TRAVELER_STATE_ID_LENGTH = 80;
const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 30;
const MAX_DETAILS_LENGTH = 1000;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitOfficeRequest(
  _state: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const headerList = await headers();
  const rateLimit = checkRateLimit({
    key: rateLimitKeyFromHeaders(headerList, "submit-office-request"),
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) {
    return {
      ok: false,
      message: "تم إرسال طلبات كثيرة خلال وقت قصير. حاول مرة أخرى بعد قليل.",
    };
  }

  const officeId = value(formData, "officeId");
  const type = value(formData, "type") as OfficeRequestType;
  const travelerStateId = value(formData, "travelerStateId");
  const preferredDate = value(formData, "preferredDate");
  const name = value(formData, "name");
  const phone = value(formData, "phone");
  const details = value(formData, "details");

  const errors: Record<string, string> = {};
  const values = {
    officeId,
    type,
    travelerStateId,
    preferredDate,
    name,
    phone,
    details,
  };
  if (!officeId) errors.officeId = "اختر المكتب.";
  if (officeId.length > MAX_OFFICE_ID_LENGTH) {
    errors.officeId = "اختيار المكتب غير صالح.";
  }
  if (!requestTypes.includes(type)) errors.type = "اختر نوع الطلب.";
  if (travelerStateId.length > MAX_TRAVELER_STATE_ID_LENGTH) {
    errors.travelerStateId = "حالة المسافر غير صالحة.";
  }

  const activeStates = await listTravelerStatesForPublicBooking();
  const allowedIds = new Set(activeStates.map((s) => s.id));
  const labelById = Object.fromEntries(
    activeStates.map((s) => [s.id, s.labelAr]),
  );

  if (type === "booking") {
    const { bookingSameDayCutoffHour } = await getBookingSettings();

    if (!travelerStateId || !allowedIds.has(travelerStateId)) {
      errors.travelerStateId = "اختر حالة المسافر.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      errors.preferredDate = "اختر التاريخ المطلوب.";
    } else {
      const minYmd = getCairoMinBookingYmd(new Date(), {
        sameDayCutoffHour: bookingSameDayCutoffHour,
      });
      const todayYmd = getCairoTodayYmd();
      if (preferredDate < minYmd) {
        const hh = String(bookingSameDayCutoffHour).padStart(2, "0");
        errors.preferredDate =
          preferredDate < todayYmd
            ? "لا يمكن اختيار تاريخ في الماضي. اختر اليوم أو تاريخاً لاحقاً."
            : `من الساعة ${hh}:00 بتوقيت القاهرة لا يُسمح بحجز موعد في نفس اليوم. اختر غداً أو تاريخاً لاحقاً.`;
      }
    }

    let bookingOffice = null as Awaited<ReturnType<typeof getOffice>>;
    if (
      officeId &&
      !errors.officeId &&
      travelerStateId &&
      allowedIds.has(travelerStateId)
    ) {
      bookingOffice = await getOffice(officeId);
      if (!bookingOffice) {
        errors.officeId = "المكتب غير موجود.";
      } else if (!officeAcceptsTravelerState(bookingOffice, travelerStateId)) {
        errors.officeId =
          "هذا المكتب لا يخدم حالة المسافر المختارة. اختر مكتباً آخر.";
      }
    }

    if (
      !errors.preferredDate &&
      !errors.officeId &&
      bookingOffice &&
      preferredDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
    ) {
      const cap = bookingOffice.dailyBookingCap;
      if (typeof cap === "number" && cap > 0) {
        const used = await countBookingRequestsForOfficeDay(
          officeId,
          preferredDate,
        );
        if (used >= cap) {
          errors.preferredDate =
            "لا يمكن الحجز في هذا اليوم؛ تم بلوغ العدد المسموح لهذا المكتب.";
        }
      }
    }
  }

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    errors.name = "اكتب الاسم بشكل صحيح.";
  }
  if (phone.length > MAX_PHONE_LENGTH || !/^[+\d\s()-]{9,20}$/.test(phone)) {
    errors.phone = "اكتب رقم هاتف صحيح.";
  }
  if (details.length > MAX_DETAILS_LENGTH) {
    errors.details = "التفاصيل طويلة أكثر من المسموح.";
  }
  if (type !== "booking" && details.length < 5) {
    errors.details = "اكتب تفاصيل الطلب.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "راجع البيانات المطلوبة.",
      errors,
      values,
    };
  }

  if (type === "booking" && preferredDate && travelerStateId) {
    const duplicate = await findDuplicateBookingRequest({
      officeId,
      preferredDate,
      travelerStateId,
      name,
      phone,
    });
    if (duplicate) {
      return {
        ok: false,
        duplicate: true,
        message: DUPLICATE_BOOKING_MESSAGE,
        values,
      };
    }
  }

  try {
    const stateLabel =
      type === "booking" && travelerStateId
        ? labelById[travelerStateId] ?? travelerStateId
        : "";
    const created = await createOfficeRequest({
      officeId,
      type,
      travelerStateId: type === "booking" ? travelerStateId : undefined,
      preferredDate: type === "booking" ? preferredDate : undefined,
      name,
      phone,
      details:
        type === "booking" && details.length === 0
          ? `حالة المسافر: ${stateLabel}\nالتاريخ المطلوب: ${preferredDate}`
          : details,
    });
    return {
      ok: true,
      message: "تم إرسال الطلب بنجاح. سيتابع المكتب المختار معك قريباً.",
      request: {
        ...created,
        phone,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "تعذر حفظ الطلب حالياً، حاول مرة أخرى.";
    return {
      ok: false,
      message,
      ...(message === DUPLICATE_BOOKING_MESSAGE
        ? { duplicate: true, values }
        : {}),
    };
  }
}
