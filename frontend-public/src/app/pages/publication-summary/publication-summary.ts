import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavigationService } from '../../services/navigation-service';
import { PublicationService } from '../../services/publication-service';
import { PublicationSearchStore } from '../../stores/publication-search-store';

@Component({
  imports: [MatButtonModule, MatIconModule, MatChipsModule],
  selector: 'pubcat-publication',
  styleUrl: './publication-summary.css',
  templateUrl: './publication-summary.html',
})
export class PublicationSummary {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicationService = inject(PublicationService);

  readonly navigationService = inject(NavigationService);
  private publicationSearchStore = inject(PublicationSearchStore);

  readonly publicationGuid = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('publicationGuid'))),
    {
      initialValue: null,
    },
  );

  readonly publication = rxResource({
    params: () => this.publicationGuid(),

    stream: ({ params: publicationGuid }) => {
      if (!publicationGuid) {
        return EMPTY;
      }

      return this.publicationService.getPublication(publicationGuid);
    },
  });

  placeKeywords = computed<string[]>(() => {
    const p = this.publication.value();
    return [
      p?.place_keyword_1,
      p?.place_keyword_2,
      p?.place_keyword_3,
      p?.place_keyword_4,
      p?.place_keyword_5,
    ].filter((k) => !!k) as string[];
  });

  themeKeywords = computed<string[]>(() => {
    const p = this.publication.value();
    return [
      p?.theme_keyword_1,
      p?.theme_keyword_2,
      p?.theme_keyword_3,
      p?.theme_keyword_4,
      p?.theme_keyword_5,
    ].filter((k) => !!k) as string[];
  });

  newSearch() {
    this.publicationSearchStore.reset();
    this.router.navigate(['/search']);
  }
}
