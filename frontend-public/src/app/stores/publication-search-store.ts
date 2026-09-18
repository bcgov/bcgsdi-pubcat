import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PublicationService } from '../services/publication-service';
import { PublicationSearchParams } from '../types/search';

@Service()
export class PublicationSearchStore {
  private readonly http = inject(HttpClient);
  private readonly publicationService = inject(PublicationService);

  readonly isLoading = signal<boolean>(false);
  readonly lastSearchedParams = signal<PublicationSearchParams | undefined>(undefined);
  readonly results = signal<any>(undefined);

  async search(params: PublicationSearchParams): Promise<boolean> {
    if (this.isLoading()) {
      return false;
    }

    this.isLoading.set(true);

    try {
      const results = await firstValueFrom(this.publicationService.searchPublications(params));

      this.lastSearchedParams.set(params);
      this.results.set(results);

      return true;
    } finally {
      this.isLoading.set(false);
    }
  }

  reset(): void {
    if (this.isLoading()) {
      return;
    }

    this.results.set(undefined);
    this.lastSearchedParams.set(undefined);
  }
}
