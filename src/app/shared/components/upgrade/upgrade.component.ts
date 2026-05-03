import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import type { PlanFeature } from '../../../core/plan/plan.service';

type UpgradeDialogData = {
  feature: PlanFeature;
};

@Component({
  selector: 'app-upgrade',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.scss'
})
export class UpgradeComponent {
  readonly data = inject<UpgradeDialogData>(MAT_DIALOG_DATA);
}
