/** Firestore page size used when scanning requests for super-admin export. */
export const SUPER_ADMIN_EXPORT_PAGE_SIZE = 400;

export type ExportCursorPaginationInput = {
  /** True when export uses `startAfter` across pages (single office or all offices). */
  usesCursorPagination: boolean;
  snapEmpty: boolean;
  snapSize: number;
  pageSize?: number;
};

/**
 * Whether cursor-based export pagination should stop before reading the current page.
 * Empty snapshot means there is no next page (end of collection).
 */
export function shouldStopExportCursorPagination(
  input: ExportCursorPaginationInput,
): boolean {
  if (!input.usesCursorPagination) return false;
  return input.snapEmpty;
}

/** After processing a page, stop if it was the last (partial) page. */
export function isLastExportCursorPage(
  snapSize: number,
  pageSize: number = SUPER_ADMIN_EXPORT_PAGE_SIZE,
): boolean {
  return snapSize < pageSize;
}

/** Guards against unbounded scans when in-memory filters reject every row. */
export function maxExportScanPages(
  maxRows: number,
  pageSize: number = SUPER_ADMIN_EXPORT_PAGE_SIZE,
): number {
  return Math.ceil(maxRows / pageSize) + 1;
}
