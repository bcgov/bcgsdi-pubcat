import { afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../core/prisma.js";
import { UserInputError } from "../types/error.js";
import { PublicationServicePrivate } from "./publication-service.js";

describe("PublicationServicePrivate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------
  // validateFieldSupportsOperators
  // --------------------------------------------------

  describe("validateFieldSupportsOperators", () => {
    it("allows eq for map_scale", () => {
      expect(() =>
        PublicationServicePrivate.validateFieldSupportsOperators(
          "map_scale",
          "eq",
        ),
      ).not.toThrow();
    });

    it("rejects contains for map_scale", () => {
      expect(() =>
        PublicationServicePrivate.validateFieldSupportsOperators(
          "map_scale",
          "contains",
        ),
      ).toThrow(UserInputError);
    });

    it("rejects unsupported operators for map_scale", () => {
      expect(() =>
        PublicationServicePrivate.validateFieldSupportsOperators(
          "map_scale",
          "gt",
        ),
      ).toThrow("field 'map_scale' does not support operator 'gt'");
    });

    it("allows operators for fields without explicit restrictions", () => {
      expect(() =>
        PublicationServicePrivate.validateFieldSupportsOperators(
          "title",
          "contains",
        ),
      ).not.toThrow();
    });
  });

  // --------------------------------------------------
  // searchFieldToDbCol
  // --------------------------------------------------

  describe("searchFieldToDbCol", () => {
    it.each([
      ["publication_guid", "publication_guid"],
      ["publication_key", "publication_key"],
      ["title", "title"],
      ["abstract", "abstract"],
      ["publication_year", "publication_year"],
      ["author", "originator"],
      ["nts_map", "nts_maps"],
      ["map_scale", "scale"],
      ["series", "series_name"],
      ["issue_id", "issue_identification"],
      ["create_timestamp", "create_timestamp"],
      ["update_timestamp", "update_timestamp"],
    ])("maps %s to %s", (field, expected) => {
      expect(PublicationServicePrivate.searchFieldToDbCol(field as any)).toBe(
        expected,
      );
    });

    it("returns undefined for special fields", () => {
      expect(
        PublicationServicePrivate.searchFieldToDbCol("keyword"),
      ).toBeUndefined();

      expect(
        PublicationServicePrivate.searchFieldToDbCol("any"),
      ).toBeUndefined();
    });
  });

  // --------------------------------------------------
  // sortFieldToDbCol
  // --------------------------------------------------

  describe("sortFieldToDbCol", () => {
    it.each([
      ["publication_guid", "publication_guid"],
      ["publication_key", "publication_key"],
      ["title", "title"],
      ["abstract", "abstract"],
      ["publication_year", "publication_year"],
      ["author", "originator"],
      ["series", "series_name"],
      ["issue_id", "issue_identification"],
      ["create_timestamp", "create_timestamp"],
      ["update_timestamp", "update_timestamp"],
    ])("maps %s to %s", (field, expected) => {
      expect(PublicationServicePrivate.sortFieldToDbCol(field as any)).toBe(
        expected,
      );
    });

    it("returns undefined for unsupported sort mappings", () => {
      expect(
        PublicationServicePrivate.sortFieldToDbCol("invalid_sort_field" as any),
      ).toBeUndefined();
    });
  });

  // --------------------------------------------------
  // filterClauseToWhere
  // --------------------------------------------------

  describe("filterClauseToWhere", () => {
    it("converts a title filter into a Prisma where clause", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "title",
        operator: "contains",
        value: "Geology",
      });

      expect(result).toEqual({
        title: {
          contains: "Geology",
          mode: "insensitive",
        },
      });
    });

    it("maps author to the originator database column", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "author",
        operator: "contains",
        value: "Smith",
      });

      expect(result).toEqual({
        originator: {
          contains: "Smith",
          mode: "insensitive",
        },
      });
    });

    it("converts map_scale to a numeric database value", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "map_scale",
        operator: "eq",
        value: "2000000",
      });

      expect(result).toEqual({
        scale: 2000000,
      });
    });

    it("converts publication_key to a numeric value", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "publication_key",
        operator: "eq",
        value: "12345",
      });

      expect(result).toEqual({
        publication_key: 12345,
      });
    });

    it("rejects unsupported map_scale operators", () => {
      expect(() =>
        PublicationServicePrivate.filterClauseToWhere({
          field: "map_scale",
          operator: "contains",
          value: "2000000",
        }),
      ).toThrow(UserInputError);
    });

    it("creates OR conditions across keyword columns", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "keyword",
        operator: "contains",
        value: "copper",
      });

      expect(result).toHaveProperty("OR");
      expect((result as any).OR).toHaveLength(10);

      expect((result as any).OR).toContainEqual({
        theme_keyword_1: {
          contains: "copper",
          mode: "insensitive",
        },
      });

      expect((result as any).OR).toContainEqual({
        place_keyword_5: {
          contains: "copper",
          mode: "insensitive",
        },
      });
    });

    it("creates an OR search across text fields for any", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "any",
        operator: "contains",
        value: "Geology",
      });

      expect(result).toHaveProperty("OR");

      // Eight text fields; non-numeric input adds no numeric clauses.
      expect((result as any).OR).toHaveLength(8);
    });

    it("includes numeric fields in any search for numeric input", () => {
      const result = PublicationServicePrivate.filterClauseToWhere({
        field: "any",
        operator: "contains",
        value: "2000000",
      });

      expect((result as any).OR).toHaveLength(10);

      expect((result as any).OR).toContainEqual({
        scale: 2000000,
      });

      expect((result as any).OR).toContainEqual({
        publication_key: 2000000,
      });
    });

    it("rejects unsupported operators for any", () => {
      expect(() =>
        PublicationServicePrivate.filterClauseToWhere({
          field: "any",
          operator: "eq",
          value: "Geology",
        }),
      ).toThrow("unsupported operator for 'any'");
    });
  });

  // --------------------------------------------------
  // sortToOrderBy
  // --------------------------------------------------

  describe("sortToOrderBy", () => {
    it("converts a single sort object", () => {
      expect(
        PublicationServicePrivate.sortToOrderBy({
          field: "title",
          direction: "asc",
        }),
      ).toEqual({
        title: "asc",
      });
    });

    it("maps author sorting to originator", () => {
      expect(
        PublicationServicePrivate.sortToOrderBy({
          field: "author",
          direction: "desc",
        }),
      ).toEqual({
        originator: "desc",
      });
    });

    it("converts an array of sort objects", () => {
      expect(
        PublicationServicePrivate.sortToOrderBy([
          { field: "title", direction: "asc" },
          { field: "publication_year", direction: "desc" },
        ]),
      ).toEqual([{ title: "asc" }, { publication_year: "desc" }]);
    });

    it("rejects an unsupported sort field", () => {
      expect(() =>
        PublicationServicePrivate.sortToOrderBy({
          field: "unsupported" as any,
          direction: "asc",
        }),
      ).toThrow(UserInputError);
    });
  });

  // --------------------------------------------------
  // getPublicationGeometry
  // --------------------------------------------------

  describe("getPublicationGeometry", () => {
    it("returns parsed GeoJSON geometry", async () => {
      const geometry = {
        type: "Point",
        coordinates: [-123.1, 49.2],
      };

      vi.spyOn(prisma, "$queryRaw").mockResolvedValue([
        {
          geometry_json: JSON.stringify(geometry),
        },
      ]);

      const result = await PublicationServicePrivate.getPublicationGeometry(
        "11111111-1111-1111-1111-111111111111",
      );

      expect(result).toEqual(geometry);
    });

    it("returns null when the database geometry is null", async () => {
      vi.spyOn(prisma, "$queryRaw").mockResolvedValue([
        {
          geometry_json: null,
        },
      ]);

      const result = await PublicationServicePrivate.getPublicationGeometry(
        "11111111-1111-1111-1111-111111111111",
      );

      expect(result).toBeNull();
    });

    it("returns null when no database row is found", async () => {
      vi.spyOn(prisma, "$queryRaw").mockResolvedValue([]);

      const result = await PublicationServicePrivate.getPublicationGeometry(
        "11111111-1111-1111-1111-111111111111",
      );

      expect(result).toBeNull();
    });

    it("propagates database errors", async () => {
      vi.spyOn(prisma, "$queryRaw").mockRejectedValue(
        new Error("Database unavailable"),
      );

      await expect(
        PublicationServicePrivate.getPublicationGeometry(
          "11111111-1111-1111-1111-111111111111",
        ),
      ).rejects.toThrow("Database unavailable");
    });

    it("propagates invalid GeoJSON parsing errors", async () => {
      vi.spyOn(prisma, "$queryRaw").mockResolvedValue([
        {
          geometry_json: "invalid json",
        },
      ]);

      await expect(
        PublicationServicePrivate.getPublicationGeometry(
          "11111111-1111-1111-1111-111111111111",
        ),
      ).rejects.toThrow();
    });
  });
});
