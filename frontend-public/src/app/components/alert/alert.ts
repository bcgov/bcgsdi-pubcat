import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'alert',
  imports: [MatIconModule, MatCardModule, NgClass],
  templateUrl: './alert.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert.scss',
})
export class Alert {
  readonly alertType = input<'error' | 'info' | 'warn' | 'success'>('info');
  readonly compact = input<boolean>(false);
  readonly showIcon = input<boolean>(true);
  cardClass: string | undefined = undefined;
  icon: string | undefined = undefined;

  async ngOnInit() {
    if (this.alertType() == 'error') {
      this.cardClass = 'alert-error';
      this.icon = 'error';
    } else if (this.alertType() == 'warn') {
      this.cardClass = 'alert-warn';
      this.icon = 'info';
    } else if (this.alertType() == 'success') {
      this.cardClass = 'alert-success';
      this.icon = 'info';
    } else {
      this.cardClass = 'alert-info';
      this.icon = 'info';
    }
  }
}
