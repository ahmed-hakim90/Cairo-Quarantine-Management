"use server";

import { headers } from "next/headers";
import { logPublicFormSubmitError } from "@/lib/analytics/public-analytics-store";
import {
  DEFAULT_GOVERNORATE_ID,
  normalizeGovernorateId,
} from "@/data/governorates";
import {
  getCairoMinBookingYmd,
  getCairoTodayYmd,
} from "@/lib/cairo-today-ymd";
import {
  bookingActionCopy,
  duplicateBookingMessageByLocale,
} from "@/lib/i18n/booking-request-copy";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import { checkUnifiedRateLimit } from "@/lib/rate-limit-unified";
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
    governorateId: string;
    type: OfficeRequestType;
    travelerStateId: string;
    preferredDate: string;
    name: string;
    phone: string;
    details: string;
    hasSpecialNeeds?: boolean;
    hasElderly?: boolean;
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

function analyticsSessionIdFromForm(formData: FormData): string | undefined {
  const raw = value(formData, "analyticsSessionId");
  return raw || undefined;
}

function analyticsPathForType(type: OfficeRequestType, locale: Locale): string {
  if (type === "complaint") return `/${locale}/complaint`;
  return `/${locale}/booking`;
}

async function logBookingSubmitError(args: {
  formData: FormData;
  locale: Locale;
  type: OfficeRequestType;
  errorCode: string;
  officeId?: string;
  phone?: string;
  preferredDate?: string;
  requestId?: string;
}): Promise<void> {
  const sessionId = analyticsSessionIdFromForm(args.formData);
  if (!sessionId) return;
  await logPublicFormSubmitError({
    sessionId,
    path: analyticsPathForType(args.type, args.locale),
    locale: args.locale,
    formType: args.type === "complaint" ? "complaint" : "booking",
    errorCode: args.errorCode,
    officeId: args.officeId,
    phone: args.phone,
    preferredDate: args.preferredDate,
    requestId: args.requestId,
  });
}

function localeFromForm(formData: FormData): Locale {
  const raw = value(formData, "locale");
  return isLocale(raw) ? raw : defaultLocale;
}

