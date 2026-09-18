import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type LoadingButtonVariant = 'text' | 'filled' | 'elevated' | 'tonal' | 'outlined';

@Component({
  selector: 'loading-button',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './loading-button.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loading-button.scss',
})
export class LoadingButton {
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly variant = input<LoadingButtonVariant>('filled');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly spinnerDiameter = input<number>(20);

  readonly triggered = output<MouseEvent>();

  protected onClick(event: MouseEvent): void {
    if (!this.loading() && !this.disabled()) {
      this.triggered.emit(event);
    }
  }
}
