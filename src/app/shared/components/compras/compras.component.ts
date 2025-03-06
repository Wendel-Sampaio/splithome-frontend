import {Component, inject} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';

export interface PeriodicElement {
  title: string;
  category: string;
  dateOfPurchase: string;
  paymentDate: string;
  value: string;
  payers: string;
  unitValue: string;
  buyer: string;
  payment: string;
  remainingPayers: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    title: "Detergente", 
    category: 'Limpeza', 
    dateOfPurchase: "03/03/2025", 
    paymentDate: '03/04/2025', 
    value: 'R$20,00',
    payers: '2',
    unitValue: 'R$20,00',
    buyer: 'Wendel',
    payment: 'pago',
    remainingPayers: 'Natan',
  },
];

@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [MatTableModule],
})
export class ComprasComponent {
  
  displayedColumns: string[] = ['title', 'category', 'dateOfPurchase', 'paymentDate', 'value', 'payers', 'unitValue', 'buyer', 'payment','remainingPayers'];

  compras!: Compra[];

  compraService = inject(CompraService)

  pegarCompras() {
    this.compraService.listarCompras().subscribe({
      next: compras => {
        this.compras = compras
      }, error: error => {
        alert("Algo deu errado")
      }
    })
  
  }
}