import { Injectable, inject } from '@angular/core';
import { UserService } from '../auth/user/user.service';
import { UpgradeComponent } from '../../shared/components/upgrade/upgrade.component';
import { ModalService } from '../../shared/components/ui/modal';

export type PlanFeature =
  | 'family-sharing'
  | 'split-payments'
  | 'family-management'
  | 'messages'
  | 'financial-summary';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly userService = inject(UserService);
  private readonly modal = inject(ModalService);

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

    this.modal.open(UpgradeComponent, {
      size: 'md',
      data: { feature }
    });
  }
}
