import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Publication } from '../../types/publication';

@Component({
  imports: [MatIconModule, MatChipsModule],
  selector: 'pubcat-publication-card',
  styleUrl: './publication-card.css',
  templateUrl: './publication-card.html',
})
export class PublicationCard {
  readonly publication = input<Publication | undefined>(undefined);
  readonly showThumbnail = input<boolean>(true);
  readonly showKeywords = input<boolean>(true);
  readonly showYear = input<boolean>(true);
  readonly showDownloads = input<boolean>(true);
  readonly showSeries = input<boolean>(true);

  placeKeywords = computed<string[]>(() => {
    const p = this.publication();
    return [
      p?.place_keyword_1,
      p?.place_keyword_2,
      p?.place_keyword_3,
      p?.place_keyword_4,
      p?.place_keyword_5,
    ].filter((k) => !!k) as string[];
  });

  themeKeywords = computed<string[]>(() => {
    const p = this.publication();
    return [
      p?.theme_keyword_1,
      p?.theme_keyword_2,
      p?.theme_keyword_3,
      p?.theme_keyword_4,
      p?.theme_keyword_5,
    ].filter((k) => !!k) as string[];
  });
}
