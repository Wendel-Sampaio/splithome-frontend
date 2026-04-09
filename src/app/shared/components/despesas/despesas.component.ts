import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule, MatCardTitle } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Despesa } from '../../../core/models/despesa/despesa';
import { FormDespesaComponent } from '../form-despesa/form-despesa.component';
import { TransacaoService } from '../../services/transacao/transacao.service';

@Component({
  selector: 'app-despesas',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatCardTitle,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  transacaoService = inject(TransacaoService);

  despesas: Despesa[] = [];
  displayedColumns: string[] = ['title', 'category', 'expenseDate', 'value'];

  ngOnInit(): void {
    this.pegarDespesas();
  }

  pegarDespesas() {
    this.transacaoService.listarDespesas().subscribe({
      next: despesas => {
        this.despesas = despesas;
      },
      error: () => {
        console.log('Erro ao carregar lista de despesas!');
      }
    });
  }

  abrirFormDespesa() {
    const dialogRef = this.dialog.open(FormDespesaComponent, {
      width: '550px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.pegarDespesas();
    });
  }
}
