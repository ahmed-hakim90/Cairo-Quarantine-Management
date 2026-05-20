export function decodeCatalogExcelFileBase64(payload: string): Buffer {
  const trimmed = payload.trim();
  const base64 = trimmed.includes(",")
    ? (trimmed.split(",").pop() ?? trimmed)
    : trimmed;
  return Buffer.from(base64, "base64");
}

/** @deprecated use decodeCatalogExcelFileBase64 */
export const decodeDestinationCountriesFileBase64 = decodeCatalogExcelFileBase64;
