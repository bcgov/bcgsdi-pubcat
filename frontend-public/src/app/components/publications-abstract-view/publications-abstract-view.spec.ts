import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';

import { Publication } from '../../types/publication';
import { PublicationCard } from '../publication-card/publication-card';
import { PublicationsAbstractView } from './publications-abstract-view';

@Component({
  selector: 'pubcat-publication-card',
  template: '',
})
class StubPublicationCard {
  readonly publication = input.required<Publication>();
  readonly showThumbnail = input(true);
  readonly showDownloads = input(true);
  readonly showSeries = input(true);
  readonly showKeywords = input(true);
}

describe('PublicationsAbstractView', () => {
  const publication1 = {
    publication_guid: '11111111-1111-4111-8111-111111111111',
    title: 'First publication',
  } as Publication;

  const publication2 = {
    publication_guid: '22222222-2222-4222-8222-222222222222',
    title: 'Second publication',
  } as Publication;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationsAbstractView],
      providers: [provideRouter([])],
    })
      .overrideComponent(PublicationsAbstractView, {
        remove: { imports: [PublicationCard] },
        add: { imports: [StubPublicationCard] },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(PublicationsAbstractView);
    fixture.detectChanges();
    return fixture;
  }

  function getCards(fixture: ReturnType<typeof createComponent>) {
    return fixture.debugElement.queryAll(By.directive(StubPublicationCard));
  }

  it('should create', () => {
    const fixture = createComponent();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render no cards when publications is undefined', () => {
    const fixture = createComponent();

    expect(getCards(fixture)).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('hr')).toBeNull();
  });

  it('should render no cards when publications is empty', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publications', []);
    fixture.detectChanges();

    expect(getCards(fixture)).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('hr')).toBeNull();
  });

  it('should render one card for each publication in order', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publications', [publication1, publication2]);
    fixture.detectChanges();

    const cards = getCards(fixture);

    expect(cards).toHaveLength(2);
    expect(cards[0].componentInstance.publication()).toBe(publication1);
    expect(cards[1].componentInstance.publication()).toBe(publication2);
  });

  it('should disable thumbnails, downloads, series and keywords', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publications', [publication1, publication2]);
    fixture.detectChanges();

    for (const card of getCards(fixture)) {
      const instance = card.componentInstance;

      expect(instance.showThumbnail()).toBe(false);
      expect(instance.showDownloads()).toBe(false);
      expect(instance.showSeries()).toBe(false);
      expect(instance.showKeywords()).toBe(false);
    }
  });

  it('should link each card to its publication detail page', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publications', [publication1, publication2]);
    fixture.detectChanges();

    const cards = getCards(fixture);
    const router = TestBed.inject(Router);

    const firstLink = cards[0].injector.get(RouterLink);
    const secondLink = cards[1].injector.get(RouterLink);

    expect(router.serializeUrl(firstLink.urlTree!)).toBe(
      `/publications/${publication1.publication_guid}`,
    );

    expect(router.serializeUrl(secondLink.urlTree!)).toBe(
      `/publications/${publication2.publication_guid}`,
    );
  });

  it('should render a separator between cards but not after the last card', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publications', [publication1, publication2]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('hr')).toHaveLength(1);
  });

  it('should not render a separator when there is only one publication', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publications', [publication1]);
    fixture.detectChanges();

    expect(getCards(fixture)).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('hr')).toHaveLength(0);
  });
});
