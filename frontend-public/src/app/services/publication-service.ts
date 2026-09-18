import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorHandler } from '../core/error-handler';
import { Publication } from '../types/publication';
import { PublicationSearchParams } from '../types/search';

@Service()
export class PublicationService {
  private readonly http = inject(HttpClient);

  public searchPublications(params: PublicationSearchParams = {}): Observable<Publication[]> {
    return this.http
      .post<Publication[]>(`${environment.pubCatApi}/publications/search`, params)
      .pipe(catchError((err) => throwError(() => ErrorHandler.toApiError(err))));
  }
}
