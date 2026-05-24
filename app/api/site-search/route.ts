import { findDestinationCountry } from "@/lib/chat/destination-country-response";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import {
  boostCountrySiteSearchResults,
  buildSiteKnowledgeIndex,
  countrySiteSearchResult,
  searchSiteKnowledge,
  sectionCountryRequirementsHref,
  toSiteSearchResult,
} from "@/lib/chat/site-knowledge";
import { listDestinationCountriesForPublic } from "@/lib/office-requests/store";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? defaultLocale;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const q = String(searchParams.get("q") ?? "").trim();
  const limitRaw = Number.parseInt(String(searchParams.get("limit") ?? "10"), 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 20)
    : 10;

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const [index, countries] = await Promise.all([
    buildSiteKnowledgeIndex(locale),
    listDestinationCountriesForPublic(),
  ]);

  let hits = searchSiteKnowledge(q, index, limit).map(toSiteSearchResult);
  hits = boostCountrySiteSearchResults(q, countries, hits, limit);

  if (hits.length === 0) {
    const country = findDestinationCountry(q, countries);
    if (country) {
      hits = [countrySiteSearchResult(country)];
    }
  }

  hits = hits.map((result) => {
    if (result.id !== "destination-country-requirements") return result;
    return {
      ...result,
      href: sectionCountryRequirementsHref(q),
    };
  });

  return NextResponse.json({ results: hits });
}
