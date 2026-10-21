import { TestBed } from '@angular/core/testing';

import { Publication } from '../../types/publication';
import { PublicationCard } from './publication-card';

describe('PublicationCard', () => {
  const publication: Publication = {
    issue_identification: 'P2025-1',
    title: 'Geology of the Example Region',
    originator: 'A. Smith and B. Jones',
    series_name: 'Geological Survey',
    publication_year: '2025',
    place_keyword_1: 'Victoria',
    place_keyword_2: 'Vancouver',
    place_keyword_3: null,
    place_keyword_4: '',
    place_keyword_5: null,
    theme_keyword_1: 'Geology',
    theme_keyword_2: 'Minerals',
    theme_keyword_3: null,
    theme_keyword_4: '',
    theme_keyword_5: null,
    pdf_link: 'https://example.com/publication.pdf',
    zip_link: 'https://example.com/publication.zip',
    abstract: 'An overview of the geology of the example region.',
    thumbnail_link: 'https://example.com/thumbnail.png',
    geometry: undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationCard],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(PublicationCard);
    fixture.detectChanges();
    return fixture;
  }

  function getText(fixture: ReturnType<typeof createComponent>): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ').trim();
  }

  it('should create', () => {
    const fixture = createComponent();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render safely when no publication is supplied', () => {
    const fixture = createComponent();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(0);
  });

  it('should display the publication details', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.detectChanges();

    const text = getText(fixture);

    expect(text).toContain('P2025-1');
    expect(text).toContain('Geology of the Example Region');
    expect(text).toContain('A. Smith and B. Jones');
    expect(text).toContain('Geological Survey');
    expect(text).toContain('2025');
    expect(text).toContain('An overview of the geology of the example region.');
  });

  it('should hide the series when showSeries is false', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.componentRef.setInput('showSeries', false);
    fixture.detectChanges();

    expect(getText(fixture)).not.toContain('Series Name:');
    expect(getText(fixture)).not.toContain('Geological Survey');
  });

  it('should hide the publication year when showYear is false', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.componentRef.setInput('showYear', false);
    fixture.detectChanges();

    expect(getText(fixture)).not.toContain('Publication Year:');
  });

  it('should render place and theme keywords, ignoring empty keywords', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const text = getText(fixture);

    expect(component.placeKeywords()).toEqual(['Victoria', 'Vancouver']);
    expect(component.themeKeywords()).toEqual(['Geology', 'Minerals']);

    expect(text).toContain('Place Keywords:');
    expect(text).toContain('Theme Keywords:');

    const placeChipSet = fixture.nativeElement.querySelector(
      'mat-chip-set[aria-label="Place keywords"]',
    );
    const themeChipSet = fixture.nativeElement.querySelector(
      'mat-chip-set[aria-label="Theme keywords"]',
    );

    expect(placeChipSet).not.toBeNull();
    expect(themeChipSet).not.toBeNull();

    expect(placeChipSet.textContent).toContain('Victoria');
    expect(placeChipSet.textContent).toContain('Vancouver');
    expect(themeChipSet.textContent).toContain('Geology');
    expect(themeChipSet.textContent).toContain('Minerals');

    expect(placeChipSet.querySelectorAll('mat-chip')).toHaveLength(2);
    expect(themeChipSet.querySelectorAll('mat-chip')).toHaveLength(2);
  });

  it('should hide keywords when showKeywords is false', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.componentRef.setInput('showKeywords', false);
    fixture.detectChanges();

    expect(getText(fixture)).not.toContain('Place Keywords:');
    expect(getText(fixture)).not.toContain('Theme Keywords:');

    expect(fixture.nativeElement.querySelectorAll('mat-chip-set')).toHaveLength(0);
  });

  it('should render PDF and ZIP download links', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.detectChanges();

    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');

    expect(links).toHaveLength(2);

    const pdfLink = Array.from(links).find(
      (link) => link.textContent.trim() === 'PDF',
    ) as HTMLAnchorElement;

    const zipLink = Array.from(links).find(
      (link) => link.textContent.trim() === 'ZIP',
    ) as HTMLAnchorElement;

    expect(pdfLink).toBeTruthy();
    expect(pdfLink.getAttribute('href')).toBe(publication.pdf_link);
    expect(pdfLink.getAttribute('target')).toBe('_blank');

    expect(zipLink).toBeTruthy();
    expect(zipLink.getAttribute('href')).toBe(publication.zip_link);
    expect(zipLink.getAttribute('target')).toBe('_blank');
  });

  it('should render only the available download link', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', {
      pdf_link: 'https://example.com/publication.pdf',
    } as Publication);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a');

    expect(links).toHaveLength(1);
    expect(links[0].textContent.trim()).toBe('PDF');
  });

  it('should hide download links when showDownloads is false', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.componentRef.setInput('showDownloads', false);
    fixture.detectChanges();

    expect(getText(fixture)).not.toContain('Downloads');
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(0);
  });

  it('should display the thumbnail when enabled and a URL is supplied', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.detectChanges();

    const image: HTMLImageElement | null = fixture.nativeElement.querySelector('img');

    expect(image).not.toBeNull();
    expect(image!.getAttribute('src')).toBe(publication.thumbnail_link);
    expect(image!.getAttribute('alt')).toBe('Thumbnail');
  });

  it('should hide the thumbnail when showThumbnail is false', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', publication);
    fixture.componentRef.setInput('showThumbnail', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('should not render optional sections when their fields are absent', () => {
    const fixture = createComponent();

    fixture.componentRef.setInput('publication', {
      issue_identification: undefined,
      title: undefined,
      originator: undefined,
      series_name: undefined,
      publication_year: undefined,
      abstract: undefined,
      thumbnail_link: undefined,
      pdf_link: undefined,
      zip_link: undefined,
      place_keyword_1: undefined,
      place_keyword_2: undefined,
      place_keyword_3: undefined,
      place_keyword_4: undefined,
      place_keyword_5: undefined,
      theme_keyword_1: undefined,
      theme_keyword_2: undefined,
      theme_keyword_3: undefined,
      theme_keyword_4: undefined,
      theme_keyword_5: undefined,
    } as Publication);
    fixture.detectChanges();

    const text = getText(fixture);

    expect(text).not.toContain('Issue ID:');
    expect(text).not.toContain('Title:');
    expect(text).not.toContain('Author(s):');
    expect(text).not.toContain('Series Name:');
    expect(text).not.toContain('Publication Year:');
    expect(text).not.toContain('Place Keywords:');
    expect(text).not.toContain('Theme Keywords:');
    expect(text).not.toContain('Downloads');
    expect(text).not.toContain('Abstract');

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('a')).toHaveLength(0);
    expect(fixture.nativeElement.querySelectorAll('mat-chip-set')).toHaveLength(0);
  });
});
