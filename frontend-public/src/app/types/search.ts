/**
 * Comparison operators available in a {@link FilterClause}.
 *
 * | Operator       | Meaning                                            |
 * |----------------|----------------------------------------------------|
 * | `eq`           | Equal to                                           |
 * | `neq`          | Not equal to                                       |
 * | `lt`           | Less than                                          |
 * | `lte`          | Less than or equal to                              |
 * | `gt`           | Greater than                                       |
 * | `gte`          | Greater than or equal to                           |
 * | `contains`     | Substring match (case-insensitive)                 |
 * | `startsWith`   | Prefix match                                       |
 * | `endsWith`     | Suffix match                                       |
 * | `in`           | Value is one of an array                           |
 * | `notIn`        | Value is none of an array                          |
 * | `isNull`       | Field is null (`value` is ignored)                 |
 * | `isNotNull`    | Field is not null (`value` is ignored)             |
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

/** Scalar value used in a filter clause. */
export type FilterValue = string | number | boolean | null;

/**
 * A single filter predicate: `field operator value`.
 *
 * The `TField` type parameter constrains which field names are valid, allowing
 * each entity to define its own set of filterable attributes.
 *
 * @example
 * ```ts
 * // submissions with study_start_year >= 2020
 * { field: 'study_start_year', operator: 'gte', value: 2020 }
 *
 * // records where a nullable field is set
 * { field: 'geometry_descriptor', operator: 'isNotNull' }
 * ```
 */
export type FilterClause<TField extends string = string> = {
  field: TField;
  operator: FilterOperator;
  /**
   * Value to compare against.
   * - For `in` / `notIn` operators, supply an array of scalars.
   * - For `isNull` / `isNotNull` operators, this field is ignored.
   */
  value?: FilterValue | FilterValue[];
};

/**
 * Composable search filter, generic over the set of filterable field names.
 *
 * - A bare {@link FilterClause} is applied directly.
 * - `{ and: [...] }` requires **all** nested filters to match (logical AND).
 * - `{ or: [...] }` requires **at least one** nested filter to match (logical OR).
 * - Passing an array of {@link FilterClause} to a search function ANDs them all.
 *
 * @example
 * ```ts
 * const filter: SearchFilter<'name' | 'created_time'> = {
 *   and: [
 *     { field: 'name',         operator: 'contains',  value: 'glacier' },
 *     { field: 'created_time', operator: 'gte',       value: '2024-01-01' },
 *   ],
 * }
 * ```
 */
export type SearchFilter<TField extends string = string> =
  FilterClause<TField> | { and: SearchFilter<TField>[] } | { or: SearchFilter<TField>[] };

/** Sort direction for search results. */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification for search results, generic over the set of sortable
 * field names.
 *
 * @example
 * ```ts
 * const sort: SearchSort<'created_time' | 'name'> = { field: 'created_time', direction: 'desc' }
 * ```
 */
export type SearchSort<TField extends string = string> = {
  field: TField;
  direction: SortDirection;
};

// ---------------------------------------------------------------------------
// Paging
//
// The backend /submissions/search endpoint uses offset/limit pagination.
// The caller supplies:
//   - `offset` – number of records to skip (default: 0)
//   - `limit`  – maximum records to return per page (default: 20)
//
// Recommended frontend paging strategy:
//   1. Track `currentPage` (0-based) and a chosen `pageSize` (e.g. 20).
//   2. Derive `offset = currentPage * pageSize` before each request.
//   3. After a response arrives, check whether `results.length < pageSize`;
//      if so, there are no further pages (no separate totalCount call needed).
//   4. Expose "Previous" / "Next" controls bound to `currentPage`.
// ---------------------------------------------------------------------------

/**
 * Pagination parameters accepted by the backend search endpoint.
 *
 * Both fields are optional; the backend defaults to `offset=0, limit=20`.
 */
export type PageParams = {
  /** Number of records to skip. Defaults to `0`. */
  offset?: number;
  /** Maximum number of records to return. Defaults to `20`. */
  limit?: number;
};

// ---------------------------------------------------------------------------
// Publication-specific filter and sort types
// ---------------------------------------------------------------------------

export type PublicationFilterableField =
  | 'publication_guid'
  | 'publication_id'
  | 'title'
  | 'abstract'
  | 'year'
  | 'author'
  | 'ntsMap'
  | 'mapScale'
  | 'series'
  | 'keyword'
  | 'publicationId'
  | 'issueId';

export type PublicationFilterClause = FilterClause<PublicationFilterableField>;

export type PublicationFilter = SearchFilter<PublicationFilterableField>;

export type PublicationSortField =
  | 'publication_guid'
  | 'publication_id'
  | 'title'
  | 'abstract'
  | 'year'
  | 'series'
  | 'publicationId'
  | 'issueId';

export type PublicationSort = SearchSort<PublicationSortField>;

export type PublicationSearchParams = {
  filter?: PublicationFilter | PublicationFilterClause[];
  sort?: PublicationSort | PublicationSort[];
  offset?: number;
  limit?: number;
};
