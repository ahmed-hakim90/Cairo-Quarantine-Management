import { describe, expect, it, vi } from "vitest";
import { findDestinationCountry } from "@/lib/chat/destination-country-response";
import {
  boostCountrySiteSearchResults,
  buildSiteKnowledgeIndex,
  countrySiteSearchResult,
  formatPortalHref,
  searchSiteKnowledge,
  toSiteSearchResult,
} from "@/lib/chat/site-knowledge";

const mockCountries = [
  {
    id: "sa",
    nameEn: "Saudi Arabia",
    nameAr: "المملكة العربية السعودية",
    requirementsAr: "تطعيم الحمى الشوكية والإنfluenza.",
    sortOrder: 1,
  },
];

vi.mock("@/lib/office-requests/store", () => ({
  listOffices: vi.fn(async () => [
    {
      id: "cairo-trav-14",
      nameAr: "مكتب صحة عباسية",
      addressAr: "2 شارع المستشفى الإيطالي، عباسية",
      administrationAr: "الوايلي",
      phone: "0226820000",
      service: "hajj_umrah_travelers",
      active: true,
      serialInGovernorate: 14,
    },
  ]),
  listVaccinesByCategoryForPublic: vi.fn(async () => ({
    international: [],
    hajj: [],
    umrah: [],
    citizen: [],
  })),
  listDestinationCountriesForPublic: vi.fn(async () => mockCountries),
}));

describe("site knowledge search for public nav", () => {
  it("finds hajj page for Arabic hajj query", async () => {
    const index = await buildSiteKnowledgeIndex("ar");
    const hits = searchSiteKnowledge("حج", index, 10);
    expect(hits.some((h) => h.id === "hajj-umrah")).toBe(true);
  });

  it("finds destination country with deep link", async () => {
    const index = await buildSiteKnowledgeIndex("ar");
    const hits = searchSiteKnowledge("السعودية", index, 10);
    const country = hits.find((h) => h.id === "country-sa");
    expect(country).toBeDefined();
    expect(country?.href).toBe(
      formatPortalHref("international-traveler", {
        query: { country: "sa" },
        hash: "destination-country-requirements",
      }),
    );
    expect(country?.resultType).toBe("country");
  });

  it("boosts country for partial Arabic name without al-", async () => {
    const match = findDestinationCountry("سعودية", mockCountries);
    expect(match?.id).toBe("sa");

    const boosted = boostCountrySiteSearchResults(
      "سعودية",
      mockCountries,
      [],
      10,
    );
    expect(boosted[0]?.id).toBe("country-sa");
    expect(boosted[0]?.href).toContain("country=sa");
  });

  it("puts country above generic section for طعوم السعودية", async () => {
    const index = await buildSiteKnowledgeIndex("ar");
    const hits = searchSiteKnowledge("طعوم السعودية", index, 10).map(
      toSiteSearchResult,
    );
    const boosted = boostCountrySiteSearchResults(
      "طعوم السعودية",
      mockCountries,
      hits,
      10,
    );
    expect(boosted[0]?.id).toBe("country-sa");
    expect(boosted[0]?.resultType).toBe("country");
  });

  it("country search result subtitle includes requirements", () => {
    const result = countrySiteSearchResult(mockCountries[0]!);
    expect(result.subtitle).toContain("تطعيم");
    expect(result.subtitle).not.toBe("Saudi Arabia");
  });

  it("finds office with office hash href", async () => {
    const index = await buildSiteKnowledgeIndex("ar");
    const hits = searchSiteKnowledge("عباسية", index, 10);
    const office = hits.find((h) => h.id === "office-cairo-trav-14");
    expect(office).toBeDefined();
    expect(office?.href).toContain("#office-cairo-trav-14");
    expect(office?.resultType).toBe("office");
  });

  it("maps search hits to API result shape", async () => {
    const index = await buildSiteKnowledgeIndex("ar");
    const hits = searchSiteKnowledge("حج", index, 3);
    const mapped = hits.map(toSiteSearchResult);
    expect(mapped[0]?.href).toBeTruthy();
    expect(mapped[0]?.resultType).toBeTruthy();
    expect(mapped[0]?.title).toBeTruthy();
  });
});
