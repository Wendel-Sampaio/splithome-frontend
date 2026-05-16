import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormTransacaoComponent } from '../form-transacao/form-transacao.component';
import { UserService } from '../../../core/auth/user/user.service';
import { MatCardTitle } from '@angular/material/card';
import { DialogPagamentoComponent } from '../dialog-pagamento/dialog-pagamento.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from '../confirm-delete/confirm-delete.component';

export interface CompraModel {
  id: string;
  title: string;
  category: string;
  purchaseDate: Date;
  paymentDate: Date;
  value: number;
  remainingPayers: string[];
  formatedPayers: string;
  unitValue: number;
  purchaserName: string;
  payment: string;
  formatedRemainingPayers: string;
  showPaymentButton: boolean;
  isPaid: boolean;
}

@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [
    MatTableModule,
    CommonModule,
    MatDialogModule,
    MatCardTitle,
    MatIconModule,
    MatButtonModule
  ],
})
export class ComprasComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef) { }

  private destroyRef = inject(DestroyRef);
  readonly dialog = inject(MatDialog);

  abrirFormCompra() {
    const formRef = this.dialog.open(FormTransacaoComponent, {
      width: '550px',
    });
    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.pegarCompras()
    });
  }

  editarCompra(compra: Compra): void {
    const formRef = this.dialog.open(FormTransacaoComponent, {
      width: '550px',
      data: {
        tipo: 'compra',
        compra: {
          ...compra,
          payers: [...compra.payers],
          remainingPayers: [...compra.remainingPayers]
        }
      }
    });

    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.pegarCompras()
    });
  }

  efetuarPagamento(element: any) {
    if (!this.verificaUserRemainingPayers(element)) {
      const userName = this.userService.getUser().name;
      element.remainingPayers.push(userName)
      element.isPaid = false;
      this.compraService.atualizarCompra({
        id: element.id,
        remainingPayers: element.remainingPayers
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => {
          this.pegarCompras()
        },
        error: (error) => {
        }
      });
      return;
    }
    const dialogRef = this.dialog.open(DialogPagamentoComponent, {
      data: element
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.pegarCompras()
      console.log(`Dialog result: ${result}`);
    });
  }

  ngOnInit(): void {
    this.pegarCompras()
  }

  displayedColumns: string[] = [
    'title',
    'category',
    'purchaseDate',
    'paymentDate',
    'value',
    'formatedPayers',
    'unitValue',
    'purchaserName',
    'payment',
    'formatedRemainingPayers',
    'actions'
  ];

  compras: Compra[] = [];
  compraService = inject(CompraService)
  userService = inject(UserService)

  pegarCompras() {
    this.compraService.listarCompras().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: compras => {
        console.log(compras)
        this.tratamentoLista(compras)
        this.compras = compras
      }, error: error => {
        console.log("Erro ao carregar lista de compras!")
      }
    })
  }

  tratamentoLista(compras: Compra[]) {
    compras.forEach(compra => {
      this.formatPagador(compra)
      this.pagamentoDisponivel(compra)
      this.formatCategoria(compra)
      this.calculaValorUnitario(compra)
      this.formatNomesPagadores(compra)
      this.formatNomesPagadoresRestantes(compra)
      this.verificaUserRemainingPayers(compra)
      this.mudarStatusDaCompra(compra)
    })
  }

  mudarStatusDaCompra(compra: Compra) {
    if (this.verificaUserRemainingPayers(compra)) {
      compra.isPaid = false;
    } else {
      compra.isPaid = true;
    }
  }

  isLastCompra(compra: Compra): boolean {
    return this.compras[this.compras.length - 1] === compra;
  }

  verificaUserRemainingPayers(compra: Compra): boolean {
    const userName = this.userService.getUser().name;
    return compra.remainingPayers.includes(userName);
  }

  verificarPagamento(element: Compra): boolean {
    if (element.purchaserId === this.userService.getUser().id) {
      if (element.remainingPayers.length !== 0) {
        return element.isPaid = false;
      }
    }
    return element.isPaid;
  }

  pagamentoDisponivel(compra: Compra) {
    const userName = this.userService.getUser().name;
    this.userService.getUserById(compra.purchaserId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        if (user.name === userName) {
          compra.showPaymentButton = false
        } else {
          compra.showPaymentButton = compra.payers.includes(this.userService.getUser().name);
        }
      }
    })
  }

  calculaValorUnitario(compra: Compra) {
    compra.unitValue = (compra.value / compra.payers.length)
  }

  formatPagador(compra: Compra) {
    this.userService.getUserById(compra.purchaserId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        compra.purchaserName = user.name
      }
    })
  }

  formatNomesPagadores(compra: Compra) {
    if (compra.payers.length === 1) {
      compra.formatedPayers = compra.payers[0];
      return;
    }
    const listaPagadoresOriginal = [...compra.payers];
    const lastPayer = compra.payers.pop();
    compra.formatedPayers = `${compra.payers.join(', ')} e ${lastPayer}`;
    compra.payers = listaPagadoresOriginal
  }

  formatNomesPagadoresRestantes(compra: Compra) {
    if (compra.remainingPayers.length === 1) {
      compra.formatedRemainingPayers = compra.remainingPayers[0]
      return;
    } else if (compra.remainingPayers.length === 0) {
      compra.formatedRemainingPayers = 'Todos efetuaram o pagamento.'
      return;
    }
    const listaPagadoresRestantesOriginal = [...compra.remainingPayers];
    const lastRemainingPayer = compra.remainingPayers.pop();
    compra.formatedRemainingPayers = `${compra.remainingPayers.join(', ')} e ${lastRemainingPayer}`;
    compra.remainingPayers = listaPagadoresRestantesOriginal
  }

  formatCategoria(compra: Compra) {
    switch (compra.category) {
      case "CLEANING":
        compra.category = "Limpeza"
        break
      case "FOOD":
        compra.category = "Alimento"
        break
      case "UTILITIES":
        compra.category = "Utilitários"
        break
      case "RENT":
        compra.category = "Aluguel"
        break
      case "INTERNET":
        compra.category = "Internet"
        break
      case "ENERGY":
        compra.category = "Energia"
        break
      case "WATER":
        compra.category = "Água"
        break
      case "GAS":
        compra.category = "Gás"
        break
      case "OTHERS":
        compra.category = "Outros"
        break
    }
  }

  deleteCompra(compra: Compra): void {
    const dialogRef = this.dialog.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        itemType: 'a compra',
        title: compra.title,
        valueLabel: this.formatCurrency(compra.value)
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.confirmDeleteCompra(compra.id);
    });
  }

  private confirmDeleteCompra(contaId: string): void {
    this.compraService.deleteCompra(contaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: string) => {
        console.log('Compra deletada com sucesso:', response);
        this.pegarCompras();
      },
      error: (err) => {
        console.error('Erro ao deletar compra', err);
      }
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

}


