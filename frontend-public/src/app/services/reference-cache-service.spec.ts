import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Reference } from '../types/reference';
import { ReferenceCacheService } from './reference-cache-service';

describe('ReferenceCacheService', () => {
  let service: ReferenceCacheService;
  let httpMock: HttpTestingController;

  const mockAttachmentTypes: Reference[] = [{ code: 'AT1', title: 'Attachment Type 1' }];
  const mockSubmissionTypes: Reference[] = [{ code: 'ST1', title: 'Submission Type 1' }];

  /** Flush all 8 reference-type requests that are automatically triggered when
   *  the service is instantiated (one per toSignal() subscription). */
  function flushAll(overrides: Record<string, Reference[]> = {}) {
    const endpoints: Record<string, Reference[]> = {
      'attachment-types': overrides['attachment-types'] ?? [],
      'geometry-descriptors': overrides['geometry-descriptors'] ?? [],
      'keyword-types': overrides['keyword-types'] ?? [],
      'peer-review-states': overrides['peer-review-states'] ?? [],
      'publication-types': overrides['publication-types'] ?? [],
      'submission-relationship-types': overrides['submission-relationship-types'] ?? [],
      'submission-states': overrides['submission-states'] ?? [],
      'submission-types': overrides['submission-types'] ?? [],
    };

    for (const [path, data] of Object.entries(endpoints)) {
      const req = httpMock.expectOne(`${environment.pubCatApi}/references/${path}`);
      req.flush(data);
    }
  }

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
    flushAll();
  });

  it('should expose initial empty arrays before HTTP responses arrive', () => {
    expect(service.attachmentTypes()).toEqual([]);
    expect(service.geometryDescriptors()).toEqual([]);
    expect(service.keywordTypes()).toEqual([]);
    expect(service.peerReviewStates()).toEqual([]);
    expect(service.publicationTypes()).toEqual([]);
    expect(service.submissionRelationshipTypes()).toEqual([]);
    expect(service.submissionStates()).toEqual([]);
    expect(service.submissionTypes()).toEqual([]);

    flushAll();
  });

  it('should populate attachmentTypes signal once the HTTP request responds', () => {
    flushAll({ 'attachment-types': mockAttachmentTypes });

    expect(service.attachmentTypes()).toEqual(mockAttachmentTypes);
  });

  it('should populate submissionTypes signal once the HTTP request responds', () => {
    flushAll({ 'submission-types': mockSubmissionTypes });

    expect(service.submissionTypes()).toEqual(mockSubmissionTypes);
  });

  it('should populate all 8 signals independently from their responses', () => {
    const mockGeometry: Reference[] = [{ code: 'GD1', title: 'Geometry Desc 1' }];
    const mockKeywords: Reference[] = [{ code: 'KT1', title: 'Keyword Type 1' }];
    const mockPeerReview: Reference[] = [{ code: 'PR1', title: 'Peer Review State 1' }];
    const mockPubs: Reference[] = [{ code: 'PT1', title: 'Publication Type 1' }];
    const mockRelTypes: Reference[] = [{ code: 'RT1', title: 'Relationship Type 1' }];
    const mockStates: Reference[] = [{ code: 'SS1', title: 'Submission State 1' }];

    flushAll({
      'attachment-types': mockAttachmentTypes,
      'geometry-descriptors': mockGeometry,
      'keyword-types': mockKeywords,
      'peer-review-states': mockPeerReview,
      'publication-types': mockPubs,
      'submission-relationship-types': mockRelTypes,
      'submission-states': mockStates,
      'submission-types': mockSubmissionTypes,
    });

    expect(service.attachmentTypes()).toEqual(mockAttachmentTypes);
    expect(service.geometryDescriptors()).toEqual(mockGeometry);
    expect(service.keywordTypes()).toEqual(mockKeywords);
    expect(service.peerReviewStates()).toEqual(mockPeerReview);
    expect(service.publicationTypes()).toEqual(mockPubs);
    expect(service.submissionRelationshipTypes()).toEqual(mockRelTypes);
    expect(service.submissionStates()).toEqual(mockStates);
    expect(service.submissionTypes()).toEqual(mockSubmissionTypes);
  });

  it('should make exactly one HTTP request per reference type regardless of how many times the signal is read', () => {
    flushAll({ 'attachment-types': mockAttachmentTypes });

    // Reading the signal value multiple times must not trigger additional requests.
    const _ = service.attachmentTypes();
    const __ = service.attachmentTypes();

    // httpMock.verify() in afterEach confirms no unexpected requests were made.
    expect(service.attachmentTypes()).toEqual(mockAttachmentTypes);
  });

  it('signal stays at [] when the HTTP request returns an error', () => {
    // Flush all other requests normally; let attachment-types fail.
    const endpoints = [
      'geometry-descriptors',
      'keyword-types',
      'peer-review-states',
      'publication-types',
      'submission-relationship-types',
      'submission-states',
      'submission-types',
    ];
    for (const path of endpoints) {
      httpMock.expectOne(`${environment.pubCatApi}/references/${path}`).flush([]);
    }

    httpMock
      .expectOne(`${environment.pubCatApi}/references/attachment-types`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    // The signal keeps its initial value after an error.
    expect(service.attachmentTypes()).toEqual([]);
  });
});
