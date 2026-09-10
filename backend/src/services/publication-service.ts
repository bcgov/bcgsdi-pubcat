import { prisma } from "../core/prisma.js";

import { Geometry } from "geojson";
import { PublicationAdapter } from "../adapters/publication-adapter.js";
import {
  ApiPublication,
  PublicationFilter,
  PublicationFilterClause,
  PublicationSort,
} from "../types/publication.js";
import { SearchHelperService } from "./search-helper-service.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any;

const auditColumnDefaults = {
  created_time: new Date(),
  updated_time: new Date(),
  created_by_db: "",
  updated_by_db: "",
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

  /**
   * Converts a single {@link PublicationFilterClause} into a Prisma `where` fragment.
   */
  filterClauseToQuery(
    clause: PublicationFilterClause,
  ): Record<string, unknown> {
    const { field, operator, value } = clause;

    //
    if (field === "linked_to_submission") {
      return {
        publication_version_submission_track_event: {
          some: {},
        },
      };
    }

    return { [field]: SearchHelperService.operatorToPrisma(operator, value) };
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
      FROM publication_flattened
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
    const where = SearchHelperService.searchFilterToQuery(
      filter,
      (clause: PublicationFilterClause) =>
        PublicationServicePrivate.filterClauseToQuery(clause),
    );

    const query = {
      where: where,

      orderBy: {
        [sort.field]: sort.direction,
      },

      skip: offset,
      take: limit,
    };

    const publications_flattened =
      await prisma.publication_flattened.findMany(query);

    return publications_flattened.map(PublicationAdapter.toApi);
  },

  async getPublication(
    publicationGuid: string,
    tx?: TransactionClient,
  ): Promise<ApiPublication | null> {
    // TODO: refactor this to the "doWork" format for dealing with cases with and without a given tx param.
    // The 'db' approach used here was only suitable when there was just a single database statement in this method, but
    // now we've added a call to getPublicationVersionGeometry(..., db)
    const db = tx ?? prisma;

    const publicationFlattened = await db.publication_flattened.findUnique({
      where: {
        publication_guid: publicationGuid,
      },
    });

    const apiPublication: ApiPublication | null = publicationFlattened
      ? PublicationAdapter.toApi(publicationFlattened)
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
