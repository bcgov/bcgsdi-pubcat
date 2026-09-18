import { TestBed } from '@angular/core/testing';
import { PublicationSearchStore } from './publication-search-store';

describe('PublicationSearchStore', () => {
  let service: PublicationSearchStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicationSearchStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
