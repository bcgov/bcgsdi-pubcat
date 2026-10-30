import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { download, search, XLSX_TYPE } from "./helpers.js";

// The download endpoint is limited to 5 requests per hour per client (invalid
// requests count too), so this file deliberately makes at most 4 requests.
const isXlsx = (bytes) => bytes.subarray(0, 2).toString("latin1") === "PK";

describe("POST /api/publications/download", () => {
  it("returns an xlsx file for an existing record", async (t) => {
    const { body } = await search({ limit: 1, sort: { field: "publication_key", direction: "asc" } });
    const sample = body.items[0];
    if (!sample) return t.skip("database has no publications");

    const res = await download({
      filter: { field: "publication_key", operator: "eq", value: sample.publication_key },
      sort: { field: "title", direction: "asc" },
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), new RegExp(XLSX_TYPE.replaceAll(".", "\\.")));
    assert.match(res.headers.get("content-disposition"), /attachment; filename="publication-search\.xlsx"/);
    assert.ok(isXlsx(res.bytes), "body should be a zip-based xlsx file");
  });

  it("returns a valid xlsx file when no records match", async () => {
    const res = await download({
      filter: { field: "title", operator: "contains", value: "zzz-no-such-title-zzz-9f3a1c" },
    });
    assert.equal(res.status, 200);
    assert.ok(isXlsx(res.bytes));
  });

  it("rejects an unsupported Accept format with 400", async () => {
    const res = await download({}, "text/csv");
    assert.equal(res.status, 400);
  });

  it("rejects an invalid filter with 400", async () => {
    const res = await download({ filter: { field: "bogus", operator: "eq", value: "x" } });
    assert.equal(res.status, 400);
  });
});
