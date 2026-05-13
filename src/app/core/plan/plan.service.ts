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
  private readonly premiumFeatures: readonly PlanFeature[] = [
    'family-sharing',
    'split-payments',
    'family-management',
    'messages'
  ];

  isPremium(): boolean {
    return this.userService.isPremium();
  }

  canAccess(feature: PlanFeature): boolean {
    return !this.premiumFeatures.includes(feature) || this.isPremium();
  }

  requiresPremium(feature: PlanFeature): void {
    if (this.canAccess(feature)) {
      return;
    }

    this.dialog.open(UpgradeComponent, {
      width: '420px',
      data: { feature }
    });
  }
}
