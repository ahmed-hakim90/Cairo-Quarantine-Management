import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

type LocaleLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  locale: Locale;
  href: string;
};

export function LocaleLink({ locale, href, ...rest }: LocaleLinkProps) {
  const localized =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:")
      ? href
      : `/${locale}${href.startsWith("/") ? href : `/${href}`}`;

  return <Link href={localized} {...rest} />;
}
