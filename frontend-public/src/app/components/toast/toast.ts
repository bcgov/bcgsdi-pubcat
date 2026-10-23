import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastData = {
  message: string;
  type: 'error' | 'info' | 'success';
};

@Component({
  selector: 'pubcat-toast',
  imports: [MatIconModule, MatButtonModule, NgClass],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  readonly snackBarRef = inject(MatSnackBarRef<Toast>);

  get icon(): string {
    if (this.data.type === 'error') return 'error';
    if (this.data.type === 'success') return 'check_circle';
    return 'info';
  }

  get panelClass(): string {
    return `toast-${this.data.type}`;
  }

  dismiss() {
    this.snackBarRef.dismiss();
  }
}
