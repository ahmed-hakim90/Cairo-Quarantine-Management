export type CatalogImportMode = "bootstrap" | "update";

export type CatalogFieldChange = {
  field: string;
  labelAr: string;
  before: string;
  after: string;
};

export type CatalogPreviewRow = {
  id: string;
  label: string;
  kind: "create" | "update" | "unchanged" | "error";
  changes?: CatalogFieldChange[];
  message?: string;
  sortOrder?: number;
};

export type CatalogPreviewError = {
  message: string;
  sortOrder?: number;
  id?: string;
};

export type CatalogImportPreview = {
  mode: CatalogImportMode;
  summary: {
    create: number;
    update: number;
    unchanged: number;
    error: number;
  };
  creates: CatalogPreviewRow[];
  updates: CatalogPreviewRow[];
  unchanged: CatalogPreviewRow[];
  errors: CatalogPreviewError[];
  parseErrors: string[];
};

export type CatalogFieldDef<T> = {
  field: string;
  labelAr: string;
  get: (item: T) => string;
};

export function diffRecordFields<T>(
  current: T,
  next: T,
  fieldDefs: CatalogFieldDef<T>[],
): CatalogFieldChange[] {
  const changes: CatalogFieldChange[] = [];
  for (const def of fieldDefs) {
    const before = def.get(current).trim();
    const after = def.get(next).trim();
    if (before !== after) {
      changes.push({
        field: def.field,
        labelAr: def.labelAr,
        before,
        after,
      });
    }
  }
  return changes;
}

export function buildCatalogImportPreview<
  TRow extends { id: string },
  TExisting extends { id: string },
>(args: {
  rows: TRow[];
  existing: TExisting[];
  parseErrors: string[];
  getLabel: (row: TRow) => string;
  getSortOrder?: (row: TRow) => number | undefined;
  getMutableChanges: (current: TExisting, row: TRow) => CatalogFieldChange[];
  unknownMessage: (row: TRow) => string;
}): CatalogImportPreview {
  const mode: CatalogImportMode =
    args.existing.length === 0 ? "bootstrap" : "update";
  const byId = new Map(args.existing.map((item) => [item.id, item]));

  const creates: CatalogPreviewRow[] = [];
  const updates: CatalogPreviewRow[] = [];
  const unchanged: CatalogPreviewRow[] = [];
  const errors: CatalogPreviewError[] = args.parseErrors.map((message) => ({
    message,
  }));

  for (const row of args.rows) {
    const label = args.getLabel(row);
    const sortOrder = args.getSortOrder?.(row);

    if (mode === "bootstrap") {
      creates.push({ id: row.id, label, kind: "create", sortOrder });
      continue;
    }

    const current = byId.get(row.id);
    if (!current) {
      errors.push({
        message: args.unknownMessage(row),
        sortOrder,
        id: row.id,
      });
      continue;
    }

    const changes = args.getMutableChanges(current, row);
    if (changes.length === 0) {
      unchanged.push({ id: row.id, label, kind: "unchanged", sortOrder });
    } else {
      updates.push({
        id: row.id,
        label,
        kind: "update",
        changes,
        sortOrder,
      });
    }
  }

  return {
    mode,
    summary: {
      create: creates.length,
      update: updates.length,
      unchanged: unchanged.length,
      error: errors.length,
    },
    creates,
    updates,
    unchanged,
    errors,
    parseErrors: args.parseErrors,
  };
}
