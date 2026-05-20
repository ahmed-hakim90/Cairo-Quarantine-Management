import { describe, expect, it } from "vitest";
import {
  buildCatalogImportPreview,
  diffRecordFields,
  type CatalogFieldDef,
} from "@/lib/office-requests/catalog-import-preview";

type Item = { id: string; title: string; body: string };

const FIELDS: CatalogFieldDef<Item>[] = [
  { field: "title", labelAr: "العنوان", get: (i) => i.title },
  { field: "body", labelAr: "النص", get: (i) => i.body },
];

describe("diffRecordFields", () => {
  it("detects changed fields", () => {
    const changes = diffRecordFields(
      { id: "a", title: "قديم", body: "نفس" },
      { id: "a", title: "جديد", body: "نفس" },
      FIELDS,
    );
    expect(changes).toHaveLength(1);
    expect(changes[0]?.field).toBe("title");
  });
});

describe("buildCatalogImportPreview", () => {
  const existing: Item[] = [{ id: "t1", title: "أ", body: "نص" }];

  it("creates on bootstrap", () => {
    const preview = buildCatalogImportPreview({
      rows: [{ id: "t2", title: "ب", body: "x" }],
      existing: [],
      parseErrors: [],
      getLabel: (r) => r.id,
      getMutableChanges: (c, r) => diffRecordFields(c, r, FIELDS),
      unknownMessage: (r) => `unknown ${r.id}`,
    });
    expect(preview.summary.create).toBe(1);
  });

  it("updates and flags unknown", () => {
    const preview = buildCatalogImportPreview({
      rows: [
        { id: "t1", title: "أ", body: "محدّث" },
        { id: "t9", title: "ز", body: "x" },
      ],
      existing,
      parseErrors: ["صف 3: خطأ"],
      getLabel: (r) => r.id,
      getMutableChanges: (c, r) => diffRecordFields(c, r, FIELDS),
      unknownMessage: (r) => `unknown ${r.id}`,
    });
    expect(preview.summary.update).toBe(1);
    expect(preview.updates[0]?.changes?.[0]?.field).toBe("body");
    expect(preview.summary.error).toBe(2);
  });
});
