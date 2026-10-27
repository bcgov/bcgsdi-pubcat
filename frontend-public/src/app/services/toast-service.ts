import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Toast, ToastData } from '../components/toast/toast';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig<ToastData> = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  error(message: string): void {
    this.open({ message, type: 'error' });
  }

  info(message: string): void {
    this.open({ message, type: 'info' });
  }

  success(message: string): void {
    this.open({ message, type: 'success' });
  }

  private open(data: ToastData): void {
    this.snackBar.openFromComponent(Toast, {
      ...this.defaultConfig,
      data,
      panelClass: [`toast-panel`, `toast-panel-${data.type}`],
    });
  }
}
