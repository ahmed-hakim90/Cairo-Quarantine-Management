import { buildBookingPassUrl } from "@/lib/booking-pass-url";
import { effectiveTravelerStateIdOnRequest } from "@/lib/office-requests/office-traveler-state";
import {
  type MessageTemplate,
  type Office,
  type OfficeRequest,
  REQUEST_TYPE_LABELS,
  TRAVELER_CATEGORY_LABELS,
} from "@/lib/office-requests/types";

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

/** أرقام فقط، مناسبة لمسار `wa.me` (كود دولة بدون +). */
export function toWhatsappWaMeDigits(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (!d) return "";

  if (d.startsWith("0020")) {
    d = d.slice(2);
  }

  if (d.startsWith("20") && d.length >= 11) {
    return d;
  }

  if (d.startsWith("01") && d.length >= 10 && d.length <= 11) {
    return `20${d.slice(1)}`;
  }

  if (d.length === 10 && /^1[0125]\d/.test(d)) {
    return `20${d}`;
  }

  return d;
}

export function renderTemplate(args: {
  template: MessageTemplate;
  request: OfficeRequest;
  office: Office;
  /** e.g. https://example.com — required for `{bookingPassUrl}` */
  siteOrigin?: string;
  /** Path segment locale for the pass link: `ar` | `en` | `zh` */
  locale?: string;
  /** تسميات حالات المسافرين من لوحة الإدارة؛ تُستخدم مع `travelerStateId`. */
  travelerStateLabelById?: Record<string, string>;
}) {
  const locale =
    args.locale === "en" || args.locale === "zh" ? args.locale : "ar";
  const origin = args.siteOrigin?.trim() ?? "";
  const bookingPassUrl =
    origin && args.request.passToken
      ? buildBookingPassUrl(origin, locale, args.request.id, args.request.passToken)
      : "";

  const travelerCategoryAr = args.request.travelerCategory
    ? TRAVELER_CATEGORY_LABELS[args.request.travelerCategory]
    : "";

  const stateId = effectiveTravelerStateIdOnRequest(args.request);
  const map = args.travelerStateLabelById ?? {};
  const travelerStateAr =
    stateId && map[stateId]
      ? map[stateId]
      : stateId && !args.request.travelerCategory
        ? stateId
        : travelerCategoryAr;

  const values: Record<string, string> = {
    name: args.request.name,
    phone: args.request.phone,
    officeName: args.office.nameAr,
    officeAddress: args.office.addressAr,
    officeMapUrl: args.office.mapsUrl,
    requestType: args.request.type,
    requestTypeAr: REQUEST_TYPE_LABELS[args.request.type],
    requestDetails: args.request.details,
    bookingPassUrl,
    preferredDate: args.request.preferredDate ?? "",
    travelerCategoryAr: travelerCategoryAr || travelerStateAr,
    travelerStateAr: travelerStateAr || travelerCategoryAr,
    requestId: args.request.id,
  };

  return args.template.body.replace(/\{([a-zA-Z]+)\}/g, (_match, key) => {
    return values[key] ?? "";
  });
}

export function whatsappUrl(phone: string, message: string) {
  const digits = toWhatsappWaMeDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
