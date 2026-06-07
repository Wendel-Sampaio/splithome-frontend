import { Component, DestroyRef, inject, Inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/auth/user/user.service';
import { User } from '../../../core/models/user/user';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';

export interface ModeloPagamento {
  id: string;
  remainingPayers: string[];
}

@Component({
  selector: 'app-dialog-pagamento',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dialog-pagamento.component.html',
  styleUrl: './dialog-pagamento.component.scss'
})
export class DialogPagamentoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogPagamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  userService = inject(UserService);
  compraService = inject(CompraService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  user!: User;
  loading = signal(false);

  ngOnInit(): void {
    this.pegarComprador();
  }

  pegarComprador() {
    const userId = this.data.responsibleId ?? this.data.purchaserId;
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.user = user;
      }
    });
  }

  efetuarPagamento() {
    const nomePagador = this.userService.getUser().name;
    const index = this.data.remainingPayers.indexOf(nomePagador);
    if (index !== -1) {
      this.data.remainingPayers.splice(index, 1);
    }
    const modeloPagamento: ModeloPagamento = {
      id: this.data.id,
      remainingPayers: this.data.remainingPayers
    };
    const request = this.data.tipo === 'despesa'
      ? this.compraService.atualizarDespesa(modeloPagamento)
      : this.compraService.atualizarCompra(modeloPagamento);

    this.loading.set(true);
    request.pipe(
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
