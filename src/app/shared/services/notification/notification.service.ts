import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'snack-success', 4000);
  }

  error(message: string): void {
    this.show(message, 'snack-error', 6000);
  }

  info(message: string): void {
    this.show(message, 'snack-info', 4000);
  }

  warning(message: string): void {
    this.show(message, 'snack-warning', 6000);
  }

  private show(message: string, panelClass: string, duration: number): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    };
    this.snackBar.open(message, 'Fechar', config);
  }
}
