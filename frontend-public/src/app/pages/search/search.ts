import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { LoadingButton } from '../../components/loading-button/loading-button';
import { ReferenceCacheService } from '../../services/reference-cache-service';
import { PublicationSearchStore } from '../../stores/publication-search-store';
import { PublicationFilterClause, PublicationSearchParams } from '../../types/search';

@Component({
  imports: [
    LoadingButton,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSelectModule,
  ],
  selector: 'search',
  styleUrl: './search.css',
  templateUrl: './search.html',
})
export class Search {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly publicationSearchStore = inject(PublicationSearchStore);
  private readonly referenceCacheService = inject(ReferenceCacheService);

  readonly publicationSeriesOptions = this.referenceCacheService.publicationSeries;

  readonly form: FormGroup = this.fb.group({
    author: [null],
    title: [null],
    keyword: [null],
    abstract: [null],
    year: [null],
    ntsMap: [null],
    mapScale: [null],
    series: [null],
    publicationId: [null],
    issueId: [null],
    all: [null],
  });

  ngOnInit() {
    this.populateFormFromStore();
  }

  async search() {
    const searchParams = this.buildSearchParams();
    await this.publicationSearchStore.search(searchParams);
    this.router.navigate(['/results']);
  }

  reset() {
    this.publicationSearchStore.reset();
    this.populateFormFromStore();
  }

  // Private
  // --------------------------------------------------------------------------

  private populateFormFromStore() {
    const filter = this.publicationSearchStore.lastSearchedParams()?.filter;
    this.form.reset();
    if (Array.isArray(filter)) {
      for (const f of filter) {
        const value = f.value;
        if (f.field == 'title') {
          this.form.get('title')?.setValue(value);
        }
      }
    }
  }

  private buildSearchParams(): PublicationSearchParams {
    // Prepare filters.  All filters are 'ANDed' together.
    const filter: PublicationFilterClause[] = [];
    if (this.form.get('author')?.value) {
      filter.push({ field: 'author', operator: 'contains', value: this.form.get('author')?.value });
    }
    if (this.form.get('title')?.value) {
      filter.push({ field: 'title', operator: 'contains', value: this.form.get('title')?.value });
    }
    if (this.form.get('keyword')?.value) {
      filter.push({
        field: 'keyword',
        operator: 'contains',
        value: this.form.get('keyword')?.value,
      });
    }
    if (this.form.get('abstract')?.value) {
      filter.push({
        field: 'abstract',
        operator: 'contains',
        value: this.form.get('abstract')?.value,
      });
    }
    if (this.form.get('year')?.value) {
      filter.push({
        field: 'publication_year',
        operator: 'contains',
        value: this.form.get('year')?.value,
      });
    }
    if (this.form.get('ntsMap')?.value) {
      filter.push({
        field: 'nts_map',
        operator: 'contains',
        value: this.form.get('ntsMap')?.value,
      });
    }
    if (this.form.get('mapScale')?.value) {
      filter.push({
        field: 'map_scale',
        operator: 'eq',
        value: this.form.get('mapScale')?.value,
      });
    }
    if (this.form.get('series')?.value) {
      filter.push({ field: 'series', operator: 'eq', value: this.form.get('series')?.value });
    }
    if (this.form.get('publicationId')?.value) {
      filter.push({
        field: 'publication_key',
        operator: 'eq',
        value: this.form.get('publicationId')?.value,
      });
    }
    if (this.form.get('issueId')?.value) {
      filter.push({ field: 'issue_id', operator: 'eq', value: this.form.get('issueId')?.value });
    }

    return {
      filter: filter?.length ? filter : undefined,
    };
  }
}
