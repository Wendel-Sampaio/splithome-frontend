import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../auth/user/user.service';
import { UpgradeComponent } from '../../shared/components/upgrade/upgrade.component';

export type PlanFeature =
  | 'family-sharing'
  | 'split-payments'
  | 'family-management'
  | 'messages';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);

  isPremium(): boolean {
    return this.userService.isPremium();
  }

  canAccess(): boolean {
    return this.isPremium();
  }

  requiresPremium(feature: PlanFeature): void {
    if (this.canAccess()) {
      return;
    }

    this.dialog.open(UpgradeComponent, {
      width: '460px',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'upgrade-dialog',
      data: { feature }
    });
  }
}
