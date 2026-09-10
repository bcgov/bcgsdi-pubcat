import { z } from 'zod'

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
  | 'isNotNull'

/** Scalar value used in a filter clause. */
export type FilterValue = string | number | boolean | Date | null

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
  field: TField
  operator: FilterOperator
  /**
   * Value to compare against.
   * - For `in` / `notIn` operators, supply an array of scalars.
   * - For `isNull` / `isNotNull` operators, this field is ignored.
   */
  value?: FilterValue | FilterValue[]
}

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
 *     { field: 'created_time', operator: 'gte',       value: new Date('2024-01-01') },
 *   ],
 * }
 * ```
 */
export type SearchFilter<TField extends string = string> =
  | FilterClause<TField>
  | { and: SearchFilter<TField>[] }
  | { or: SearchFilter<TField>[] }

/** Sort direction for search results. */
export type SortDirection = 'asc' | 'desc'

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
  field: TField
  direction: SortDirection
}

// ---------------------------------------------------------------------------
// Zod schemas (generic, not bound to any specific entity)
// ---------------------------------------------------------------------------

/** Validates any {@link FilterOperator} string. */
export const filterOperatorSchema = z.enum([
  'eq',
  'neq',
  'lt',
  'lte',
  'gt',
  'gte',
  'contains',
  'startsWith',
  'endsWith',
  'in',
  'notIn',
  'isNull',
  'isNotNull',
])

/** Validates a scalar {@link FilterValue}. */
export const filterValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

/** Validates a {@link SortDirection} string. */
export const sortDirectionSchema = z.enum(['asc', 'desc'])
