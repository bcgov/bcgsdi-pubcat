import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { PublicationSearchStore } from '../../stores/publication-search-store';
import { PublicationFilter, PublicationSearchParams } from '../../types/search';
import { ResultsViewType, SearchResults } from './search-results';

describe('SearchResults', () => {
  let component: SearchResults;
  let fixture: ComponentFixture<SearchResults>;

  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let searchStore: {
    isLoading: ReturnType<typeof vi.fn>;
    results: ReturnType<typeof vi.fn>;
    pageSize: ReturnType<typeof vi.fn>;
    pageIndex: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
  };

  const geologyFilter = {
    and: [
      {
        field: 'title',
        operator: 'contains',
        value: 'Geology',
      },
      {
        field: 'publication_year',
        operator: 'eq',
        value: 2020,
      },
    ],
  } satisfies PublicationFilter;

  const initialSearchParams: PublicationSearchParams = {
    filter: geologyFilter,
    offset: 25,
    limit: 10,
  };

  beforeEach(async () => {
    queryParamMap$ = new BehaviorSubject(
      convertToParamMap({
        query: JSON.stringify(initialSearchParams),
        view: ResultsViewType.Table,
      }),
    );

    router = {
      navigate: vi.fn(),
    };

    searchStore = {
      isLoading: vi.fn().mockReturnValue(false),
      results: vi.fn().mockReturnValue([]),
      pageSize: vi.fn().mockReturnValue(25),
      pageIndex: vi.fn().mockReturnValue(0),
      reset: vi.fn(),
      search: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SearchResults],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: PublicationSearchStore,
          useValue: searchStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchResults);
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

  describe('route parameters', () => {
    it('should search using the query from the route', () => {
      expect(searchStore.search).toHaveBeenCalledWith(initialSearchParams);
    });

    it('should use table view when the route does not specify a view', () => {
      queryParamMap$.next(
        convertToParamMap({
          query: JSON.stringify(initialSearchParams),
        }),
      );

      expect(component.viewType()).toBe(ResultsViewType.Table);
    });

    it('should use the view specified by the route', () => {
      queryParamMap$.next(
        convertToParamMap({
          query: JSON.stringify(initialSearchParams),
          view: ResultsViewType.Abstract,
        }),
      );

      expect(component.viewType()).toBe(ResultsViewType.Abstract);
    });

    it('should react when the route query changes', () => {
      const updatedSearchParams: PublicationSearchParams = {
        filter: {
          field: 'title',
          operator: 'contains',
          value: 'Geology',
        },
        offset: 50,
        limit: 25,
      };

      queryParamMap$.next(
        convertToParamMap({
          query: JSON.stringify(updatedSearchParams),
          view: ResultsViewType.Table,
        }),
      );

      expect(searchStore.search).toHaveBeenLastCalledWith(updatedSearchParams);
    });

    it('should not search again when query and view have not changed', () => {
      searchStore.search.mockClear();

      const params = convertToParamMap({
        query: JSON.stringify(initialSearchParams),
        view: ResultsViewType.Table,
      });

      queryParamMap$.next(params);
      queryParamMap$.next(params);

      expect(searchStore.search).toHaveBeenCalledTimes(0);
    });
  });

  describe('search', () => {
    it('should add offset when it is missing', () => {
      component.search(
        JSON.stringify({
          filter: geologyFilter,
          limit: 10,
        }),
      );

      expect(searchStore.search).toHaveBeenLastCalledWith({
        filter: geologyFilter,
        offset: 0,
        limit: 10,
      });
    });

    it('should add limit when it is missing', () => {
      component.search(
        JSON.stringify({
          filter: geologyFilter,
          offset: 50,
        }),
      );

      expect(searchStore.search).toHaveBeenLastCalledWith({
        filter: geologyFilter,
        offset: 50,
        limit: 25,
      });
    });

    it('should preserve an existing offset and limit', () => {
      component.search(
        JSON.stringify({
          filter: geologyFilter,
          offset: 50,
          limit: 10,
        }),
      );

      expect(searchStore.search).toHaveBeenLastCalledWith({
        filter: geologyFilter,
        offset: 50,
        limit: 10,
      });
    });

    it('should set searchParams to the cleaned parameters', () => {
      component.search(
        JSON.stringify({
          filter: geologyFilter,
        }),
      );

      expect(component.searchParams()).toEqual({
        filter: geologyFilter,
        offset: 0,
        limit: 25,
      });
    });

    it('should handle a missing query', () => {
      searchStore.search.mockClear();

      component.search(undefined);

      expect(component.error()).toBe('Search failed');
      expect(searchStore.reset).toHaveBeenCalled();
      expect(searchStore.search).not.toHaveBeenCalled();
    });

    it('should handle a null query', () => {
      searchStore.search.mockClear();

      component.search(null);

      expect(component.error()).toBe('Search failed');
      expect(searchStore.reset).toHaveBeenCalled();
      expect(searchStore.search).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', () => {
      searchStore.search.mockClear();

      component.search('not valid JSON');

      expect(component.error()).toBe('Search failed');
      expect(searchStore.reset).toHaveBeenCalled();
      expect(searchStore.search).not.toHaveBeenCalled();
    });
  });

  describe('showResults', () => {
    it('should be true when results exist and there is no error', () => {
      searchStore.isLoading.mockReturnValue(false);
      searchStore.results.mockReturnValue([{ publication_guid: '123' }]);

      expect(component.showResults()).toBe(true);
    });

    it('should be false while loading', () => {
      searchStore.isLoading.mockReturnValue(true);
      searchStore.results.mockReturnValue([{ publication_guid: '123' }]);

      expect(component.showResults()).toBe(false);
    });

    it('should be false when there are no results', () => {
      searchStore.isLoading.mockReturnValue(false);
      searchStore.results.mockReturnValue(undefined);

      expect(component.showResults()).toBe(false);
    });

    it('should be false when there is an error', () => {
      searchStore.isLoading.mockReturnValue(false);
      searchStore.results.mockReturnValue([{ publication_guid: '123' }]);

      component.error.set('Search failed');

      expect(component.showResults()).toBe(false);
    });
  });

  describe('back', () => {
    it('should navigate to search when on the first page', () => {
      searchStore.pageIndex.mockReturnValue(0);

      component.back();

      expect(router.navigate).toHaveBeenCalledWith(['/search']);
    });

    it('should navigate to the previous page when not on the first page', () => {
      searchStore.pageIndex.mockReturnValue(2);
      searchStore.pageSize.mockReturnValue(25);

      component.searchParams.set(initialSearchParams);

      vi.spyOn(component, 'goToPage');

      component.back();

      expect(component.goToPage).toHaveBeenCalledWith(25, 25);
    });
  });

  describe('setViewType', () => {
    it('should navigate to the results page with the selected view', () => {
      component.searchParams.set(initialSearchParams);

      component.setViewType(ResultsViewType.Abstract);

      expect(router.navigate).toHaveBeenCalledWith(['/results'], {
        queryParams: {
          view: ResultsViewType.Abstract,
          query: JSON.stringify(initialSearchParams),
        },
      });
    });

    it('should default to table when view is undefined', () => {
      component.searchParams.set(initialSearchParams);

      component.setViewType(undefined);

      expect(router.navigate).toHaveBeenCalledWith(['/results'], {
        queryParams: {
          view: ResultsViewType.Table,
          query: JSON.stringify(initialSearchParams),
        },
      });
    });
  });

  describe('goToPage', () => {
    it('should do nothing when there are no search parameters', () => {
      component.searchParams.set(undefined);

      component.goToPage(25, 25);

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to the requested page', () => {
      component.searchParams.set(initialSearchParams);
      component.viewType.set(ResultsViewType.Abstract);

      component.goToPage(25, 25);

      expect(router.navigate).toHaveBeenCalledWith(['/results'], {
        queryParams: {
          view: ResultsViewType.Abstract,
          query: JSON.stringify({
            ...initialSearchParams,
            offset: 25,
            limit: 25,
          }),
        },
      });
    });

    it('should preserve existing search parameters', () => {
      component.searchParams.set(initialSearchParams);

      component.goToPage(50, 10);

      expect(router.navigate).toHaveBeenCalledWith(['/results'], {
        queryParams: {
          view: ResultsViewType.Table,
          query: JSON.stringify({
            ...initialSearchParams,
            offset: 50,
            limit: 10,
          }),
        },
      });
    });
  });

  describe('onPageChange', () => {
    it('should navigate using the paginator values', () => {
      vi.spyOn(component, 'goToPage');

      component.onPageChange({
        itemOffset: 50,
        pageSize: 25,
      });

      expect(component.goToPage).toHaveBeenCalledWith(50, 25);
    });
  });
});
