import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Toast } from '../components/toast/toast';
import { ToastService } from './toast-service';

describe('ToastService', () => {
  let service: ToastService;
  let openFromComponentSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openFromComponentSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        ToastService,
        { provide: MatSnackBar, useValue: { openFromComponent: openFromComponentSpy } },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('error() opens snackbar with Toast component and error data', () => {
    service.error('Something went wrong');

    expect(openFromComponentSpy).toHaveBeenCalledOnce();
    expect(openFromComponentSpy).toHaveBeenCalledWith(Toast, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      data: { message: 'Something went wrong', type: 'error' },
      panelClass: ['toast-panel', 'toast-panel-error'],
    });
  });

  it('info() opens snackbar with Toast component and info data', () => {
    service.info('FYI');

    expect(openFromComponentSpy).toHaveBeenCalledOnce();
    expect(openFromComponentSpy).toHaveBeenCalledWith(Toast, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      data: { message: 'FYI', type: 'info' },
      panelClass: ['toast-panel', 'toast-panel-info'],
    });
  });

  it('success() opens snackbar with Toast component and success data', () => {
    service.success('Saved!');

    expect(openFromComponentSpy).toHaveBeenCalledOnce();
    expect(openFromComponentSpy).toHaveBeenCalledWith(Toast, {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      data: { message: 'Saved!', type: 'success' },
      panelClass: ['toast-panel', 'toast-panel-success'],
    });
  });
});

