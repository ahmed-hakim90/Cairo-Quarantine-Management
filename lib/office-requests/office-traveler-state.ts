import type { Office, TravelerCategory, TravelerState } from "@/lib/office-requests/types";
import { TRAVELER_CATEGORY_LABELS } from "@/lib/office-requests/types";

/** معرّفات تطابق المنطق القديم لـ `Office.service` عند غياب `travelerStateIds` في المكتب. */
export function deriveTravelerStateIdsFromService(
  service: Office["service"],
): string[] {
  if (service === "hajj_umrah_only") {
    return ["hajj_umrah", "citizen"];
  }
  return ["international", "hajj_umrah", "citizen"];
}

/**
 * يُستدعى عند حفظ مكتب مع `travelerStateIds` صريحة (غير فارغة).
 * يُحاذى مع `deriveTravelerStateIdsFromService`: وجود `international` يعني نطاق «مسافرين دوليين».
 */
export function inferOfficeServiceFromSelectedTravelerStateIds(
  ids: string[],
): Office["service"] {
  const set = new Set(ids.map((x) => String(x).trim()).filter(Boolean));
  return set.has("international") ? "hajj_umrah_travelers" : "hajj_umrah_only";
}

export function getOfficeTravelerStateIds(office: Office): string[] {
  const raw = office.travelerStateIds;
  if (Array.isArray(raw) && raw.length > 0) {
    return [...new Set(raw.map(String).filter(Boolean))];
  }
  return deriveTravelerStateIdsFromService(office.service);
}

export function officeAcceptsTravelerState(
  office: Office,
  stateId: string,
): boolean {
  return getOfficeTravelerStateIds(office).includes(stateId);
}

export function filterOfficesForTravelerState(
  offices: Office[],
  stateId: string,
): Office[] {
  return offices.filter((o) => officeAcceptsTravelerState(o, stateId));
}

/** عند عدم وجود وثائق في `traveler_states` بعد. */
export function defaultTravelerStatesFromLegacyLabels(): TravelerState[] {
  const ids = ["international", "hajj_umrah", "citizen"] as const;
  return ids.map((id, i) => ({
    id,
    labelAr: TRAVELER_CATEGORY_LABELS[id],
    sortOrder: i,
    active: true,
  }));
}

/** دمج تسميات الحالات مع التسميات الافتراضية للمعرّفات القديمة الثلاثة. */
export function mergeTravelerStateLabelsWithLegacy(
  states: TravelerState[],
): Record<string, string> {
  const out: Record<string, string> = Object.fromEntries(
    states.map((s) => [s.id, s.labelAr]),
  );
  for (const id of ["international", "hajj_umrah", "citizen"] as const) {
    if (!out[id]) out[id] = TRAVELER_CATEGORY_LABELS[id];
  }
  return out;
}

export function effectiveTravelerStateIdOnRequest(request: {
  travelerStateId?: string;
  travelerCategory?: TravelerCategory;
}): string | undefined {
  const sid = request.travelerStateId?.trim();
  if (sid) return sid;
  return request.travelerCategory;
}
