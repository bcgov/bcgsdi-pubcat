import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  FilterClause,
  FilterOperator,
  FilterValue,
  PublicationFilter,
  PublicationFilterableField,
  PublicationFilterClause,
} from '../../types/search';
import { SearchFilterUtils } from '../../utils/search-filter-utils';

@Component({
  selector: 'pubcat-search-filter-summary',
  standalone: true,
  imports: [SearchFilterSummary, MatButtonModule],
  styleUrl: './search-filter-summary.css',
  templateUrl: './search-filter-summary.html',
})
export class SearchFilterSummary {
  readonly filter = input<PublicationFilter | PublicationFilterClause[] | undefined>();
  readonly isRoot = input<boolean>(true);

  protected get normalizedFilter(): PublicationFilter | undefined {
    const n = SearchFilterUtils.normalize(this.filter());
    return n;
  }

  protected isClause(filter: PublicationFilter): filter is PublicationFilterClause {
    return 'field' in filter;
  }

  protected isAnd(filter: PublicationFilter): filter is { and: PublicationFilter[] } {
    return 'and' in filter;
  }

  protected isOr(filter: PublicationFilter): filter is { or: PublicationFilter[] } {
    return 'or' in filter;
  }

  readonly isEmptyFilter = computed<boolean>(() => {
    return SearchFilterUtils.normalize(this.filter()) === undefined;
  });

  protected fieldLabel(field: PublicationFilterableField): string {
    const labels: Partial<Record<PublicationFilterableField, string>> = {
      publication_key: 'Publication ID',
      issue_id: 'Issue ID',
      title: 'Title',
      author: 'Author',
      map_scale: 'Map scale',
      nts_map: 'NTS map',
      publication_year: 'Year',
      abstract: 'Abstract',
      keyword: 'Keyword',
      series: 'Series',
      any: 'Any field',
    };

    return labels[field] ?? field;
  }

  protected operatorLabel(operator: FilterOperator): string {
    const labels: Record<FilterOperator, string> = {
      eq: 'is',
      neq: 'is not',
      contains: 'contains',
      startsWith: 'starts with',
      endsWith: 'ends with',
      gt: 'is greater than',
      gte: 'is greater than or equal to',
      lt: 'is less than',
      lte: 'is less than or equal to',
      in: 'is one of',
      notIn: 'is not one of',
      isNull: 'is empty',
      isNotNull: 'is not empty',
    };

    return labels[operator];
  }

  protected formatValue(value: FilterClause['value']): string {
    if (Array.isArray(value)) {
      return value.map((v) => this.formatScalar(v)).join(', ');
    }

    return this.formatScalar(value);
  }

  private valuesEqual(a: FilterClause['value'], b: FilterClause['value']): boolean {
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
      }

      return a.length === b.length && a.every((value, index) => value === b[index]);
    }

    return a === b;
  }

  private formatScalar(value: FilterValue | undefined): string {
    if (value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return `"${value}"`;
    }

    return String(value);
  }
}
