import { buildWhatsappComplaintsUrl } from "@/lib/site-contact";

function whatsappMarkdownLink(locale: string | undefined, label: string): string {
  const href = buildWhatsappComplaintsUrl();
  if (!href) return label;
  return `[${label}](${href})`;
}

export function whatsappOutOfScopeMessage(locale: string | undefined): string {
  if (locale === "en") {
    return `For assistance, please contact us on WhatsApp:\n${whatsappMarkdownLink(locale, "Open WhatsApp")}`;
  }
  if (locale === "zh") {
    return `如需帮助，请通过 WhatsApp 联系我们：\n${whatsappMarkdownLink(locale, "打开 WhatsApp")}`;
  }
  if (locale === "fr") {
    return `Pour toute assistance, contactez-nous via WhatsApp :\n${whatsappMarkdownLink(locale, "Ouvrir WhatsApp")}`;
  }
  return `للمساعدة يرجى التواصل عبر واتساب:\n${whatsappMarkdownLink(locale, "فتح واتساب")}`;
}

export function whatsappUnknownInfoMessage(locale: string | undefined): string {
  if (locale === "en") {
    return `I do not have this information in the system at the moment.\nTo contact us: ${whatsappMarkdownLink(locale, "Open WhatsApp")}`;
  }
  if (locale === "zh") {
    return `目前系统中没有该信息。\n${whatsappMarkdownLink(locale, "打开 WhatsApp")}`;
  }
  if (locale === "fr") {
    return `Je ne dispose pas de cette information dans le systeme pour le moment.\n${whatsappMarkdownLink(locale, "Ouvrir WhatsApp")}`;
  }
  return `حالياً لا أملك هذه المعلومة داخل النظام.\nللتواصل: ${whatsappMarkdownLink(locale, "تواصل عبر واتساب")}`;
}

export function whatsappHumanHandoffMessage(locale: string | undefined): string {
  if (locale === "en") {
    return `You can reach our team on WhatsApp:\n${whatsappMarkdownLink(locale, "Open WhatsApp")}`;
  }
  if (locale === "zh") {
    return `如需人工协助，请通过 WhatsApp 联系我们：\n${whatsappMarkdownLink(locale, "打开 WhatsApp")}`;
  }
  if (locale === "fr") {
    return `Pour parler a un conseiller, contactez-nous via WhatsApp :\n${whatsappMarkdownLink(locale, "Ouvrir WhatsApp")}`;
  }
  return `للتحدث مع فريق الدعم تواصل عبر واتساب:\n${whatsappMarkdownLink(locale, "فتح واتساب")}`;
}

export function getWhatsappLinkForPrompt(): string {
  return buildWhatsappComplaintsUrl() ?? "https://wa.me/";
}
