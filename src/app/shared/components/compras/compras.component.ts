import { Component, inject, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';
import { CommonModule } from '@angular/common';
import moment from 'moment';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormCompraComponent } from '../form-compra/form-compra.component';
import { UserService } from '../../../core/auth/user/user.service';

export interface CompraModel {
  title: string;
  category: string;
  purchaseDate: Date;
  paymentDate: Date;
  value: number;
  formatedPayers: string;
  unitValue: number;
  purchaserId: string;
  payment: string;
  formatedRemainingPayers: string;
  showPaymentButton: boolean;
}

@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [MatTableModule, CommonModule, MatDialogModule],
})
export class ComprasComponent implements OnInit {

  readonly dialog = inject(MatDialog);
  
    openDialog() {
      const dialogRef = this.dialog.open(FormCompraComponent);
  
      dialogRef.afterClosed().subscribe(result => {
        console.log(`Dialog result: ${result}`);
      });
    }

  ngOnInit(): void {
    this.pegarCompras()
  }

  displayedColumns: string[] = ['title', 'category', 'purchaseDate', 'paymentDate', 'value', 'formatedPayers', 'unitValue', 'purchaserId', 'payment', 'formatedRemainingPayers'];

  compras: Compra[] = [];

  status: boolean = false;
  compraService = inject(CompraService)
  userService = inject(UserService)

  pegarCompras() {
    this.compraService.listarCompras().subscribe({
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
      this.pagamentoDisponivel(compra)
      this.formatCategoria(compra)
      this.calculaValorUnitario(compra)
      this.formatNomes(compra)
      this.formatPagador(compra)
      this.formatData(compra)
    })
  }

  pagamentoDisponivel(compra: Compra) {
    compra.showPaymentButton = compra.payers.includes(this.userService.getUser().name);
  }

  calculaValorUnitario(compra: Compra) {
    compra.unitValue = (compra.value / compra.payers.length)
  }

  formatPagador(compra: Compra) {
    this.userService.getUserById(compra.purchaserId).subscribe({
      next: user => {
        compra.purchaserId = user.name
      }
    })
  }

  formatData(compra: Compra) {
    compra.purchaseDate = moment(compra.purchaseDate).format('DD/MM/YYYY');
    compra.paymentDate = moment(compra.paymentDate).format('DD/MM/YYYY');
  }

  formatNomes(compra: Compra) {
    if (compra.payers.length === 1) {
      compra.formatedPayers = compra.payers[0];
    }
    const lastPayer = compra.payers.pop();
    compra.formatedPayers = `${compra.payers.join(', ')} e ${lastPayer}`;
    if (compra.remainingPayers.length === 1){
      compra.formatedRemainingPayers = compra.remainingPayers[1]
    }
    const lastRemainingPayer = compra.remainingPayers.pop()
    compra.formatedRemainingPayers = `${compra.payers.join(', ')} e ${lastPayer}`;
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