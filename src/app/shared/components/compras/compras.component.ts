import {Component, inject, OnInit} from '@angular/core';
import {MatTableModule} from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';

export interface CompraModel {
  title: string;
  category: string;
  purchaseDate: string;
  paymentDate: string;
  value: number;
  payers: string;
  unitValue: number;
  buyer: string;
  payment: string;
  remainingPayers: string;
}

@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [MatTableModule],
})
export class ComprasComponent implements OnInit {

  ngOnInit(): void {
    this.pegarCompras()
  }
  
  displayedColumns: string[] = ['title', 'category', 'purchaseDate', 'paymentDate', 'value', 'payers', 'unitValue', 'buyer', 'payment','remainingPayers'];

  compras: Compra[] = [];

  compraService = inject(CompraService)

  pegarCompras() {
    this.compraService.listarCompras().subscribe({
      next: compras => {
        this.organizarLista(compras)
        this.compras = compras
      }, error: error => {
      }
    })
  }

  organizarLista(compras: Compra[]) {
    compras.forEach(compra => {
      compra.unitValue = (compra.value/compra.payers.length)
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
          compra.category = "Outros"
      }
    })
  }

  pagamento() {
    alert("Botão funfando")
  }
}