export function formatRequestNumber(sequence: number): string {
  return `CQM-${String(sequence).padStart(6, "0")}`;
}
