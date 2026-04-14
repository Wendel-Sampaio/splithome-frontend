import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule, MatCardTitle } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { FormCompraComponent } from "../form-compra/form-compra.component";

interface DespesaTabela {
  id: string;
  descricao: string;
  categoria: string;
  dataVencimento: Date;
  valor: number;
  status: 'Pendente' | 'Pago';
}

@Component({
  selector: 'tabela-despesas',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent implements OnInit {
  displayedColumns: string[] = ['titulo', 'descricao', 'categoria', 'dataVencimento', 'valor', 'status', 'acoes'];
  despesas: DespesaTabela[] = [];

  ngOnInit(): void {
    this.carregarDespesas();
  }

  carregarDespesas(): void {
    this.despesas = [
      {
        id: '1',
        descricao: 'Conta de luz',
        categoria: 'Utilidades',
        dataVencimento: new Date(),
        valor: 180.5,
        status: 'Pendente'
      }
    ];
  }

  abrirFormDespesa(): void {
    // TODO: integrar modal/formulário de cadastro de despesas.
  }

  verificarPagamento(): void {
    //TODO
  }

  isLastDespesa(): void {
    //TODO 
  }

  marcarComoPago(_despesa: DespesaTabela): void {
    // TODO: integrar atualização da despesa no backend.
  }

  removerDespesa(_despesa: DespesaTabela): void {
    // TODO: integrar remoção da despesa no backend.
  }
  
}