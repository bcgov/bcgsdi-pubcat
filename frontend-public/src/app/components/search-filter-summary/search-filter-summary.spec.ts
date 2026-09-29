import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchFilterSummary } from './search-filter-summary';

describe('SearchFilterSummary', () => {
  let component: SearchFilterSummary;
  let fixture: ComponentFixture<SearchFilterSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFilterSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFilterSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
