import { prisma } from "../core/prisma.js";
import { CodeTableEntry } from "../types/reference.js";

/**
 * Reference service.
 *
 * Handles all database queries for "code table" (reference data) lookups.
 * Each method returns the full list of entries from the corresponding
 * `*_cd` table, projected to `{ code, title, description }`.
 */
export const ReferenceService = {
  async getPublicationSeries(): Promise<CodeTableEntry[]> {
    // Get publication series list as distinct values from publication.series_name
    const result = await prisma.publication.findMany({
      select: { series_name: true },
      distinct: ["series_name"],
      orderBy: { series_name: "asc" },
    });
    // Transform into the CodeTableEntry shape
    return result
      .filter((r) => !!r?.series_name)
      .map((r) => {
        return {
          code: r.series_name!,
          title: r.series_name!,
          description: null,
        };
      });
  },
};
