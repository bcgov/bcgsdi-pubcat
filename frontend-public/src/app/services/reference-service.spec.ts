import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Reference } from '../types/reference';
import { ReferenceService } from './reference-service';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let httpMock: HttpTestingController;

  const mockRefs: Reference[] = [{ code: 'A', title: 'Item A' }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ReferenceService],
    });
    service = TestBed.inject(ReferenceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
