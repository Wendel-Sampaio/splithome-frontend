import {Component, ViewEncapsulation} from '@angular/core';
import {MatTableModule} from '@angular/material/table';

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

/**
 * @title Basic use of `<table mat-table>`
 */
@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [MatTableModule],
})
export class ComprasComponent {
  displayedColumns: string[] = ['title', 'category', 'dateOfPurchase', 'paymentDate', 'value', 'payers', 'unitValue', 'buyer', 'payment','remainingPayers'];
  dataSource = ELEMENT_DATA;
}
