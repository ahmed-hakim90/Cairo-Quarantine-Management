export function formatRequestNumber(officeId: string, sequence: number): string {
  return `${officeId.trim()}-${String(sequence).padStart(6, "0")}`;
}

export function requestNumberLookupVariants(value: string): string[] {
  const compact = value.trim().replace(/\s+/g, "");
  const values = new Set<string>();
  if (compact) {
    values.add(compact);
    values.add(compact.toUpperCase());
    values.add(compact.toLowerCase());
  }

  const digits = compact.replace(/\D/g, "");
  if (digits) {
    values.add(digits);
    values.add(`CQM-${digits.padStart(6, "0")}`);
  }

  return [...values];
}
