import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { NavigationService } from '../../services/navigation-service';
import { PublicationService } from '../../services/publication-service';
import { PublicationSearchStore } from '../../stores/publication-search-store';
import { PublicationSummary } from './publication-summary';

describe('PublicationSummary', () => {
  let component: PublicationSummary;
  let fixture: ComponentFixture<PublicationSummary>;

  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  let router: {
    navigate: ReturnType<typeof vi.fn>;
  };

  let publicationService: {
    getPublication: ReturnType<typeof vi.fn>;
  };

  let navigationService: NavigationService;

  let publicationSearchStore: {
    reset: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(
      convertToParamMap({
        publicationGuid: null,
      }),
    );

    router = {
      navigate: vi.fn(),
    };

    publicationService = {
      getPublication: vi.fn(),
    };

    navigationService = {
      previousUrl: '',
      currentUrl: '',
      canGoBack: true,
      getPreviousUrl: vi.fn(),
      back: vi.fn(),
    } as unknown as NavigationService;

    publicationSearchStore = {
      reset: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PublicationSummary],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: PublicationService,
          useValue: publicationService,
        },
        {
          provide: NavigationService,
          useValue: navigationService,
        },
        {
          provide: PublicationSearchStore,
          useValue: publicationSearchStore,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicationSummary);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
