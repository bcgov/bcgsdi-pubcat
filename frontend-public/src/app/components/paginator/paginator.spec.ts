import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageChangeEvent, Paginator } from './paginator';

describe('Paginator', () => {
  let component: Paginator;
  let fixture: ComponentFixture<Paginator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paginator],
    }).compileComponents();

    fixture = TestBed.createComponent(Paginator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should use the default page index', () => {
      expect(component.pageIndex()).toBe(0);
    });

    it('should use the default page size', () => {
      expect(component.pageSize()).toBe(10);
    });

    it('should use the default page size options', () => {
      expect(component.pageSizeOptions()).toEqual([10, 20]);
    });

    it('should use the default item count', () => {
      expect(component.itemCount()).toBe(0);
    });
  });

  describe('itemOffset', () => {
    it('should be zero on the first page', () => {
      fixture.componentRef.setInput('pageIndex', 0);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.itemOffset()).toBe(0);
    });

    it('should calculate the item offset', () => {
      fixture.componentRef.setInput('pageIndex', 2);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.itemOffset()).toBe(20);
    });

    it('should calculate the item offset using a custom page size', () => {
      fixture.componentRef.setInput('pageIndex', 3);
      fixture.componentRef.setInput('pageSize', 25);
      fixture.detectChanges();

      expect(component.itemOffset()).toBe(75);
    });
  });

  describe('hasPreviousPage', () => {
    it('should be false on the first page', () => {
      fixture.componentRef.setInput('pageIndex', 0);
      fixture.detectChanges();

      expect(component.hasPreviousPage()).toBe(false);
    });

    it('should be true when not on the first page', () => {
      fixture.componentRef.setInput('pageIndex', 1);
      fixture.detectChanges();

      expect(component.hasPreviousPage()).toBe(true);
    });
  });

  describe('hasNextPage', () => {
    it('should be true when the current page is full', () => {
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 10);
      fixture.detectChanges();

      expect(component.hasNextPage()).toBe(true);
    });

    it('should be false when the current page is not full', () => {
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 9);
      fixture.detectChanges();

      expect(component.hasNextPage()).toBe(false);
    });

    it('should be false when there are no results', () => {
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 0);
      fixture.detectChanges();

      expect(component.hasNextPage()).toBe(false);
    });
  });

  describe('rangeStart', () => {
    it('should start at 1 on the first page', () => {
      fixture.componentRef.setInput('pageIndex', 0);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.rangeStart()).toBe(1);
    });

    it('should calculate the start of the current page', () => {
      fixture.componentRef.setInput('pageIndex', 2);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      expect(component.rangeStart()).toBe(21);
    });
  });

  describe('rangeEnd', () => {
    it('should be undefined when there are no results', () => {
      fixture.componentRef.setInput('itemCount', 0);
      fixture.detectChanges();

      expect(component.rangeEnd()).toBeUndefined();
    });

    it('should calculate the end of the first page', () => {
      fixture.componentRef.setInput('pageIndex', 0);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 10);
      fixture.detectChanges();

      expect(component.rangeEnd()).toBe(10);
    });

    it('should calculate the end of a subsequent page', () => {
      fixture.componentRef.setInput('pageIndex', 2);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 7);
      fixture.detectChanges();

      expect(component.rangeEnd()).toBe(27);
    });
  });

  describe('previous', () => {
    it('should emit the previous page when not on the first page', () => {
      fixture.componentRef.setInput('pageIndex', 2);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.previous();

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 1,
        pageSize: 10,
        itemOffset: 10,
      } satisfies PageChangeEvent);
    });

    it('should not emit when already on the first page', () => {
      fixture.componentRef.setInput('pageIndex', 0);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.previous();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should use the configured page size', () => {
      fixture.componentRef.setInput('pageIndex', 3);
      fixture.componentRef.setInput('pageSize', 25);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.previous();

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 2,
        pageSize: 25,
        itemOffset: 50,
      });
    });
  });

  describe('next', () => {
    it('should emit the next page when the current page is full', () => {
      fixture.componentRef.setInput('pageIndex', 1);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 10);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.next();

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 2,
        pageSize: 10,
        itemOffset: 20,
      } satisfies PageChangeEvent);
    });

    it('should not emit when the current page is not full', () => {
      fixture.componentRef.setInput('pageIndex', 1);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.componentRef.setInput('itemCount', 5);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.next();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should calculate the next page offset using a custom page size', () => {
      fixture.componentRef.setInput('pageIndex', 1);
      fixture.componentRef.setInput('pageSize', 25);
      fixture.componentRef.setInput('itemCount', 25);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.next();

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 2,
        pageSize: 25,
        itemOffset: 50,
      });
    });
  });

  describe('onPageSizeChanged', () => {
    it('should emit a page change with page index zero', () => {
      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.onPageSizeChanged(20);

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 0,
        pageSize: 20,
        itemOffset: 0,
      } satisfies PageChangeEvent);
    });

    it('should reset the item offset to zero when the page size changes', () => {
      fixture.componentRef.setInput('pageIndex', 3);
      fixture.componentRef.setInput('pageSize', 10);
      fixture.detectChanges();

      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.onPageSizeChanged(25);

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 0,
        pageSize: 25,
        itemOffset: 0,
      });
    });

    it('should emit when the page size form control changes', () => {
      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      component.form.get('pageSize')?.setValue(20);

      expect(emitSpy).toHaveBeenCalledWith({
        pageIndex: 0,
        pageSize: 20,
        itemOffset: 0,
      });
    });
  });

  describe('page size form control', () => {
    it('should initialize the form control from the pageSize input', () => {
      expect(component.form.get('pageSize')?.value).toBe(10);
    });

    it('should synchronize the form control when pageSize changes', () => {
      fixture.componentRef.setInput('pageSize', 20);
      fixture.detectChanges();

      expect(component.form.get('pageSize')?.value).toBe(20);
    });

    it('should not emit a page change when pageSize input changes', () => {
      const emitSpy = vi.fn();
      component.pageChange.subscribe(emitSpy);

      fixture.componentRef.setInput('pageSize', 20);
      fixture.detectChanges();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('pageIndexToItemOffset', () => {
    it('should return zero for the first page', () => {
      expect(Paginator.pageIndexToItemOffset(0, 10)).toBe(0);
    });

    it('should calculate the offset for subsequent pages', () => {
      expect(Paginator.pageIndexToItemOffset(3, 10)).toBe(30);
    });

    it('should calculate the offset with a custom page size', () => {
      expect(Paginator.pageIndexToItemOffset(2, 25)).toBe(50);
    });
  });
});
