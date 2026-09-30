import { describe, expect, it } from 'vitest';

import { PublicationFilter, PublicationFilterClause } from '../types/search';
import { SearchFilterUtils } from './search-filter-utils';

describe('SearchFilterUtils', () => {
  describe('normalize()', () => {
    it('returns undefined when the filter is undefined', () => {
      expect(SearchFilterUtils.normalize(undefined)).toBeUndefined();
    });

    it('returns undefined for an empty array', () => {
      expect(SearchFilterUtils.normalize([])).toBeUndefined();
    });

    it('preserves a single clause', () => {
      const clause: PublicationFilterClause = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      expect(SearchFilterUtils.normalize(clause)).toEqual(clause);
    });

    it('converts an array of clauses into an AND group', () => {
      const clauses: PublicationFilterClause[] = [
        { field: 'title', operator: 'contains', value: 'Geology' },
        { field: 'publication_year', operator: 'gte', value: 2020 },
      ];

      expect(SearchFilterUtils.normalize(clauses)).toEqual({
        and: clauses,
      });
    });

    it('collapses an AND group containing one clause', () => {
      const clause: PublicationFilterClause = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      const filter: PublicationFilter = {
        and: [clause],
      };

      expect(SearchFilterUtils.normalize(filter)).toEqual(clause);
    });

    it('collapses an OR group containing one clause', () => {
      const clause: PublicationFilterClause = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      const filter: PublicationFilter = {
        or: [clause],
      };

      expect(SearchFilterUtils.normalize(filter)).toEqual(clause);
    });

    it('preserves an AND group containing multiple clauses', () => {
      const clauses: PublicationFilterClause[] = [
        { field: 'title', operator: 'contains', value: 'Geology' },
        { field: 'publication_year', operator: 'gte', value: 2020 },
      ];

      expect(SearchFilterUtils.normalize({ and: clauses })).toEqual({
        and: clauses,
      });
    });

    it('preserves an OR group containing multiple clauses', () => {
      const clauses: PublicationFilterClause[] = [
        { field: 'title', operator: 'contains', value: 'Geology' },
        { field: 'abstract', operator: 'contains', value: 'Geology' },
      ];

      expect(SearchFilterUtils.normalize({ or: clauses })).toEqual({
        or: clauses,
      });
    });

    it('recursively normalizes nested groups', () => {
      const filter: PublicationFilter = {
        and: [
          {
            or: [
              { field: 'title', operator: 'contains', value: 'Geology' },
              { field: 'abstract', operator: 'contains', value: 'Geology' },
            ],
          },
          {
            and: [
              {
                field: 'publication_year',
                operator: 'gte',
                value: 2020,
              },
            ],
          },
        ],
      };

      expect(SearchFilterUtils.normalize(filter)).toEqual({
        and: [
          {
            or: [
              { field: 'title', operator: 'contains', value: 'Geology' },
              { field: 'abstract', operator: 'contains', value: 'Geology' },
            ],
          },
          {
            field: 'publication_year',
            operator: 'gte',
            value: 2020,
          },
        ],
      });
    });

    it('returns undefined for an empty AND group', () => {
      expect(SearchFilterUtils.normalize({ and: [] })).toBeUndefined();
    });

    it('returns undefined for an empty OR group', () => {
      expect(SearchFilterUtils.normalize({ or: [] })).toBeUndefined();
    });

    it('removes empty nested groups during normalization', () => {
      const clause: PublicationFilterClause = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      const filter: PublicationFilter = {
        and: [clause, { or: [] }],
      };

      expect(SearchFilterUtils.normalize(filter)).toEqual(clause);
    });

    it('does not mutate the original filter', () => {
      const filter: PublicationFilter = {
        and: [
          { field: 'title', operator: 'contains', value: 'Geology' },
          { field: 'abstract', operator: 'contains', value: 'Geology' },
        ],
      };

      const original = structuredClone(filter);

      SearchFilterUtils.normalize(filter);

      expect(filter).toEqual(original);
    });
  });

  describe('compact()', () => {
    it('returns undefined when the filter is undefined', () => {
      expect(SearchFilterUtils.compact(undefined)).toBeUndefined();
    });

    it('returns a standalone clause unchanged', () => {
      const clause: PublicationFilterClause = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      expect(SearchFilterUtils.compact(clause)).toEqual(clause);
    });

    it('converts an AND group of clauses into an array', () => {
      const clauses: PublicationFilterClause[] = [
        { field: 'title', operator: 'contains', value: 'Geology' },
        { field: 'publication_year', operator: 'gte', value: 2020 },
      ];

      const filter: PublicationFilter = {
        and: clauses,
      };

      expect(SearchFilterUtils.compact(filter)).toEqual(clauses);
    });

    it('preserves an OR group', () => {
      const filter: PublicationFilter = {
        or: [
          { field: 'title', operator: 'contains', value: 'Geology' },
          { field: 'abstract', operator: 'contains', value: 'Geology' },
        ],
      };

      expect(SearchFilterUtils.compact(filter)).toEqual(filter);
    });

    it('preserves nested logical groups', () => {
      const filter: PublicationFilter = {
        and: [
          { field: 'title', operator: 'contains', value: 'Geology' },
          {
            or: [
              { field: 'author', operator: 'contains', value: 'Smith' },
              { field: 'author', operator: 'contains', value: 'Jones' },
            ],
          },
        ],
      };

      expect(SearchFilterUtils.compact(filter)).toEqual(filter);
    });

    it('does not mutate the original filter', () => {
      const filter: PublicationFilter = {
        and: [
          { field: 'title', operator: 'contains', value: 'Geology' },
          { field: 'abstract', operator: 'contains', value: 'Geology' },
        ],
      };

      const original = structuredClone(filter);

      SearchFilterUtils.compact(filter);

      expect(filter).toEqual(original);
    });
  });

  describe('round-trip behavior', () => {
    it.each([
      {
        name: 'a single clause',
        filter: {
          field: 'title',
          operator: 'contains',
          value: 'Geology',
        } satisfies PublicationFilter,
      },
      {
        name: 'an AND group',
        filter: {
          and: [
            { field: 'title', operator: 'contains', value: 'Geology' },
            { field: 'publication_year', operator: 'gte', value: 2020 },
          ],
        } satisfies PublicationFilter,
      },
      {
        name: 'an OR group',
        filter: {
          or: [
            { field: 'title', operator: 'contains', value: 'Geology' },
            { field: 'abstract', operator: 'contains', value: 'Geology' },
          ],
        } satisfies PublicationFilter,
      },
      {
        name: 'nested AND/OR groups',
        filter: {
          and: [
            { field: 'title', operator: 'contains', value: 'Geology' },
            {
              or: [
                { field: 'author', operator: 'contains', value: 'Smith' },
                { field: 'author', operator: 'contains', value: 'Jones' },
              ],
            },
          ],
        } satisfies PublicationFilter,
      },
    ])('preserves $name through compact and normalize', ({ filter }) => {
      const normalized = SearchFilterUtils.normalize(filter);
      const compacted = SearchFilterUtils.compact(normalized);

      expect(SearchFilterUtils.normalize(compacted)).toEqual(normalized);
    });
  });
});
