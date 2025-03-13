import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormCompraComponent } from '../form-compra/form-compra.component';
import { UserService } from '../../../core/auth/user/user.service';
import { MatCardTitle } from '@angular/material/card';
import { DialogPagamentoComponent } from '../dialog-pagamento/dialog-pagamento.component';

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
  imports: [MatTableModule, CommonModule, MatDialogModule, MatCardTitle],
})
export class ComprasComponent implements OnInit {

  readonly dialog = inject(MatDialog);

  abrirFormCompra() {
    const formRef = this.dialog.open(FormCompraComponent);
    formRef.afterClosed().subscribe(result => {
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
      }).subscribe({
        next: (response) => {
          this.pegarCompras()
          console.log('Compra atualizada com sucesso', response);
        },
        error: (error) => {
          console.error('Erro ao atualizar a compra', error);
        }
      });
      return;
    }
    const dialogRef = this.dialog.open(DialogPagamentoComponent, {
      data: element
    });
    dialogRef.afterClosed().subscribe(result => {
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
    'formatedRemainingPayers'
  ];
  compras: Compra[] = [];
  compraService = inject(CompraService)
  userService = inject(UserService)

  pegarCompras() {
    this.compraService.listarCompras().subscribe({
      next: compras => {
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
    this.userService.getUserById(compra.purchaserId).subscribe({
      next: user => {
        if (user.name === userName){
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
    this.userService.getUserById(compra.purchaserId).subscribe({
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
      case "OTHERS":
        compra.category = "Limpeza"
        break
    }
  }
}