import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorHandler } from '../core/error-handler';
import { Publication } from '../types/publication';
import { PublicationSearchParams, PublicationSort } from '../types/search';

@Service()
export class PublicationService {
  private readonly http = inject(HttpClient);

  public searchPublications(params: PublicationSearchParams = {}): Observable<Publication[]> {
    const paramsCleaned = {
      ...params,
      sort: this.normalizeSort(params.sort),
    };
    return this.http
      .post<Publication[]>(`${environment.pubCatApi}/publications/search`, paramsCleaned)
      .pipe(catchError((err) => throwError(() => ErrorHandler.toApiError(err))));
  }

  private normalizeSort(sort: PublicationSort | undefined): PublicationSort {
    const result: PublicationSort = [];
    if (Array.isArray(sort)) {
      result.push(...sort);
    } else if (sort) {
      result.push(sort);
    }

    //add secondary sort columns
    if (!result.find((v) => v.field == 'publication_year')) {
      result.push({ field: 'publication_year', direction: 'desc' });
    }
    if (!result.find((v) => v.field == 'author')) {
      result.push({ field: 'author', direction: 'asc' });
    }

    return result;
  }
}
