import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErrorHandler } from '../core/error-handler';
import { Reference } from '../types/reference';

@Injectable({
  providedIn: 'root',
})
export class ReferenceService {
  private readonly http = inject(HttpClient);

  public getPublicationSeries(): Observable<Reference[]> {
    return this.http
      .get<Reference[]>(`${environment.pubCatApi}/references/publication-series`)
      .pipe(catchError((err) => throwError(() => ErrorHandler.toApiError(err))));
  }
}
