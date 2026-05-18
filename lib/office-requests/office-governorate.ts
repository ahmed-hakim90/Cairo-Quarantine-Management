import type { Office } from "@/lib/office-requests/types";
import { filterOfficesForTravelerState } from "@/lib/office-requests/office-traveler-state";

export function filterOfficesForGovernorate(
  offices: Office[],
  governorateId: string,
): Office[] {
  const id = governorateId.trim();
  if (!id) return [];
  return offices.filter((office) => office.governorateId === id);
}

export function filterBookingOfficesForGovernorateAndTravelerState(
  offices: Office[],
  governorateId: string,
  travelerStateId: string,
): Office[] {
  const governorateOffices = filterOfficesForGovernorate(offices, governorateId);
  if (!travelerStateId.trim()) return [];
  return filterOfficesForTravelerState(governorateOffices, travelerStateId);
}
