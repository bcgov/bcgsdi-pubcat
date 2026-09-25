import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PublicationService } from '../services/publication-service';
import { Publication } from '../types/publication';
import { PublicationSearchParams } from '../types/search';

const DEFAULT_PAGE_SIZE = 10;

type SimpleSearchParams = Omit<PublicationSearchParams, 'limit' | 'offset'>;

@Service()
export class PublicationSearchStore {
  private readonly http = inject(HttpClient);
  private readonly publicationService = inject(PublicationService);

  readonly isLoading = signal<boolean>(false);
  readonly lastSearchedParams = signal<PublicationSearchParams | undefined>(undefined);
  readonly results = signal<Publication[] | undefined>(undefined);

  readonly pageSize = computed(() => this.lastSearchedParams()?.limit || DEFAULT_PAGE_SIZE);
  readonly pageIndex = computed(() => (this.lastSearchedParams()?.offset || 0) / this.pageSize());

  /* 
  Run a search using the given filter, sort, offset and limit.  
  If offset and limit are not specified, 
  they default to values representing the first page.
  returns a boolean indicating whether the requested search was performed or not
  */
  async search(params: PublicationSearchParams): Promise<boolean> {
    const isIdentical = JSON.stringify(this.lastSearchedParams()) == JSON.stringify(params);
    if (isIdentical) {
      return false;
    }
    if (this.isLoading()) {
      return false;
    }

    this.isLoading.set(true);
    this.results.set(undefined);

    try {
      const results = await firstValueFrom(this.publicationService.searchPublications(params));

      this.lastSearchedParams.set(params);
      this.results.set(results);

      return true;
    } finally {
      this.isLoading.set(false);
    }
  }

  /* 
  Run a search using the previous filter and sort, 
  but returning a specific page (pageIndex starts at 0) 
  */
  async goToPage(pageIndex: number, pageSize: number) {
    const lastSearchedParams = this.lastSearchedParams();
    if (!lastSearchedParams) {
      return;
    }
    const offset = pageIndex * pageSize;
    const fullParams = { ...lastSearchedParams, limit: pageSize, offset: offset };
    return this.search(fullParams);
  }

  reset(): void {
    if (this.isLoading()) {
      return;
    }

    this.results.set(undefined);
    this.lastSearchedParams.set(undefined);
  }
}
