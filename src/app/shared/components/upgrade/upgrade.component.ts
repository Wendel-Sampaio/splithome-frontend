import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import type { PlanFeature } from '../../../core/plan/plan.service';

type UpgradeDialogData = {
  feature: PlanFeature;
};

const FEATURE_MESSAGES: Record<PlanFeature, string> = {
  'family-sharing': 'O compartilhamento familiar está disponível apenas para usuários Premium.',
  'split-payments': 'A divisão de gastos está disponível apenas para usuários Premium.',
  'family-management': 'O gerenciamento familiar está disponível apenas para usuários Premium.',
  messages: 'Os recados estão disponíveis apenas para usuários Premium.'
};

const PREMIUM_BENEFITS = [
  {
    icon: 'groups',
    title: 'Compartilhamento familiar',
    description: 'Organize a casa com as pessoas que dividem a rotina com você.'
  },
  {
    icon: 'payments',
    title: 'Divisão de gastos',
    description: 'Acompanhe despesas compartilhadas e veja quem pagou cada item.'
  },
  {
    icon: 'chat',
    title: 'Recados',
    description: 'Centralize avisos importantes para manter todos alinhados.'
  }
];

@Component({
  selector: 'app-upgrade',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle, MatIconModule],
  templateUrl: './upgrade.component.html',
  styleUrl: './upgrade.component.scss'
})
export class UpgradeComponent {
  readonly data = inject<UpgradeDialogData>(MAT_DIALOG_DATA);
  readonly message = FEATURE_MESSAGES[this.data.feature];
  readonly benefits = PREMIUM_BENEFITS;

  showInstructions = false;

  showUpgradeInstructions(): void {
    this.showInstructions = true;
  }
}
