import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Compra, PaymentPerson } from '../../../core/models/compra/compra';
import { PlanService } from '../../../core/plan/plan.service';
import { CategoriaCorPipe } from '../../pipes/categoria-cor.pipe';
import { CategoriaIconePipe } from '../../pipes/categoria-icone.pipe';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';

export type CompraDetalheDialogData = {
  compra: Compra;
  isPremium: boolean;
};

type PessoaPagamento = {
  nome: string;
  profilePhoto?: string;
  status: 'paid' | 'pending';
};

@Component({
  selector: 'app-compra-detalhe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogClose,
    MatIconModule,
    CategoriaCorPipe,
    CategoriaIconePipe,
    CategoriaPipe,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
  ],
  templateUrl: './compra-detalhe.component.html',
  styleUrl: './compra-detalhe.component.scss',
})
export class CompraDetalheComponent {
  readonly data = inject<CompraDetalheDialogData>(MAT_DIALOG_DATA);
  private readonly planService = inject(PlanService);

  readonly compra = this.data.compra;
  readonly isPremium = this.data.isPremium;
  readonly pagadores = this.displayNames(this.compra.payerNames, this.compra.payers);
  readonly pendentes = this.displayNames(this.compra.remainingPayerNames, this.compra.remainingPayers);
  readonly pagos = this.pagadores.filter((pagador) => !this.pendentes.includes(pagador));

  get valorUnitario(): number {
    return this.compra.unitValue || (this.pagadores.length ? this.compra.value / this.pagadores.length : this.compra.value);
  }

  get progressoPagamento(): number {
    if (!this.pagadores.length) {
      return this.compra.isPaid ? 100 : 0;
    }

    return Math.round((this.pagos.length / this.pagadores.length) * 100);
  }

  get pessoasPagamento(): PessoaPagamento[] {
    const profiles = this.paymentPeople(this.compra.payerProfiles, this.pagadores);

    return profiles.map((pessoa) => ({
      nome: pessoa.name,
      profilePhoto: pessoa.profilePhoto,
      status: this.pendentes.includes(pessoa.name) ? 'pending' : 'paid',
    }));
  }

  get statusLabel(): string {
    return this.compra.isPaid || (this.pagadores.length > 0 && this.pendentes.length === 0) ? 'Pago' : 'Pendente';
  }

  abrirUpgrade(): void {
    this.planService.requiresPremium('split-payments');
  }

  private displayNames(names: string[] | undefined, fallbacks: string[] | undefined): string[] {
    const source = names?.length ? names : fallbacks;
    return (source ?? []).filter(Boolean);
  }

  private paymentPeople(profiles: PaymentPerson[] | undefined, names: string[]): PaymentPerson[] {
    if (profiles?.length) {
      return profiles;
    }

    return names.map((name) => ({ reference: name, name }));
  }
}
