import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FilterClause, FilterOperator, PublicationFilter } from '../../types/search';
import { SearchFilterSummary } from './search-filter-summary';

describe('SearchFilterSummary', () => {
  let component: SearchFilterSummary;
  let fixture: ComponentFixture<SearchFilterSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFilterSummary],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFilterSummary);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('isEmptyFilter', () => {
    it('should be true when the filter is undefined', () => {
      fixture.componentRef.setInput('filter', undefined);

      expect(component.isEmptyFilter()).toBe(true);
    });

    it('should be true when the filter is an empty array', () => {
      fixture.componentRef.setInput('filter', []);

      expect(component.isEmptyFilter()).toBe(true);
    });

    it('should be false when the filter is a clause', () => {
      const filter: PublicationFilter = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component.isEmptyFilter()).toBe(false);
    });

    it('should be false when the filter is an and group', () => {
      const filter: PublicationFilter = {
        and: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Geology',
          },
        ],
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component.isEmptyFilter()).toBe(false);
    });
  });

  describe('normalizedFilter', () => {
    it('should be undefined when there is no filter', () => {
      fixture.componentRef.setInput('filter', undefined);

      expect(component['normalizedFilter']).toBeUndefined();
    });

    it('should normalize a filter clause', () => {
      const filter: PublicationFilter = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component['normalizedFilter']).toEqual(filter);
    });

    it('should normalize an array of clauses into an and group', () => {
      const filter: FilterClause[] = [
        {
          field: 'title',
          operator: 'contains',
          value: 'Geology',
        },
        {
          field: 'author',
          operator: 'contains',
          value: 'Smith',
        },
      ];

      fixture.componentRef.setInput('filter', filter);

      expect(component['normalizedFilter']).toEqual({
        and: filter,
      });
    });

    it('should collapse a single-item and group', () => {
      const filter: PublicationFilter = {
        and: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Geology',
          },
        ],
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component['normalizedFilter']).toEqual({
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      });
    });

    it('should collapse a single-item or group', () => {
      const filter: PublicationFilter = {
        or: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Geology',
          },
        ],
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component['normalizedFilter']).toEqual({
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      });
    });
  });

  describe('fieldLabel', () => {
    it('should return the display label for title', () => {
      expect(component['fieldLabel']('title')).toBe('Title');
    });

    it('should return the display label for author', () => {
      expect(component['fieldLabel']('author')).toBe('Author');
    });

    it('should return the display label for map scale', () => {
      expect(component['fieldLabel']('map_scale')).toBe('Map scale');
    });

    it('should return the display label for any', () => {
      expect(component['fieldLabel']('any')).toBe('Any field');
    });

    it('should return the field name when there is no custom label', () => {
      expect(component['fieldLabel']('abstract')).toBe('Abstract');
    });
  });

  describe('operatorLabel', () => {
    const operatorLabels: Record<FilterOperator, string> = {
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

    for (const operator of Object.keys(operatorLabels) as FilterOperator[]) {
      it(`should return "${operatorLabels[operator]}" for ${operator}`, () => {
        expect(component['operatorLabel'](operator)).toBe(operatorLabels[operator]);
      });
    }
  });

  describe('formatValue', () => {
    it('should quote a string', () => {
      expect(component['formatValue']('Geology')).toBe('"Geology"');
    });

    it('should format a number', () => {
      expect(component['formatValue'](2000000)).toBe('2000000');
    });

    it('should format true', () => {
      expect(component['formatValue'](true)).toBe('true');
    });

    it('should format false', () => {
      expect(component['formatValue'](false)).toBe('false');
    });

    it('should format null', () => {
      expect(component['formatValue'](null)).toBe('null');
    });

    it('should format undefined as an empty string', () => {
      expect(component['formatValue'](undefined)).toBe('');
    });

    it('should format an array of strings', () => {
      expect(component['formatValue'](['Geology', 'Mineralogy'])).toBe('"Geology", "Mineralogy"');
    });

    it('should format an array of numbers', () => {
      expect(component['formatValue']([1000000, 2000000])).toBe('1000000, 2000000');
    });

    it('should format a mixed array', () => {
      expect(component['formatValue'](['Geology', 2000000, true])).toBe('"Geology", 2000000, true');
    });

    it('should format an empty array', () => {
      expect(component['formatValue']([])).toBe('');
    });
  });

  describe('filter input', () => {
    it('should accept a single filter clause', () => {
      const filter: PublicationFilter = {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component.filter()).toEqual(filter);
    });

    it('should accept an array of filter clauses', () => {
      const filter: FilterClause[] = [
        {
          field: 'title',
          operator: 'contains',
          value: 'Geology',
        },
        {
          field: 'author',
          operator: 'contains',
          value: 'Smith',
        },
      ];

      fixture.componentRef.setInput('filter', filter);

      expect(component.filter()).toEqual(filter);
    });

    it('should accept a nested filter', () => {
      const filter: PublicationFilter = {
        or: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Geology',
          },
          {
            field: 'abstract',
            operator: 'contains',
            value: 'Geology',
          },
        ],
      };

      fixture.componentRef.setInput('filter', filter);

      expect(component.filter()).toEqual(filter);
    });
  });

  describe('other inputs', () => {
    it('should default isRoot to true', () => {
      expect(component.isRoot()).toBe(true);
    });

    it('should allow isRoot to be set to false', () => {
      fixture.componentRef.setInput('isRoot', false);

      expect(component.isRoot()).toBe(false);
    });
  });
});
