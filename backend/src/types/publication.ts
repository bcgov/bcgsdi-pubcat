import { z } from "zod";
import { publication } from "../generated/prisma/client.js";
import type { FilterClause, SearchFilter } from "./search.js";
import {
  filterOperatorSchema,
  filterValueSchema,
  sortDirectionSchema,
} from "./search.js";

// ---------------------------------------------------------------------------
// Service layer types
// ---------------------------------------------------------------------------

export type ApiPublication = publication & {
  geometry: any;
};

// ---------------------------------------------------------------------------
// Search filter types
// ---------------------------------------------------------------------------

// Zod schema is the single source of truth; the TypeScript type is derived from it.
export const publicationFilterableFieldSchema = z.enum([
  "publication_guid",
  "parent_publication_guid",
  "publication_type",
  "publisher_name",
  "distributor_name",
  "title",
  "editor",
  "publication_place",
  "publication_date",
  "updated_time",
  "expiry_time",
  "publication_id",
  //pseudo fields to provide additional filtering options
  "linked_to_submission",
]);

export type PublicationFilterableField = z.infer<
  typeof publicationFilterableFieldSchema
>;

export type PublicationFilterClause = FilterClause<PublicationFilterableField>;

export type PublicationFilter = SearchFilter<PublicationFilterableField>;

// ---------------------------------------------------------------------------
// Sort types
// ---------------------------------------------------------------------------

export const publicationSortFieldSchema = z.enum([
  "title",
  "publication_date",
  "publication_type",
  "publisher_name",
  "updated_time",
]);

export type PublicationSortField = z.infer<typeof publicationSortFieldSchema>;

export const publicationSortSchema = z.object({
  field: publicationSortFieldSchema,
  direction: sortDirectionSchema,
});

export type PublicationSort = z.infer<typeof publicationSortSchema>;

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const publicationFilterClauseSchema = z.object({
  field: publicationFilterableFieldSchema,
  operator: filterOperatorSchema,
  value: z.union([filterValueSchema, z.array(filterValueSchema)]).optional(),
});

type PublicationFilterInput =
  | z.infer<typeof publicationFilterClauseSchema>
  | { and: PublicationFilterInput[] }
  | { or: PublicationFilterInput[] };

export const publicationFilterSchema: z.ZodType<PublicationFilterInput> =
  z.lazy(() =>
    z.union([
      publicationFilterClauseSchema,
      z.object({ and: z.array(publicationFilterSchema) }),
      z.object({ or: z.array(publicationFilterSchema) }),
    ]),
  );

export const publicationSearchBodySchema = z.object({
  filter: z
    .union([publicationFilterSchema, z.array(publicationFilterClauseSchema)])
    .optional(),
  sort: publicationSortSchema.optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
});
