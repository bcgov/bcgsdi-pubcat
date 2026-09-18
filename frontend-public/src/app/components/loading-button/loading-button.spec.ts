import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingButton } from './loading-button';

describe('LoadingButton', () => {
  let component: LoadingButton;
  let fixture: ComponentFixture<LoadingButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingButton],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show content and hide spinner when not loading', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('.btn-content') as HTMLElement;
    const spinner = fixture.nativeElement.querySelector('mat-spinner');

    expect(content.style.visibility).not.toBe('hidden');
    expect(spinner).toBeNull();
  });

  it('should hide content and show spinner when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector('.btn-content') as HTMLElement;
    const spinner = fixture.nativeElement.querySelector('mat-spinner');

    expect(content.style.visibility).toBe('hidden');
    expect(spinner).toBeTruthy();
  });

  it('should disable the button when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should disable the button when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should not emit clicked event when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const clickSpy = vi.fn();
    component.clicked.subscribe(clickSpy);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should not emit clicked event when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const clickSpy = vi.fn();
    component.clicked.subscribe(clickSpy);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should emit clicked event when not loading and not disabled', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    const clickSpy = vi.fn();
    component.clicked.subscribe(clickSpy);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should default to type="button" to avoid unintended form submissions', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
  });

  it('should use the provided type attribute', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
  });
});
