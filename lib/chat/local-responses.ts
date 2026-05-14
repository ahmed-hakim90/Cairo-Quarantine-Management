import { VACCINATION_CENTERS } from "@/data/locations";
import type { VaccineRecord } from "@/data/vaccines";
import { VACCINES_BY_CATEGORY } from "@/data/vaccines";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

function normalizeArabic(value: string) {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getLocale(localeValue: string | undefined) {
  return localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
}

function getPortalPath(localeValue: string | undefined, path = "") {
  const locale = getLocale(localeValue);
  return path ? `/${locale}/${path}` : `/${locale}`;
}

function isPriceQuestion(normalized: string) {
  return (
    normalized.includes("تكلف") ||
    normalized.includes("سعر") ||
    normalized.includes("بكم") ||
    normalized.includes("كام") ||
    normalized.includes("جنيه") ||
    normalized.includes("egp") ||
    normalized.includes("مصاريف")
  );
}

function vaccineDisplayName(record: VaccineRecord, locale: string) {
  if (locale === "en") return record.nameEn;
  if (locale === "zh") return record.nameEn;
  return record.nameAr;
}

function buildVaccinePriceResponse(
  localeValue: string | undefined,
  trip: "umrah" | "hajj" | "both",
) {
  const loc = getLocale(localeValue);
  const messages = getMessages(loc);
  const currency = messages.vaccineSelector.currency;

  const freeLabel = loc === "en" ? "free" : loc === "zh" ? "free" : "مجانا";
  const unspecified =
    loc === "en" ? "not listed in portal data" : loc === "zh" ? "not listed" : "غير محدد في بيانات البوابة";

  function line(record: VaccineRecord) {
    const name = vaccineDisplayName(record, loc);
    if (record.free) return `- ${name}: ${freeLabel}`;
    if (record.priceEgp == null) return `- ${name}: ${unspecified}`;
    return `- ${name}: ${record.priceEgp} ${currency}`;
  }

  const lines: string[] = [];

  if (trip === "umrah" || trip === "both") {
    if (trip === "both") {
      lines.push(
        loc === "en"
          ? "Umrah (indicative, from portal catalog):"
          : loc === "zh"
            ? "Umrah (indicative, from portal catalog):"
            : "العمرة — أسعار استرشادية من بيانات البوابة:",
      );
    } else {
      lines.push(
        loc === "en"
          ? "Umrah vaccination (indicative, from portal catalog):"
          : loc === "zh"
            ? "Umrah vaccination (indicative):"
            : "تكلفة تطعيم العمرة (استرشادية من بيانات البوابة):",
      );
    }
    lines.push(...VACCINES_BY_CATEGORY.umrah.map(line));
    if (trip === "both") lines.push("");
  }

  if (trip === "hajj" || trip === "both") {
    if (trip === "both") {
      lines.push(
        loc === "en"
          ? "Hajj (indicative, from portal catalog):"
          : loc === "zh"
            ? "Hajj (indicative, from portal catalog):"
            : "الحج — أسعار استرشادية من بيانات البوابة:",
      );
    } else {
      lines.push(
        loc === "en"
          ? "Hajj vaccination (indicative, from portal catalog):"
          : loc === "zh"
            ? "Hajj vaccination (indicative):"
            : "تكلفة تطعيم الحج (استرشادية من بيانات البوابة):",
      );
    }
    lines.push(...VACCINES_BY_CATEGORY.hajj.map(line));
  }

  lines.push(
    "",
    loc === "en"
      ? "Confirm the fee and required vaccines at your approved centre; prices may change."
      : loc === "zh"
        ? "Confirm fees and required vaccines at your approved centre."
        : "تأكد من السعر واللقاح المطلوب في المركز المعتمد؛ قد تتغير الأسعار.",
    `المصدر: أداة الاستعلام وصفحة الحج والعمرة: ${getPortalPath(localeValue, "hajj-umrah")}`,
  );

  return lines.join("\n");
}

function buildHajjResponse(localeValue: string | undefined) {
  const messages = getMessages(getLocale(localeValue));
  const hajj = messages.pages.hajj;

  return [
    "لو مسافر للحج، ركّز على تجهيز التطعيمات والوثائق قبل موعد السفر بوقت كافٍ.",
    "الآتي ملخص عملي من معلومات البوابة، مع ضرورة تأكيد آخر تعليمات من القنوات الرسمية.",
    "",
    `1. جهّز الوثائق المطلوبة: ${hajj.documentBullets.join("، ")}.`,
    `2. راجع التطعيمات الأساسية: ${hajj.basicsBody}`,
    "3. احتفظ بأصل شهادة التطعيم المعتمدة، وتأكد أن بياناتك مطابقة لجواز السفر والبطاقة.",
    `4. اتبع التعليمات المهمة: ${hajj.instructions.join(" ")}`,
    `5. مكان الخدمة: ${hajj.pricing.locationsBody} استخدم جدول مكاتب تطعيم المسافرين في البوابة لاختيار المكتب المناسب.`,
    "6. قبل الذهاب، تأكد من المواعيد والخدمة المطلوبة من المركز المعتمد أو القنوات الرسمية.",
    "",
    `المصدر: صفحة الحج والعمرة بالبوابة: ${getPortalPath(localeValue, "hajj-umrah")}`,
  ].join("\n");
}

function buildNearestOfficeResponse(message: string, localeValue: string | undefined) {
  const normalized = normalizeArabic(message);
  const nasrCityCenters = VACCINATION_CENTERS.filter((center) =>
    normalizeArabic(
      `${center.centerNameAr} ${center.administrationAr} ${center.addressAr}`,
    ).includes("مدينه نصر"),
  );
  const centers =
    normalized.includes("مدينه نصر") && nasrCityCenters.length > 0
      ? nasrCityCenters
      : VACCINATION_CENTERS.slice(0, 3);

  return [
    normalized.includes("مدينه نصر")
      ? "أقرب الاختيارات المسجلة في البوابة لمدينة نصر هي مكاتب مدينة نصر نفسها."
      : "لتحديد أقرب مكتب بدقة، اختر من جدول مكاتب تطعيم المسافرين حسب منطقتك أو اكتب لي اسم المنطقة.",
    "راجع المواعيد والخدمة قبل الذهاب لأن البيانات إرشادية وقد تتغير.",
    "",
    ...centers.map((center, index) => {
      const phone =
        center.phone && center.phone !== "—"
          ? `، تليفون: ${center.phone}`
          : "، لا يوجد رقم تليفون مسجل";
      const map = center.mapsUrl ? `\n   الخريطة: ${center.mapsUrl}` : "";
      return `${index + 1}. ${center.centerNameAr} — ${center.addressAr}${phone}${map}`;
    }),
    `${centers.length + 1}. لو عايز مكتب أقرب، ابعت اسم المنطقة أو الحي بالضبط.`,
    "",
    `المصدر: جدول مكاتب تطعيم المسافرين بالبوابة: ${getPortalPath(localeValue)}#locations-heading`,
  ].join("\n");
}

export function getLocalChatResponse({
  locale,
  message,
}: {
  locale: string | undefined;
  message: string;
}) {
  const normalized = normalizeArabic(message);
  const mentionsUmrah =
    normalized.includes("عمره") || normalized.includes("معتم") || normalized.includes("اعتمر");
  const mentionsHajj =
    normalized.includes("حج") || normalized.includes("الحج") || normalized.includes("حاج");
  const asksForHajj = mentionsHajj;
  const asksForOffice =
    normalized.includes("اقرب") ||
    normalized.includes("مكتب") ||
    normalized.includes("مكاتب") ||
    normalized.includes("عنوان") ||
    normalized.includes("مدينة نصر") ||
    normalized.includes("مدينه نصر");

  if (asksForOffice) return buildNearestOfficeResponse(message, locale);

  if (isPriceQuestion(normalized)) {
    if (mentionsUmrah && !mentionsHajj) return buildVaccinePriceResponse(locale, "umrah");
    if (mentionsHajj && !mentionsUmrah) return buildVaccinePriceResponse(locale, "hajj");
    return buildVaccinePriceResponse(locale, "both");
  }

  if (asksForHajj) return buildHajjResponse(locale);

  return null;
}
