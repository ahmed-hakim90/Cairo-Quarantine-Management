import { VACCINATION_CENTERS } from "@/data/locations";
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
  const asksForHajj =
    normalized.includes("حج") || normalized.includes("الحج") || normalized.includes("عمره");
  const asksForOffice =
    normalized.includes("اقرب") ||
    normalized.includes("مكتب") ||
    normalized.includes("مكاتب") ||
    normalized.includes("عنوان") ||
    normalized.includes("مدينة نصر") ||
    normalized.includes("مدينه نصر");

  if (asksForOffice) return buildNearestOfficeResponse(message, locale);
  if (asksForHajj) return buildHajjResponse(locale);

  return null;
}
