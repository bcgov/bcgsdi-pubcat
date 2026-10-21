import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, shareReplay } from 'rxjs/operators';
import { Alert } from '../../components/alert/alert';
import { LoadingButton } from '../../components/loading-button/loading-button';
import { PageChangeEvent, Paginator } from '../../components/paginator/paginator';
import { PublicationsAbstractView } from '../../components/publications-abstract-view/publications-abstract-view';
import { PublicationsTableView } from '../../components/publications-table-view/publications-table-view';
import { SearchFilterSummary } from '../../components/search-filter-summary/search-filter-summary';
import { ErrorHandler } from '../../core/error-handler';
import { PublicationService } from '../../services/publication-service';
import { ToastService } from '../../services/toast-service';
import { PublicationSearchStore } from '../../stores/publication-search-store';
import { UserInputError } from '../../types/error';
import { PublicationSearchParams } from '../../types/search';

export enum ResultsViewType {
  Table = 'table',
  Abstract = 'abstract',
}

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    PublicationsTableView,
    PublicationsAbstractView,
    Paginator,
    SearchFilterSummary,
    Alert,
    RouterLink,
    NgClass,
    LoadingButton,
  ],
  selector: 'pubcat-search-results',
  styleUrl: './search-results.css',
  templateUrl: './search-results.html',
})
export class SearchResults {
  ResultsViewType = ResultsViewType;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly publicationSearchStore = inject(PublicationSearchStore);
  readonly publicationService = inject(PublicationService);
  readonly toastService = inject(ToastService);

  readonly routeParams = this.route.queryParamMap.pipe(
    map((params) => {
      let query;
      try {
        query = JSON.parse(params.get('query')!);
      } catch {
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
  readonly isDownloading = signal<boolean>(false);

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
    } catch {
      this.error.set('Search failed');
      this.publicationSearchStore.reset();
    }
  }

  download() {
    if (!this.searchParams() || this.isDownloading()) {
      return;
    }
    this.isDownloading.set(true);

    const downloadParams = this.searchParams();
    delete downloadParams?.offset;
    delete downloadParams?.limit;

    this.publicationService
      .downloadPublications(downloadParams)
      .pipe(
        finalize(() => this.isDownloading.set(false)),
        catchError((err) => throwError(() => ErrorHandler.toApiError(err))),
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');

          link.href = url;
          link.download = 'publication-search.xlsx';
          link.click();

          URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          if (error instanceof UserInputError) {
            this.toastService.error(error.message);
          }
          console.error('Failed to download publication search results', error);
        },
      });
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

  onPageChange(event: PageChangeEvent) {
    this.goToPage(event.pageStartOffset, event.pageSize);
  }
}
