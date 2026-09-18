import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
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

  it('getAttachmentTypes should GET /references/attachment-types', () => {
    let result: Reference[] | undefined;
    service.getAttachmentTypes().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/attachment-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getGeometryDescriptors should GET /references/geometry-descriptors', () => {
    let result: Reference[] | undefined;
    service.getGeometryDescriptors().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/geometry-descriptors`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getKeywordTypes should GET /references/keyword-types', () => {
    let result: Reference[] | undefined;
    service.getKeywordTypes().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/keyword-types`);
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getPeerReviewStates should GET /references/peer-review-states', () => {
    let result: Reference[] | undefined;
    service.getPeerReviewStates().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/peer-review-states`);
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getPublicationTypes should GET /references/publication-types', () => {
    let result: Reference[] | undefined;
    service.getPublicationTypes().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/publication-types`);
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getSubmissionRelationshipTypes should GET /references/submission-relationship-types', () => {
    let result: Reference[] | undefined;
    service.getSubmissionRelationshipTypes().subscribe((data) => (result = data));

    const req = httpMock.expectOne(
      `${environment.pubCatApi}/references/submission-relationship-types`,
    );
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getSubmissionStates should GET /references/submission-states', () => {
    let result: Reference[] | undefined;
    service.getSubmissionStates().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/submission-states`);
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('getSubmissionTypes should GET /references/submission-types', () => {
    let result: Reference[] | undefined;
    service.getSubmissionTypes().subscribe((data) => (result = data));

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/submission-types`);
    req.flush(mockRefs);

    expect(result).toEqual(mockRefs);
  });

  it('should emit a typed error when the server returns a 404', () => {
    let error: Error | undefined;
    service.getAttachmentTypes().subscribe({
      next: () => {},
      error: (err) => (error = err),
    });

    const req = httpMock.expectOne(`${environment.pubCatApi}/references/attachment-types`);
    req.flush(null, { status: 404, statusText: 'Not Found' });

    expect(error?.constructor.name).toBe('NotFoundError');
  });
});
