import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { search } from "./helpers.js";

describe("POST /api/publications/search (input validation and envelope)", () => {
  it("returns a paginated response envelope for an empty body", async () => {
    const { status, body } = await search({});
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.items));
    assert.equal(typeof body.total, "number");
    assert.equal(body.offset, 0);
    assert.equal(body.limit, 20);
    assert.ok(body.items.length <= body.limit);
    assert.ok(body.total >= body.items.length);
  });

  it("honours limit and offset", async () => {
    const { status, body } = await search({ limit: 2, offset: 1 });
    assert.equal(status, 200);
    assert.equal(body.limit, 2);
    assert.equal(body.offset, 1);
    assert.ok(body.items.length <= 2);
  });

  it("sorts by publication_key ascending and descending", async () => {
    const asc = await search({ limit: 10, sort: { field: "publication_key", direction: "asc" } });
    const desc = await search({ limit: 10, sort: { field: "publication_key", direction: "desc" } });
    assert.equal(asc.status, 200);
    assert.equal(desc.status, 200);
    const keys = (r) => r.body.items.map((i) => i.publication_key);
    assert.deepEqual(keys(asc), [...keys(asc)].sort((a, b) => a - b));
    assert.deepEqual(keys(desc), [...keys(desc)].sort((a, b) => b - a));
  });

  it("returns no items when nothing matches", async () => {
    const { status, body } = await search({
      filter: { field: "title", operator: "contains", value: "zzz-no-such-title-zzz-9f3a1c" },
    });
    assert.equal(status, 200);
    assert.deepEqual(body.items, []);
    assert.equal(body.total, 0);
  });

  it("rejects an unknown filter field with 400", async () => {
    const { status } = await search({ filter: { field: "bogus", operator: "eq", value: "x" } });
    assert.equal(status, 400);
  });

  it("rejects an invalid operator with 400", async () => {
    const { status } = await search({ filter: { field: "title", operator: "bogus", value: "x" } });
    assert.equal(status, 400);
  });

  it("rejects an unsupported operator for map_scale with 400", async () => {
    const { status } = await search({ filter: { field: "map_scale", operator: "contains", value: "1" } });
    assert.equal(status, 400);
  });

  it("rejects invalid pagination with 400", async () => {
    assert.equal((await search({ limit: 0 })).status, 400);
    assert.equal((await search({ offset: -1 })).status, 400);
  });

  it("rejects an invalid sort with 400", async () => {
    const { status } = await search({ sort: { field: "bogus", direction: "asc" } });
    assert.equal(status, 400);
  });
});

// These tests pick an existing record at runtime, so they work against any
// non-empty database (seeded or live) and are skipped when it is empty.
describe("POST /api/publications/search (filters against existing data)", () => {
  let records = [];
  let sample;

  before(async () => {
    const { body } = await search({ limit: 2, sort: { field: "publication_key", direction: "asc" } });
    records = body.items;
    sample = records[0];
  });

  const withSample = (fn) => async (t) => {
    if (!sample) return t.skip("database has no publications");
    await fn(t);
  };

  const hasSample = (body) => body.items.some((i) => i.publication_key === sample.publication_key);

  it("finds a record by exact publication_key", withSample(async () => {
    const { status, body } = await search({
      filter: { field: "publication_key", operator: "eq", value: sample.publication_key },
    });
    assert.equal(status, 200);
    assert.equal(body.total, 1);
    assert.equal(body.items[0].publication_key, sample.publication_key);
  }));

  it("finds a record by title substring, case-insensitively", withSample(async (t) => {
    if (!sample.title) return t.skip("sample has no title");
    const { status, body } = await search({
      filter: { field: "title", operator: "contains", value: sample.title.toUpperCase() },
    });
    assert.equal(status, 200);
    assert.ok(hasSample(body));
    for (const item of body.items) {
      assert.ok(item.title.toLowerCase().includes(sample.title.toLowerCase()));
    }
  }));

  it("finds a record by author", withSample(async (t) => {
    if (!sample.originator) return t.skip("sample has no author");
    const { body } = await search({
      filter: { field: "author", operator: "eq", value: sample.originator },
    });
    assert.ok(hasSample(body));
  }));

  it("finds a record by keyword", withSample(async (t) => {
    const keyword = sample.theme_keyword_1 ?? sample.place_keyword_1;
    if (!keyword) return t.skip("sample has no keywords");
    const { body } = await search({
      filter: { and: [
        { field: "keyword", operator: "eq", value: keyword },
        { field: "publication_key", operator: "eq", value: sample.publication_key },
      ] },
    });
    assert.equal(body.total, 1);
  }));

  it("finds a record using the 'any' field", withSample(async (t) => {
    if (!sample.title) return t.skip("sample has no title");
    const { body } = await search({
      filter: { field: "any", operator: "contains", value: sample.title },
    });
    assert.ok(hasSample(body));
  }));

  it("supports AND combinations", withSample(async () => {
    const match = await search({
      filter: { and: [
        { field: "publication_key", operator: "eq", value: sample.publication_key },
        { field: "publication_key", operator: "gte", value: sample.publication_key },
      ] },
    });
    assert.equal(match.body.total, 1);

    const noMatch = await search({
      filter: { and: [
        { field: "publication_key", operator: "eq", value: sample.publication_key },
        { field: "publication_key", operator: "neq", value: sample.publication_key },
      ] },
    });
    assert.equal(noMatch.body.total, 0);
  }));

  it("supports OR combinations", withSample(async (t) => {
    if (records.length < 2) return t.skip("database has fewer than 2 publications");
    const { body } = await search({
      filter: { or: records.map((r) => ({ field: "publication_key", operator: "eq", value: r.publication_key })) },
    });
    assert.equal(body.total, records.length);
  }));

  it("paginates consistently", withSample(async (t) => {
    const sort = { field: "publication_key", direction: "asc" };
    const all = await search({ sort, limit: 2 });
    if (all.body.total < 2) return t.skip("database has fewer than 2 publications");
    const p1 = await search({ sort, limit: 1, offset: 0 });
    const p2 = await search({ sort, limit: 1, offset: 1 });
    assert.equal(p1.body.items.length, 1);
    assert.equal(p2.body.items.length, 1);
    assert.ok(p1.body.items[0].publication_key < p2.body.items[0].publication_key);
  }));
});
