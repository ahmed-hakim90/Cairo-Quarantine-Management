import {
  CAIRO_TRAVELER_VACCINATION_OFFICES,
  type CairoTravelerVaccinationOffice,
} from "@/data/hajj-traveler-offices-cairo";
import type { Office } from "@/lib/office-requests/types";

export function officeFromStatic(row: CairoTravelerVaccinationOffice): Office {
  return {
    id: row.id,
    serialInGovernorate: row.serialInGovernorate,
    administrationAr: row.administrationAr,
    nameAr: row.officeNameAr,
    addressAr: row.addressAr,
    phone: row.phone,
    mapsUrl: row.mapsUrl,
    service: row.service,
    active: true,
  };
}

export const STATIC_OFFICES: Office[] =
  CAIRO_TRAVELER_VACCINATION_OFFICES.map(officeFromStatic);
