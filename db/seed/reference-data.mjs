/**
 * Reference rows for PostgreSQL local/VPS seeding.
 * Sources match scripts/seed-firestore-*.mjs and lib/office-requests/static-offices.ts.
 */

import { readFileSync } from "node:fs";

function deriveTravelerStateIdsFromService(service) {
  if (service === "hajj_umrah_only") {
    return ["hajj_umrah", "citizen"];
  }
  return ["international", "hajj_umrah", "citizen"];
}

function loadCairoOffices() {
  const source = readFileSync("data/hajj-traveler-offices-cairo.ts", "utf8");
  const match = source.match(
    /export const CAIRO_TRAVELER_VACCINATION_OFFICES:[\s\S]*?=\s*(\[[\s\S]*?\]);/,
  );
  if (!match) {
    throw new Error("Could not find CAIRO_TRAVELER_VACCINATION_OFFICES.");
  }
  return Function(`return (${match[1]});`)();
}

function loadVaccinesByCategory() {
  const source = readFileSync("data/vaccines.ts", "utf8");
  const match = source.match(
    /export const VACCINES_BY_CATEGORY:[\s\S]*?=\s*(\{[\s\S]*?\n\});/,
  );
  if (!match) {
    throw new Error("Could not find VACCINES_BY_CATEGORY.");
  }
  return Function(`return (${match[1]});`)();
}

export const DEFAULT_GOVERNORATE_ID = "cairo";

export const TRAVELER_STATES = [
  { id: "international", labelAr: "مسافر دولي", sortOrder: 0 },
  { id: "hajj_umrah", labelAr: "حاج / معتمر", sortOrder: 1 },
  { id: "citizen", labelAr: "مواطن", sortOrder: 2 },
];

export function officeRows() {
  const offices = loadCairoOffices();
  return offices.map((office) => ({
    id: office.id,
    governorate_id: DEFAULT_GOVERNORATE_ID,
    serial_in_governorate: office.serialInGovernorate,
    administration_ar: office.administrationAr,
    name_ar: office.officeNameAr,
    address_ar: office.addressAr,
    phone: office.phone,
    maps_url: office.mapsUrl,
    service: office.service,
    active: true,
    traveler_state_ids: deriveTravelerStateIdsFromService(office.service),
    daily_booking_cap: null,
  }));
}

export function vaccineRows() {
  const byCategory = loadVaccinesByCategory();
  const rows = [];
  let sortOrder = 0;
  for (const [category, list] of Object.entries(byCategory)) {
    for (const v of list) {
      rows.push({
        id: v.id,
        category,
        name_ar: v.nameAr,
        name_en: v.nameEn,
        name_fr: v.nameFr,
        price_egp: v.free ? null : v.priceEgp,
        free: Boolean(v.free),
        sort_order: sortOrder++,
        active: true,
      });
    }
  }
  return rows;
}
