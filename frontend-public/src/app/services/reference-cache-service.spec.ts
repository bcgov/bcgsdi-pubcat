import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ReferenceCacheService } from './reference-cache-service';

describe('ReferenceCacheService', () => {
  let service: ReferenceCacheService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ReferenceCacheService],
    });

    service = TestBed.inject(ReferenceCacheService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();

    const request = httpMock.expectOne('/api/references/publication-series');

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });
});
