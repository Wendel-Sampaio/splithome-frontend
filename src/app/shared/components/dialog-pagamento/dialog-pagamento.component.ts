import { ChangeDetectionStrategy, Component, DestroyRef, inject, Inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/auth/user/user.service';
import { User } from '../../../core/models/user/user';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';
import { FormSectionComponent } from '../ui/form-section/form-section.component';
import { ModalBodyComponent } from '../ui/modal-body/modal-body.component';
import { ModalFooterComponent } from '../ui/modal-footer/modal-footer.component';
import { ModalHeaderComponent } from '../ui/modal-header/modal-header.component';
import { SummaryBlockComponent } from '../ui/summary-block/summary-block.component';

export interface ModeloPagamento {
  id: string;
  remainingPayers: string[];
}

@Component({
  selector: 'app-dialog-pagamento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ModalHeaderComponent,
    ModalBodyComponent,
    ModalFooterComponent,
    FormSectionComponent,
    SummaryBlockComponent,
  ],
  templateUrl: './dialog-pagamento.component.html',
  styleUrl: './dialog-pagamento.component.scss',
})
export class DialogPagamentoComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly compraService = inject(CompraService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  user!: User;
  loading = signal(false);

  constructor(
    public dialogRef: MatDialogRef<DialogPagamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id: string; remainingPayers: string[]; unitValue: number; responsibleId?: string; purchaserId?: string }
  ) {}

  ngOnInit(): void {
    this.pegarComprador();
  }

  pegarComprador(): void {
    const userId = this.data.responsibleId ?? this.data.purchaserId;
    if (!userId) {
      return;
    }
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.user = user;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  efetuarPagamento(): void {
    const nomePagador = this.userService.getUser().name;
    const index = this.data.remainingPayers.indexOf(nomePagador);
    if (index !== -1) {
      this.data.remainingPayers.splice(index, 1);
    }
    const modeloPagamento: ModeloPagamento = {
      id: this.data.id,
      remainingPayers: this.data.remainingPayers
    };
    this.loading.set(true);
    this.compraService.atualizarCompra(modeloPagamento).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Pagamento registrado!');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notify.error('Não foi possível registrar o pagamento.');
      }
    });
  }
}
