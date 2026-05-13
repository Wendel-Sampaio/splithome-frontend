import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import type { PlanFeature } from '../../../core/plan/plan.service';

type UpgradeDialogData = {
  feature: PlanFeature;
};

const FEATURE_MESSAGES: Record<PlanFeature, string> = {
  'family-sharing': 'O compartilhamento familiar está disponível apenas para usuários Premium.',
  'split-payments': 'A divisão de pagamentos está disponível apenas para usuários Premium.',
  'family-management': 'O gerenciamento familiar está disponível apenas para usuários Premium.',
  messages: 'As mensagens estão disponíveis apenas para usuários Premium.'
};

@Component({
  selector: 'app-upgrade',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.scss'
})
export class UpgradeComponent {
  readonly data = inject<UpgradeDialogData>(MAT_DIALOG_DATA);
  readonly message = FEATURE_MESSAGES[this.data.feature];
}
