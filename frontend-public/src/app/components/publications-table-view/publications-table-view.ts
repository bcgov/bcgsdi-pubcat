import { Component, inject, input, ViewChild } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { PublicationSearchStore } from '../../stores/publication-search-store';
import { Publication } from '../../types/publication';
import { PublicationSortField, SearchSort } from '../../types/search';

@Component({
  imports: [MatPaginatorModule, MatTableModule, MatSort, MatSortModule, RouterLink],
  selector: 'publications-table-view',
  styleUrl: './publications-table-view.scss',
  templateUrl: './publications-table-view.html',
})
export class PublicationsTableView {
  readonly publicationSearchStore = inject(PublicationSearchStore);
  private readonly router = inject(Router);

  readonly publications = input<Publication[] | undefined>(undefined);
  displayedColumns: string[] = ['author', 'publication_year', 'title', 'issue_id'];
  dataSource = new MatTableDataSource(this.publications());

  @ViewChild(MatSort) matSort!: MatSort;

  // Add this getter (or a computed signal if using Signals completely)
  // to read the active state directly from your store params:
  get activeSortField(): string {
    const lastSort = this.publicationSearchStore.lastSearchedParams()?.sort;
    if (Array.isArray(lastSort) && lastSort.length) {
      return lastSort[0].field;
    } else if (!!lastSort) {
      return (lastSort as SearchSort<PublicationSortField>).field;
    }
    return '';
  }

  get activeSortDirection(): 'asc' | 'desc' | '' {
    const lastSort = this.publicationSearchStore.lastSearchedParams()?.sort;
    if (Array.isArray(lastSort) && lastSort.length) {
      return lastSort[0].direction;
    } else if (!!lastSort) {
      return (lastSort as SearchSort<PublicationSortField>).direction;
    }
    return '';
  }

  // Event handlers
  // --------------------------------------------------------------------------

  onSortChanged = (event: any) => {
    const sort = [];
    if (!!event.active) {
      sort.push({ field: event.active, direction: event.direction });
    }

    const searchParams = this.publicationSearchStore.lastSearchedParams();
    if (!searchParams) {
      return;
    }
    const updatdSearchParams = {
      ...searchParams,
      offset: 0,
      sort: sort,
    };
    this.router.navigate(['/results'], {
      queryParams: {
        //view: this.viewType() || ResultsViewType.Table,
        query: JSON.stringify(updatdSearchParams),
      },
    });
  };
}
