import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { Paginator } from '../../components/paginator/paginator';
import { PublicationsTableView } from '../../components/publications-table-view/publications-table-view';
import { PublicationSearchStore } from '../../stores/publication-search-store';
import { PublicationSearchParams } from '../../types/search';

enum ResultsViewType {
  Table = 'table',
  Abstract = 'abstract',
}

@Component({
  imports: [MatButtonModule, MatIconModule, PublicationsTableView, Paginator],
  selector: 'search-results',
  styleUrl: './search-results.css',
  templateUrl: './search-results.html',
})
export class SearchResults {
  ResultsViewType = ResultsViewType;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly publicationSearchStore = inject(PublicationSearchStore);

  readonly routeParams = this.route.queryParamMap.pipe(
    map((params) => {
      let query;
      try {
        query = JSON.parse(params.get('query')!);
      } catch (err) {
        query = undefined;
      }
      return {
        query: query,
        view: params.get('view') || ResultsViewType.Table,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly viewType = signal(ResultsViewType.Table);
  readonly searchParams = signal<PublicationSearchParams | undefined>(undefined);

  readonly showResults = computed<boolean>(() => {
    return (
      !this.publicationSearchStore.isLoading() &&
      !!this.publicationSearchStore.results() &&
      !this.error()
    );
  });

  readonly error = signal<string | undefined>(undefined);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          query: params.get('query'),
          view: params.get('view') || ResultsViewType.Table,
        })),
        distinctUntilChanged((a, b) => a.query === b.query && a.view === b.view),
        takeUntilDestroyed(),
      )
      .subscribe(({ query, view }) => {
        this.viewType.set(view as ResultsViewType);
        this.search(query);
      });
  }

  search(stringifiedQuery: string | undefined | null) {
    try {
      if (!stringifiedQuery) {
        throw new Error('Missing the query');
      }
      const searchParams = JSON.parse(stringifiedQuery);

      //ensure offset and limit are included
      const cleanedParams = { ...searchParams };
      if (!Object.hasOwn(cleanedParams, 'offset')) {
        cleanedParams.offset = 0;
      }
      if (!Object.hasOwn(cleanedParams, 'limit')) {
        cleanedParams.limit = this.publicationSearchStore.pageSize();
      }
      this.searchParams.set(cleanedParams);

      this.publicationSearchStore.search(cleanedParams);
    } catch (err) {
      this.error.set('Search failed');
      this.publicationSearchStore.reset();
    }
  }

  /*
    'back' behaves differently depending on whether we 
    are currently looking at the first page of results, 
    or a subsequet page  
  */
  back() {
    // If currently on the first page of results, navigate back to the /search page
    if (this.publicationSearchStore.pageIndex() == 0) {
      this.router.navigate(['/search']);
    }

    // If currently on a page other than the first page of results,
    // navigate to the previous page
    else {
      const pageSize = this.publicationSearchStore.pageSize();
      const currentOffset = Paginator.pageIndexToItemOffset(
        this.publicationSearchStore.pageIndex(),
        pageSize,
      );
      const newOffset = currentOffset - pageSize;
      this.goToPage(newOffset, pageSize);
    }
  }

  setViewType(resultsViewType: ResultsViewType | undefined) {
    this.router.navigate(['/results'], {
      queryParams: {
        view: resultsViewType || ResultsViewType.Table,
        query: JSON.stringify(this.searchParams()),
      },
    });
  }

  goToPage(offset: number, limit: number) {
    const searchParams = this.searchParams();
    if (!searchParams) {
      return;
    }
    const updatdSearchParams = {
      ...searchParams,
      limit: limit,
      offset: offset,
    };
    this.router.navigate(['/results'], {
      queryParams: {
        view: this.viewType() || ResultsViewType.Table,
        query: JSON.stringify(updatdSearchParams),
      },
    });
  }

  // Event handlers
  // --------------------------------------------------------------------------

  onPageChange(event: any) {
    this.goToPage(event.itemOffset, event.pageSize);
  }
}
