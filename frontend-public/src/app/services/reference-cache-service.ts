import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Reference } from '../types/reference';
import { ReferenceService } from './reference-service';

/** Fallback observable used when an HTTP request for reference data fails. */
const EMPTY_REFS = of([] as Reference[]);

/**
 * Provides various reference data lists as Angular signals.
 *
 * Each signal subscribes to its corresponding HTTP observable once (via
 * `toSignal`), so data is fetched exactly once and cached in the signal for
 * the lifetime of the application.  Subsequent reads of any signal return the
 * cached value with no additional HTTP requests.
 *
 * If an HTTP request fails the corresponding signal keeps its initial empty
 * array so that consumers degrade gracefully.
 *
 * @example
 * // In a component or service:
 * readonly referenceCacheService = inject(ReferenceCacheService);
 *
 * // Reading a signal value (works in templates too):
 * const states = this.referenceCacheService.publicationSeries(); // Reference[]
 *
 * @example
 * // In an Angular template:
 * @for (s of referenceCacheService.publicationSeries(); track s.code) {
 *   <mat-option [value]="s.code">{{ s.title }}</mat-option>
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class ReferenceCacheService {
  private readonly referenceService = inject(ReferenceService);

  /** A list of publication Series */
  readonly publicationSeries = toSignal(
    this.referenceService.getPublicationSeries().pipe(catchError(() => EMPTY_REFS)),
    { initialValue: [] as Reference[] },
  );
}
