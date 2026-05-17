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

function egyptianInternationalDigits(value: string): string | null {
  let d = value.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0020")) d = d.slice(2);
  if (d.startsWith("20") && d.length === 12 && /^20(?:10|11|12|15)/.test(d)) {
    return d;
  }
  if (d.startsWith("01") && d.length === 11 && /^01[0125]/.test(d)) {
    return `20${d.slice(1)}`;
  }
  if (d.length === 10 && /^1[0125]/.test(d)) {
    return `20${d}`;
  }
  return null;
}

/** صيغة تخزين موحدة لأرقام مصر عند الإمكان: +201xxxxxxxxx. */
export function normalizePhoneForStorage(value: string): string {
  const intl = egyptianInternationalDigits(value);
  if (intl) return `+${intl}`;
  return normalizePhone(value);
}

/** صيغ بحث تغطي المحلي والدولي والقديم بدون migration للطلبات السابقة. */
export function phoneLookupVariants(value: string): string[] {
  const variants = new Set<string>();
  const cleaned = normalizePhone(value);
  const digits = value.replace(/\D/g, "");
  if (cleaned) variants.add(cleaned);
  if (digits) variants.add(digits);

  const intl = egyptianInternationalDigits(value);
  if (intl) {
    variants.add(`+${intl}`);
    variants.add(intl);
    variants.add(`00${intl}`);
    variants.add(`0${intl.slice(2)}`);
    variants.add(intl.slice(2));
  }

  return [...variants].filter(Boolean);
}

/** أرقام فقط، مناسبة لمسار `wa.me` (كود دولة بدون +). */
export function toWhatsappWaMeDigits(phone: string): string {
  const intl = egyptianInternationalDigits(phone);
  return intl ?? phone.replace(/\D/g, "");
}

export function renderTemplate(args: {
  template: MessageTemplate;
  request: OfficeRequest;
  office: Office;
  /** e.g. https://example.com — required for `{bookingPassUrl}` */
  siteOrigin?: string;
  /** Path segment locale for the pass link: `ar` | `en` | `zh` | `fr` */
  locale?: string;
  /** تسميات حالات المسافرين من لوحة الإدارة؛ تُستخدم مع `travelerStateId`. */
  travelerStateLabelById?: Record<string, string>;
}) {
  const locale =
    args.locale === "en" || args.locale === "zh" || args.locale === "fr"
      ? args.locale
      : "ar";
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