export async function submitOfficeRequest(
  _state: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const locale = localeFromForm(formData);
  const t = bookingActionCopy[locale];
  const headerList = await headers();
  const rateLimit = await checkUnifiedRateLimit({
    scope: "submit-office-request",
    key: rateLimitKeyFromHeaders(headerList, "submit-office-request"),
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) {
    await logBookingSubmitError({
      formData,
      locale,
      type: "booking",
      errorCode: "rate_limited",
    });
    return {
      ok: false,
      message: t.rateLimited,
    };
  }

  const officeId = value(formData, "officeId");
  /** مؤقتًا: المحافظة ثابتة على القاهرة في نموذج الحجز العام. */
  const governorateId = DEFAULT_GOVERNORATE_ID;
  const type = value(formData, "type") as OfficeRequestType;
  const travelerStateId = value(formData, "travelerStateId");
  const preferredDate = value(formData, "preferredDate");
  const name = value(formData, "name");
  const phone = value(formData, "phone");
  const details = value(formData, "details");
  const hasSpecialNeeds = formData.get("hasSpecialNeeds") === "on";
  const hasElderly = formData.get("hasElderly") === "on";

  const errors: Record<string, string> = {};
  const values = {
    officeId,
    governorateId,
    type,
    travelerStateId,
    preferredDate,
    name,
    phone,
    details,
    ...(type === "booking" ? { hasSpecialNeeds, hasElderly } : {}),
  };
  if (!officeId) errors.officeId = t.chooseOffice;
  if (officeId.length > MAX_OFFICE_ID_LENGTH) {
    errors.officeId = t.invalidOffice;
  }
  if (!requestTypes.includes(type)) errors.type = t.chooseType;
  if (travelerStateId.length > MAX_TRAVELER_STATE_ID_LENGTH) {
    errors.travelerStateId = t.invalidTravelerState;
  }

  const activeStates = await listTravelerStatesForPublicBooking();
  const allowedIds = new Set(activeStates.map((s) => s.id));
  const labelById = Object.fromEntries(
    activeStates.map((s) => [s.id, s.labelAr]),
  );

  let selectedOffice = null as Awaited<ReturnType<typeof getOffice>>;
  if (officeId && !errors.officeId) {
    selectedOffice = await getOffice(officeId);
    if (!selectedOffice) {
      errors.officeId = t.officeMissing;
    } else if (
      !errors.governorateId &&
      selectedOffice.governorateId !== normalizeGovernorateId(governorateId)
    ) {
      errors.officeId = t.officeGovernorateMismatch;
    }
  }

  if (type === "booking") {
    const { bookingSameDayCutoffHour } = await getBookingSettings();

    if (!travelerStateId || !allowedIds.has(travelerStateId)) {
      errors.travelerStateId = t.chooseTravelerState;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      errors.preferredDate = t.chooseDate;
    } else {
      const minYmd = getCairoMinBookingYmd(new Date(), {
        sameDayCutoffHour: bookingSameDayCutoffHour,
      });
      const todayYmd = getCairoTodayYmd();
      if (preferredDate < minYmd) {
        const hh = String(bookingSameDayCutoffHour).padStart(2, "0");
        errors.preferredDate =
          preferredDate < todayYmd
            ? t.pastDate
            : t.sameDayClosed.replace("{hour}", hh);
      }
    }

    const bookingOffice = selectedOffice;
    if (
      officeId &&
      !errors.officeId &&
      travelerStateId &&
      allowedIds.has(travelerStateId)
    ) {
      if (!bookingOffice) {
        errors.officeId = t.officeMissing;
      } else if (!officeAcceptsTravelerState(bookingOffice, travelerStateId)) {
        errors.officeId = t.officeMismatch;
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
          errors.preferredDate = t.dayFull;
        }
      }
    }
  }

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    errors.name = t.invalidName;
  }
  if (phone.length > MAX_PHONE_LENGTH || !/^[+\d\s()-]{9,20}$/.test(phone)) {
    errors.phone = t.invalidPhone;
  }
  if (details.length > MAX_DETAILS_LENGTH) {
    errors.details = t.detailsTooLong;
  }
  if (type !== "booking" && details.length < 5) {
    errors.details = t.detailsRequired;
  }

  if (Object.keys(errors).length > 0) {
    await logBookingSubmitError({
      formData,
      locale,
      type: requestTypes.includes(type) ? type : "booking",
      errorCode: "validation",
      officeId: officeId || undefined,
      phone: phone || undefined,
      preferredDate: preferredDate || undefined,
    });
    return {
      ok: false,
      message: t.reviewRequired,
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
      await logBookingSubmitError({
        formData,
        locale,
        type: "booking",
        errorCode: "duplicate",
        officeId,
        phone,
        preferredDate,
        requestId: duplicate.id,
      });
      return {
        ok: false,
        duplicate: true,
        message: duplicateBookingMessageByLocale[locale],
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
      governorateId,
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
      hasSpecialNeeds: type === "booking" && hasSpecialNeeds,
      hasElderly: type === "booking" && hasElderly,
    });
    return {
      ok: true,
      message: t.success,
      request: {
        ...created,
        phone,
      },
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const message =
      rawMessage === DUPLICATE_BOOKING_MESSAGE
        ? duplicateBookingMessageByLocale[locale]
        : rawMessage === bookingActionCopy.ar.firebaseMissing
          ? t.firebaseMissing
          : rawMessage === bookingActionCopy.ar.dayFull
            ? t.dayFull
            : rawMessage === bookingActionCopy.ar.officeMismatch
              ? t.officeMismatch
              : rawMessage === bookingActionCopy.ar.officeGovernorateMismatch
                ? t.officeGovernorateMismatch
              : rawMessage || t.saveFailed;
    await logBookingSubmitError({
      formData,
      locale,
      type: requestTypes.includes(type) ? type : "booking",
      errorCode:
        rawMessage === DUPLICATE_BOOKING_MESSAGE
          ? "duplicate"
          : rawMessage === bookingActionCopy.ar.firebaseMissing
            ? "firebase_missing"
            : rawMessage || "save_failed",
      officeId,
      phone,
      preferredDate: type === "booking" ? preferredDate : undefined,
    });
    return {
      ok: false,
      message,
      ...(rawMessage === DUPLICATE_BOOKING_MESSAGE
        ? { duplicate: true, values }
        : {}),
    };
  }
}
