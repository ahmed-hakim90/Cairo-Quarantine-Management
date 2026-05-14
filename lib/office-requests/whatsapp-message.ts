import type { MessageTemplate, Office, OfficeRequest } from "@/lib/office-requests/types";

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
}) {
  const values: Record<string, string> = {
    name: args.request.name,
    phone: args.request.phone,
    officeName: args.office.nameAr,
    officeAddress: args.office.addressAr,
    officeMapUrl: args.office.mapsUrl,
    requestType: args.request.type,
    requestDetails: args.request.details,
  };

  return args.template.body.replace(/\{([a-zA-Z]+)\}/g, (_match, key) => {
    return values[key] ?? "";
  });
}

export function whatsappUrl(phone: string, message: string) {
  const digits = toWhatsappWaMeDigits(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
