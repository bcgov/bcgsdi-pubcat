import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { LoadingButton } from '../../components/loading-button/loading-button';
import { ReferenceCacheService } from '../../services/reference-cache-service';
import { PublicationSearchStore } from '../../stores/publication-search-store';
import {
  PublicationFilter,
  PublicationFilterClause,
  PublicationSearchParams,
} from '../../types/search';

enum SearchType {
  Basic = 'basic',
  Advanced = 'advanced',
}

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
  SearchType = SearchType;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly publicationSearchStore = inject(PublicationSearchStore);
  private readonly referenceCacheService = inject(ReferenceCacheService);

  readonly publicationSeriesOptions = this.referenceCacheService.publicationSeries;

  readonly form: FormGroup = this.fb.group({
    //basic search fields
    all: [null],
    //advanced search fields
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
  });

  readonly isDirty = toSignal(
    this.form.events.pipe(
      map(() => this.form.dirty),
      distinctUntilChanged(),
      startWith(this.form.dirty),
    ),
    { initialValue: this.form.dirty },
  );

  readonly hasQuickAndAdvancedSearch = computed<boolean>(() => false);

  ngOnInit() {
    this.populateFormFromStore();
  }

  async search() {
    const searchParams = this.buildSearchParams();
    // Build the PublicationSearchParams object, then stringify it, and sent to
    // the /results route as a query string parameter called "query"
    this.router.navigate(['/results'], {
      queryParams: {
        query: JSON.stringify(searchParams),
      },
    });
  }

  private buildQuickFilter(): PublicationFilter | undefined {
    // Prepare filters.  All filters are 'ANDed' together.
    const filter: PublicationFilterClause[] = [];
    if (this.form.get('all')?.value) {
      const searchText = this.form.get('all')?.value;
      const isNumber = !Number.isNaN(Number(searchText));
      filter.push({ field: 'author', operator: 'contains', value: searchText });
      filter.push({ field: 'title', operator: 'contains', value: searchText });
      filter.push({
        field: 'keyword',
        operator: 'contains',
        value: searchText,
      });
      filter.push({
        field: 'abstract',
        operator: 'contains',
        value: searchText,
      });
      filter.push({
        field: 'publication_year',
        operator: 'contains',
        value: searchText,
      });
      filter.push({
        field: 'nts_map',
        operator: 'contains',
        value: searchText,
      });

      filter.push({ field: 'series', operator: 'eq', value: searchText });
      filter.push({ field: 'issue_id', operator: 'eq', value: searchText });

      // Only search the following fields if the search text is numeric
      if (isNumber) {
        filter.push({
          field: 'publication_key',
          operator: 'eq',
          value: searchText,
        });
        filter.push({
          field: 'map_scale',
          operator: 'eq',
          value: searchText,
        });
      }
    }

    return filter?.length ? { or: filter } : undefined;
  }

  buildAdvancedFilter(): PublicationFilterClause[] | undefined {
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
    return filter;
  }

  /* 
  Creates combines the form field inputs into PublicationSearchParams object, which is
  the format needed by the PublicationSearchStore.search(...) method.  The .filter
  attribute is formatted differently depending on whether there are quick filters, 
  advanced filters, or both.  Note that this method is tightly coupled to 
  splitFilterIntoQuickAndAdvanced(...) which parses the very specific
  filter format produced by this method.
  */
  private buildSearchParams(): PublicationSearchParams {
    // Prepare filters.  All filters are 'ANDed' together.
    const quickFilter = this.buildQuickFilter();
    const advancedFilter = this.buildAdvancedFilter();

    // We format the filter differently depending on whether the quick filter,
    // the advanced filter, or both are specified
    let allFilter: PublicationFilterClause[] | PublicationFilter | undefined = undefined;
    if (quickFilter && advancedFilter) {
      allFilter = {
        and: [quickFilter, { and: advancedFilter }],
      };
    } else if (quickFilter) {
      allFilter = quickFilter;
    } else if (advancedFilter?.length) {
      allFilter = advancedFilter;
    }

    return {
      filter: allFilter,
      sort: undefined,
      offset: undefined,
      limit: undefined,
    };
  }

  reset() {
    this.publicationSearchStore.reset();
    this.populateFormFromStore();
  }

  // Private
  // --------------------------------------------------------------------------

  /* 
  Splits the given filter into a "quick" filter and an "advanced" filter.  
  Assumes the filter follows the exact format produced by the buildSearchParams()
  method (the .filter attribute of its return value)
  */
  private splitFilterIntoQuickAndAdvanced(
    filter: PublicationFilterClause[] | PublicationFilter | undefined,
  ): {
    quick: PublicationFilter | undefined;
    advanced: PublicationFilterClause[] | undefined;
  } {
    let quick = undefined;
    let advanced = undefined;

    if (Array.isArray(filter)) {
      advanced = filter;
    } else if (filter && Object.hasOwn(filter, 'and')) {
      const andValue = (filter as any).and;
      if (Array.isArray(andValue)) {
        const hasQuickAndAdvanced =
          andValue.length == 2 &&
          andValue.filter((v: any) => Object.hasOwn(v, 'or')).length == 1 &&
          andValue.filter((v: any) => Object.hasOwn(v, 'and')).length == 1;
        const hasOnlyQuick =
          !hasQuickAndAdvanced &&
          andValue.filter((v: any) => !!v.field && !!v.operator && !!v.value).length ==
            andValue.length;
        if (hasQuickAndAdvanced) {
          quick = andValue.find((v: any) => Object.hasOwn(v, 'or')); //get the value of the second-level "or"
          advanced = andValue.find((v: any) => Object.hasOwn(v, 'and'))?.and; //get the value of the second-level "and"
        } else if (hasOnlyQuick) {
          quick = andValue; //get the value of the first-level "and"
        }
      }
    }

    return { quick: quick, advanced: advanced };
  }

  private populateFormFromStore() {
    const filter = this.publicationSearchStore.lastSearchedParams()?.filter;

    const split = this.splitFilterIntoQuickAndAdvanced(filter);
    const quickFilter = split.quick;
    const advancedFilter = split.advanced;

    this.form.reset();
    this.populateQuickForm(quickFilter);
    this.populateAdvancedForm(advancedFilter);

    // check if form has any populated fields
    const formValue = this.form.getRawValue();
    const isAnyFieldPopulated = Object.values(formValue).some(
      (value) => value !== null && value !== undefined,
    );
    if (isAnyFieldPopulated) {
      this.form.markAsDirty();
    }
  }

  private populateQuickForm(quickFilter: PublicationFilter | undefined) {
    // Parse the search text from the given quickFilter.  If a specified filter
    // is not in the expected format it will be silently ignored.
    if (quickFilter && Object.hasOwn(quickFilter, 'or')) {
      const orValue = (quickFilter as any)['or'];
      if (
        Array.isArray(orValue) &&
        orValue.filter((v) => !!v.field && !!v.operator && !!v.value).length
      ) {
        const searchTextValues = [...new Set(orValue.map((v) => v.value))];
        // A properly-formatted quick search will have the same search text in all specified fields
        if (searchTextValues.length == 1) {
          this.form.get('all')?.setValue(searchTextValues[0]);
        }
      }
    }
  }

  private populateAdvancedForm(advancedFilter: PublicationFilterClause[] | undefined) {
    if (Array.isArray(advancedFilter)) {
      for (const f of advancedFilter) {
        const value = f.value;
        if (f.field == 'title') {
          this.form.get('title')?.setValue(value);
        } else if (f.field == 'abstract') {
          this.form.get('abstract')?.setValue(value);
        } else if (f.field == 'author') {
          this.form.get('author')?.setValue(value);
        } else if (f.field == 'keyword') {
          this.form.get('keyword')?.setValue(value);
        } else if (f.field == 'series') {
          this.form.get('series')?.setValue(value);
        } else if (f.field == 'nts_map') {
          this.form.get('ntsMap')?.setValue(value);
        } else if (f.field == 'map_scale') {
          this.form.get('mapScale')?.setValue(value);
        } else if (f.field == 'publication_key') {
          this.form.get('publicationId')?.setValue(value);
        } else if (f.field == 'issue_id') {
          this.form.get('issueId')?.setValue(value);
        }
      }
    }
  }
}
