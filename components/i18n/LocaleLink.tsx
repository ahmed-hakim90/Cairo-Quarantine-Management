import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

type LocaleLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  locale: Locale;
  href: string;
};

export function LocaleLink({ locale, href, scroll, ...rest }: LocaleLinkProps) {
  const localized =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:")
      ? href
      : `/${locale}${href.startsWith("/") ? href : `/${href}`}`;

  const hasHash = href.includes("#");

  return (
    <Link
      href={localized}
      scroll={scroll ?? (hasHash ? false : undefined)}
      {...rest}
    />
  );
}
