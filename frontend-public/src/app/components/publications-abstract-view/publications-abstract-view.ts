import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Publication } from '../../types/publication';
import { PublicationCard } from '../publication-card/publication-card';

@Component({
  imports: [RouterLink, PublicationCard],
  selector: 'pubcat-publications-abstract-view',
  styleUrl: './publications-abstract-view.css',
  templateUrl: './publications-abstract-view.html',
})
export class PublicationsAbstractView {
  readonly publications = input<Publication[] | undefined>(undefined);
}
