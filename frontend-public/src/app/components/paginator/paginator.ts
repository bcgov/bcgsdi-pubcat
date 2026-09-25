import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface PageChangeEvent {
  pageIndex: number;
  pageSize: number;
  itemOffset: number;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20];

@Component({
  imports: [
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  selector: 'paginator',
  styleUrl: './paginator.css',
  templateUrl: './paginator.html',
})
export class Paginator {
  private readonly fb = inject(FormBuilder);

  readonly pageIndex = input(0);
  readonly pageSize = input<number>(DEFAULT_PAGE_SIZE_OPTIONS[0]);
  readonly pageSizeOptions = input<number[]>(DEFAULT_PAGE_SIZE_OPTIONS);
  readonly itemCount = input(0);
  readonly pageChange = output<PageChangeEvent>();

  readonly itemOffset = computed(() =>
    Paginator.pageIndexToItemOffset(this.pageIndex(), this.pageSize()),
  );
  readonly hasPreviousPage = computed(() => this.pageIndex() > 0);
  readonly hasNextPage = computed(() => this.itemCount() === this.pageSize());
  readonly rangeStart = computed(() => this.itemOffset() + 1);
  readonly rangeEnd = computed(() =>
    this.itemCount() ? this.rangeStart() + this.itemCount() - 1 : undefined,
  );

  readonly form: FormGroup = this.fb.group({
    pageSize: [null],
  });

  constructor() {
    effect(() => {
      const pageSize = this.pageSize();
      this.form.get('pageSize')?.setValue(pageSize, { emitEvent: false });
    });
    this.form.get('pageSize')?.valueChanges.subscribe(this.onPageSizeChanged);
  }

  previous(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    const newPageIndex = this.pageIndex() - 1;
    this.pageChange.emit({
      pageIndex: newPageIndex,
      pageSize: this.pageSize(),
      itemOffset: Paginator.pageIndexToItemOffset(newPageIndex, this.pageSize()),
    });
  }

  next(): void {
    if (!this.hasNextPage()) {
      return;
    }

    const newPageIndex = this.pageIndex() + 1;
    this.pageChange.emit({
      pageIndex: newPageIndex,
      pageSize: this.pageSize(),
      itemOffset: Paginator.pageIndexToItemOffset(newPageIndex, this.pageSize()),
    });
  }

  public static pageIndexToItemOffset(pageIndex: number, pageSize: number) {
    return pageIndex * pageSize;
  }

  // Event handlers
  // --------------------------------------------------------------------------

  onPageSizeChanged = (pageSize: number): void => {
    const newPageIndex = 0;
    this.pageChange.emit({
      pageIndex: 0,
      pageSize,
      itemOffset: Paginator.pageIndexToItemOffset(newPageIndex, this.pageSize()),
    });
  };
}
