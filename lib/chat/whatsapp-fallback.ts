import { formatWhatsappDisplayPhone } from "@/lib/site-contact";

export function whatsappOutOfScopeMessage(locale: string | undefined): string {
  const phone = formatWhatsappDisplayPhone();
  if (locale === "en") {
    return `For assistance, please contact us on WhatsApp:\n${phone}`;
  }
  if (locale === "zh") {
    return `如需帮助，请通过 WhatsApp 联系我们：\n${phone}`;
  }
  if (locale === "fr") {
    return `Pour toute assistance, contactez-nous via WhatsApp :\n${phone}`;
  }
  return `للمساعدة يرجى التواصل عبر واتساب:\n${phone}`;
}

export function whatsappUnknownInfoMessage(locale: string | undefined): string {
  const phone = formatWhatsappDisplayPhone();
  if (locale === "en") {
    return `I do not have this information in the system at the moment.\nTo contact us, please message us on WhatsApp:\n${phone}`;
  }
  if (locale === "zh") {
    return `目前系统中没有该信息。\n请通过 WhatsApp 联系我们：\n${phone}`;
  }
  if (locale === "fr") {
    return `Je ne dispose pas de cette information dans le systeme pour le moment.\nContactez-nous via WhatsApp :\n${phone}`;
  }
  return `حالياً لا أملك هذه المعلومة داخل النظام.\nللتواصل يرجى مراسلتنا عبر واتساب:\n${phone}`;
}
