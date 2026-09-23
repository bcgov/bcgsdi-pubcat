import { prisma } from "../core/prisma.js";

import { Geometry } from "geojson";
import { PublicationAdapter } from "../adapters/publication-adapter.js";
import { UserInputError } from "../types/error.js";
import {
  ApiPublication,
  PublicationFilter,
  PublicationFilterableField,
  PublicationFilterClause,
  PublicationSort,
  publicationSortFieldSchema,
} from "../types/publication.js";
import { SearchHelperService } from "./search-helper-service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any;

export const SEARCH_FIELD_TYPES = {
  scale: "number",
};

export const PublicationServicePrivate = {
  normalizeEmails(
    emails: Array<{
      publication_email_guid: string;
      email: string;
      is_primary: boolean;
    }>,
  ) {
    return [...emails]
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.email.localeCompare(b.email);
      })
      .map((email) => ({
        email: email.email,
        isPrimary: email.is_primary,
      }));
  },

  validateFieldSupportsOperators(
    field: PublicationFilterableField,
    operator: string,
  ) {
    //fields not listed here are assumed to support all operators
    const fieldOperatorMappings = {
      map_scale: ["eq"],
    } as any;
    if (Object.hasOwn(fieldOperatorMappings, field)) {
      if (
        fieldOperatorMappings[field].find((op: any) => op == operator) ==
        undefined
      ) {
        throw new UserInputError(
          `field '${field}' does not support operator '${operator}'`,
        );
      }
    }
  },

  searchFieldToDbCol(field: PublicationFilterableField): string | undefined {
    const oneToOneMappings = {
      publication_guid: "publication_guid",
      publication_key: "publication_key",
      title: "title",
      abstract: "abstract",
      publication_year: "publication_year",
      author: "originator",
      nts_map: "nts_maps",
      map_scale: "scale",
      series: "series_name",
      issue_id: "issue_identification",
      create_timestamp: "created_timestamp",
      update_timestamp: "update_timestamp",
    } as any;
    if (Object.hasOwn(oneToOneMappings, field)) {
      return oneToOneMappings[field];
    }
    return undefined;
  },

  /**
   * Converts a single {@link PublicationFilterClause} into a Prisma `where` fragment.
   */
  filterClauseToWhere(
    clause: PublicationFilterClause,
  ): Record<string, unknown> {
    const { field, operator, value } = clause;
    const numericColumns = ["scale", "publication_key"];

    // Check if the given field supports the given operator.
    this.validateFieldSupportsOperators(field, operator);

    // Check the normal case: where the filter field maps
    // to a single database column
    const dbCol = this.searchFieldToDbCol(field);
    if (dbCol) {
      // For filters applied to any db column that is numeric, coerce the values
      // into numbers
      const coerseValueTo = numericColumns.find((c) => c == dbCol)
        ? "number"
        : undefined;

      return {
        [dbCol]: SearchHelperService.operatorToPrisma(
          operator,
          value,
          coerseValueTo,
        ),
      };
    }

    // Special cases below...

    // If filtering by keyword, search against several different columns in the database
    if (field == "keyword") {
      const keywordDbCols = [
        "theme_keyword_1",
        "theme_keyword_2",
        "theme_keyword_3",
        "theme_keyword_4",
        "theme_keyword_5",
        "place_keyword_1",
        "place_keyword_2",
        "place_keyword_3",
        "place_keyword_4",
        "place_keyword_5",
      ];
      return {
        OR: keywordDbCols.map((keywordDbCol) => {
          return {
            [keywordDbCol]: SearchHelperService.operatorToPrisma(
              operator,
              value,
            ),
          };
        }),
      };
    }

    throw new UserInputError(`Unsupported filter field: ${field}`);
  },

  sortToOrderBy(sort: PublicationSort): any {
    if (Array.isArray(sort)) {
      return sort.map((s) => this.sortToOrderBy(s));
    } else {
      const parsedSort = publicationSortFieldSchema.safeParse(sort.field);
      if (!parsedSort.success) {
        throw new UserInputError("Unsupported sort");
      }
      return {
        [sort.field]: sort.direction,
      };
    }
  },

  async getPublicationGeometry(
    publicationGuid: string,
    tx?: TransactionClient,
  ): Promise<Geometry | null> {
    const db = tx ?? prisma;

    // Read geometry using raw SQL because the PostGIS geometry type is not
    // natively supported by Prisma (it appears as Unsupported("geometry") in
    // the schema and is excluded from generated query results).
    // Note: a second round-trip is necessary here because replacing the Prisma
    // findUnique (and all its nested includes) with a single raw SQL query would
    // be significantly more complex. Prisma's tagged-template $queryRaw passes
    // all interpolated values as bound parameters, so this is not susceptible
    // to SQL injection.
    const geometryRows = await db.$queryRaw<[{ geometry_json: string | null }]>`
      SELECT ST_AsGeoJSON(geometry)::text AS geometry_json
      FROM publication
      WHERE publication_guid = ${publicationGuid}::uuid
    `;
    // geometryRows may be empty if the row was deleted between the two queries
    // (a transient race condition). Treat missing geometry as null in that case.
    const geometryJson =
      geometryRows.length > 0 ? (geometryRows[0].geometry_json ?? null) : null;

    const geometry = geometryJson
      ? (JSON.parse(geometryJson) as Geometry)
      : null;
    return geometry;
  },
};

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export const PublicationService = {
  async searchPublications(
    filter: PublicationFilter | PublicationFilterClause[] = [],
    sort: PublicationSort = { field: "title", direction: "asc" },
    offset = 0,
    limit = 20,
  ) {
    try {
      const where = SearchHelperService.searchFilterToWhere(
        filter,
        (clause: PublicationFilterClause) =>
          PublicationServicePrivate.filterClauseToWhere(clause),
      );

      const orderBy = PublicationServicePrivate.sortToOrderBy(sort);

      const query = {
        where: where,
        orderBy: orderBy,
        skip: offset,
        take: limit,
      };

      const publication = await prisma.publication.findMany(query);

      return publication.map(PublicationAdapter.toApi);
    } catch (err) {
      throw err;
    }
  },

  async getPublication(
    publicationGuid: string,
    tx?: TransactionClient,
  ): Promise<ApiPublication | null> {
    // TODO: refactor this to the "doWork" format for dealing with cases with and without a given tx param.
    // The 'db' approach used here was only suitable when there was just a single database statement in this method, but
    // now we've added a call to getPublicationVersionGeometry(..., db)
    const db = tx ?? prisma;

    const publication = await db.publication.findUnique({
      where: {
        publication_guid: publicationGuid,
      },
    });

    const apiPublication: ApiPublication | null = publication
      ? PublicationAdapter.toApi(publication)
      : null;

    //inject the geometry into the current_publication_version
    if (apiPublication) {
      apiPublication.geometry =
        await PublicationServicePrivate.getPublicationGeometry(
          publicationGuid,
          db,
        );
    }

    return apiPublication;
  },
};
