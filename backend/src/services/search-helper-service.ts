import type {
  FilterClause,
  FilterOperator,
  FilterValue,
  SearchFilter,
} from "../types/search.js";

/**
 * Provides helper functions provide common functionality intended to be used to implement
 * various specific kinds of searches.
 */

export const SearchHelperService: any = {
  /**
   * Converts a {@link FilterOperator} and its value into a Prisma filter
   * expression (the right-hand side of a Prisma `where` field).
   */
  operatorToPrisma(
    operator: FilterOperator,
    value: FilterValue | FilterValue[] | undefined,
    coerceValueTo: "number" | undefined = undefined,
  ): unknown {
    let cleanedValue = value;
    if (coerceValueTo == "number") {
      cleanedValue = Number(value);
      if (Number.isNaN(cleanedValue)) {
        throw new Error("Cannot coerse value into a number");
      }
    }

    switch (operator) {
      case "eq":
        return cleanedValue ?? null;

      case "neq":
        return { not: cleanedValue ?? null };

      case "lt":
        return { lt: cleanedValue };

      case "lte":
        return { lte: cleanedValue };

      case "gt":
        return { gt: cleanedValue };

      case "gte":
        return { gte: cleanedValue };

      case "contains":
        return { contains: cleanedValue, mode: "insensitive" };

      case "startsWith":
        return { startsWith: cleanedValue };

      case "endsWith":
        return { endsWith: cleanedValue };

      case "in":
        return {
          in: Array.isArray(cleanedValue) ? cleanedValue : [cleanedValue],
        };

      case "notIn":
        return {
          notIn: Array.isArray(cleanedValue) ? cleanedValue : [cleanedValue],
        };

      case "isNull":
        return null;

      case "isNotNull":
        return { not: null };

      default:
        throw new Error(`Unsupported filter operator: ${operator as string}`);
    }
  },

  /**
   * Default clause converter: maps a filter clause directly to a Prisma field condition
   * using the clause's field name as the key. Suitable for entities whose filterable
   * fields map one-to-one to top-level Prisma model columns (no joins required).
   */
  defaultClauseFn<TField extends string>(
    clause: FilterClause<TField>,
  ): Record<string, unknown> {
    return {
      [clause.field]: SearchHelperService.operatorToPrisma(
        clause.operator,
        clause.value,
      ),
    };
  },

  /**
   * Converts a {@link SearchFilter} (or an array of {@link FilterClause} objects
   * that are AND-ed together) into a Prisma `where` input object.
   *
   * @param filter   The filter tree or flat clause array to convert.
   * @param clauseFn Entity-specific converter that turns a single {@link FilterClause}
   *                 into a Prisma `where` fragment. Defaults to {@link defaultClauseFn}
   *                 (direct field mapping). Override when a field requires special
   *                 handling (e.g. join-based filters like `author_guid`).
   */
  searchFilterToWhere<TField extends string>(
    filter: SearchFilter<TField> | FilterClause<TField>[],
    clauseFn: (
      clause: FilterClause<TField>,
    ) => Record<string, unknown> = SearchHelperService.defaultClauseFn,
  ): Record<string, unknown> {
    if (Array.isArray(filter)) {
      if (filter.length === 0) return {};
      if (filter.length === 1) return clauseFn(filter[0]);
      return { AND: filter.map(clauseFn) };
    }

    if ("and" in filter) {
      return {
        AND: filter.and.map((f) =>
          SearchHelperService.searchFilterToWhere(f, clauseFn),
        ),
      };
    }

    if ("or" in filter) {
      return {
        OR: filter.or.map((f) =>
          SearchHelperService.searchFilterToWhere(f, clauseFn),
        ),
      };
    }

    return clauseFn(filter);
  },
};
