import { Component, input } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Publication } from '../../types/publication';

@Component({
  imports: [MatPaginatorModule, MatTableModule],
  selector: 'publications-table-view',
  styleUrl: './publications-table-view.scss',
  templateUrl: './publications-table-view.html',
})
export class PublicationsTableView {
  readonly publications = input<Publication[] | undefined>(undefined);
  displayedColumns: string[] = ['author', 'publication_year', 'title', 'issue_id'];
}
