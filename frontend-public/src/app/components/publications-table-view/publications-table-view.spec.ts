import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicationsTableView } from './publications-table-view';

describe('PublicationsTableView', () => {
  let component: PublicationsTableView;
  let fixture: ComponentFixture<PublicationsTableView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsTableView],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationsTableView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
