import { Component, DestroyRef, inject, Inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../core/auth/user/user.service';
import { User } from '../../../core/models/user/user';
import { CompraService } from '../../services/compra/compra.service';
import { CommonModule } from '@angular/common';

export interface ModeloPagamento {
  id: string;
  remainingPayers: string[];
}

@Component({
  selector: 'app-dialog-pagamento',
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './dialog-pagamento.component.html',
  styleUrl: './dialog-pagamento.component.scss'
})
export class DialogPagamentoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogPagamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any 
  ) {}

  userService = inject(UserService)
  compraService = inject(CompraService)
  private destroyRef = inject(DestroyRef);
  user!: User;

  ngOnInit(): void {
    this.pegarComprador();
  }

  pegarComprador() {
    const userId = this.data.responsibleId ?? this.data.purchaserId;
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.user = user;
      }
    })
  }

  efetuarPagamento() {
    const nomePagador = this.userService.getUser().name
    const index = this.data.remainingPayers.indexOf(nomePagador);
    if (index !== -1) {
      this.data.remainingPayers.splice(index, 1); 
    }
    const modeloPagamento: ModeloPagamento = {
      id: this.data.id,
      remainingPayers: this.data.remainingPayers
    }
    const request = this.data.tipo === 'despesa'
      ? this.compraService.atualizarDespesa(modeloPagamento)
      : this.compraService.atualizarCompra(modeloPagamento);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        console.log('Compra atualizada com sucesso', response);
      },
      error: error => {
        console.error('Erro ao atualizar a compra', error);
      }
    });
  }
}
