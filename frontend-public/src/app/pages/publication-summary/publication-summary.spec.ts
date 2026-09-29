import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicationSummary } from './publication-summary';

describe('PublicationSummary', () => {
  let component: PublicationSummary;
  let fixture: ComponentFixture<PublicationSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
