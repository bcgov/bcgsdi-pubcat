import { PublicationFilter, PublicationFilterClause } from '../types/search';

export class SearchFilterUtils {
  public static normalize(
    filter: PublicationFilter | PublicationFilterClause[] | undefined,
  ): PublicationFilter | undefined {
    if (filter === undefined) {
      return undefined;
    }

    // An array represents an explicit AND group.
    if (Array.isArray(filter)) {
      if (filter.length === 0) {
        return undefined;
      }

      return this.normalizeGroup('and', filter);
    }

    return this.normalizeNode(filter);
  }

  /* Prerequisites: the filter must be normalized */
  public static compact(
    filter: PublicationFilter | undefined,
  ): PublicationFilter | PublicationFilterClause[] | undefined {
    if (filter === undefined) {
      return undefined;
    }

    if ('field' in filter) {
      return filter;
    }

    if ('and' in filter) {
      return this.compactAnd(filter.and);
    }

    if ('or' in filter) {
      return {
        or: filter.or.map((node) => this.compactNode(node)),
      };
    }

    return undefined;
  }

  private static compactNode(filter: PublicationFilter): PublicationFilter {
    if ('field' in filter) {
      return filter;
    }

    if ('and' in filter) {
      return {
        and: filter.and.map((node) => this.compactNode(node)),
      };
    }

    if ('or' in filter) {
      return {
        or: filter.or.map((node) => this.compactNode(node)),
      };
    }

    return filter;
  }

  private static compactAnd(
    filters: PublicationFilter[],
  ): PublicationFilter | PublicationFilterClause[] {
    const compacted = filters.map((filter) => this.compactNode(filter));

    // If every child is a clause, the AND can be represented
    // using the compact PublicationFilterClause[] form.
    if (compacted.every((filter) => 'field' in filter)) {
      return compacted as PublicationFilterClause[];
    }

    return {
      and: compacted,
    };
  }

  private static normalizeNode(filter: PublicationFilter): PublicationFilter | undefined {
    if ('field' in filter) {
      return filter;
    }

    if ('and' in filter) {
      return this.normalizeGroup('and', filter.and);
    }

    if ('or' in filter) {
      return this.normalizeGroup('or', filter.or);
    }

    return undefined;
  }

  private static normalizeGroup(
    operator: 'and' | 'or',
    filters: PublicationFilter[],
  ): PublicationFilter | undefined {
    const normalized = filters
      .map((filter) => this.normalizeNode(filter))
      .filter((filter): filter is PublicationFilter => filter !== undefined);

    // An empty group is equivalent to no filter.
    if (normalized.length === 0) {
      return undefined;
    }

    // A single-element group is unnecessary.
    if (normalized.length === 1) {
      return normalized[0];
    }

    return {
      [operator]: normalized,
    } as PublicationFilter;
  }
}
