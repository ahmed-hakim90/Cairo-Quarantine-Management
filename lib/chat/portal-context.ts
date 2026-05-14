import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function buildPortalContextSnippet(localeValue: string | undefined) {
  const locale = localeValue && isLocale(localeValue) ? localeValue : defaultLocale;
  const messages = getMessages(locale);
  const hajj = messages.pages.hajj;

  return [
    "Portal facts. Use these facts when relevant and do not contradict them:",
    `Site: ${messages.meta.siteName}.`,
    `Hajj/Umrah page: ${hajj.heading}. ${hajj.description}`,
    `${hajj.basicsTitle}: ${hajj.basicsBody}`,
    `${hajj.beforeTravel} documents: ${hajj.documentBullets.join(" | ")}.`,
    `${hajj.instructionsTitle}: ${hajj.instructions.join(" | ")}.`,
    `${hajj.pricing.locationsTitle}: ${hajj.pricing.locationsBody}`,
    `Office table: ${messages.hajjTable.heading}. ${messages.hajjTable.intro}`,
    "For nearest-office, address, phone, or map questions: do not invent a specific office. Tell the user to use the portal office/location table, choose the nearest office by governorate/address, and confirm before visiting through official channels or the authorized center.",
  ].join("\n");
}
