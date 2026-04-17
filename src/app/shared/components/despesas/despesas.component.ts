import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardTitle } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { UserService } from "../../../core/auth/user/user.service";
import { Despesa } from "../../../core/models/despesa/despesa";
import { CompraService } from "../../services/compra/compra.service";
import { DialogPagamentoComponent } from "../dialog-pagamento/dialog-pagamento.component";
import { FormTransacaoComponent } from "../form-transacao/form-transacao.component";

@Component({
  selector: 'tabela-despesas',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardTitle
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  despesaService = inject(CompraService);
  userService = inject(UserService);

  displayedColumns: string[] = [
    'title',
    'category',
    'paymentDate',
    'value',
    'formatedPayers',
    'unitValue',
    'responsibleName',
    'payment',
    'formatedRemainingPayers',
    'actions'
  ];

  despesas: Despesa[] = [];

  ngOnInit(): void {
    this.pegarDespesas();
  }

  abrirFormDespesa(): void {
    const formRef = this.dialog.open(FormTransacaoComponent, {
      width: '550px',
      data: { tipo: 'despesa' }
    });
    formRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.pegarDespesas();
    });
  }

  efetuarPagamento(element: Despesa): void {
    if (!this.verificaUserRemainingPayers(element)) {
      const userName = this.userService.getUser().name;
      element.remainingPayers.push(userName);
      element.isPaid = false;
      this.despesaService.atualizarDespesa({
        id: element.id,
        remainingPayers: element.remainingPayers
      }).subscribe({
        next: () => this.pegarDespesas(),
      });
      return;
    }

    const dialogRef = this.dialog.open(DialogPagamentoComponent, {
      data: { ...element, tipo: 'despesa' }
    });
    dialogRef.afterClosed().subscribe(result => {
      this.pegarDespesas();
      console.log(`Dialog result: ${result}`);
    });
  }

  pegarDespesas(): void {
    this.despesaService.listarDespesas().subscribe({
      next: despesas => {
        this.tratamentoLista(despesas);
        this.despesas = despesas;
      },
      error: () => {
        console.log("Erro ao carregar lista de despesas!");
      }
    });
  }

  tratamentoLista(despesas: Despesa[]): void {
    despesas.forEach(despesa => {
      this.formatPagador(despesa);
      this.pagamentoDisponivel(despesa);
      this.formatCategoria(despesa);
      this.calculaValorUnitario(despesa);
      this.formatNomesPagadores(despesa);
      this.formatNomesPagadoresRestantes(despesa);
      this.verificaUserRemainingPayers(despesa);
      this.mudarStatusDaDespesa(despesa);
    });
  }

  mudarStatusDaDespesa(despesa: Despesa): void {
    despesa.isPaid = !this.verificaUserRemainingPayers(despesa);
  }

  isLastDespesa(despesa: Despesa): boolean {
    return this.despesas[this.despesas.length - 1] === despesa;
  }

  verificaUserRemainingPayers(despesa: Despesa): boolean {
    const userName = this.userService.getUser().name;
    return despesa.remainingPayers.includes(userName);
  }

  verificarPagamento(element: Despesa): boolean {
    if (element.responsibleId === this.userService.getUser().id && element.remainingPayers.length !== 0) {
      return element.isPaid = false;
    }
    return element.isPaid;
  }

  pagamentoDisponivel(despesa: Despesa): void {
    const userName = this.userService.getUser().name;
    this.userService.getUserById(despesa.responsibleId).subscribe({
      next: user => {
        if (user.name === userName) {
          despesa.showPaymentButton = false;
        } else {
          despesa.showPaymentButton = despesa.payers.includes(userName);
        }
      }
    });
  }

  calculaValorUnitario(despesa: Despesa): void {
    despesa.unitValue = despesa.value / despesa.payers.length;
  }

  formatPagador(despesa: Despesa): void {
    this.userService.getUserById(despesa.responsibleId).subscribe({
      next: user => {
        despesa.responsibleName = user.name;
      }
    });
  }

  formatNomesPagadores(despesa: Despesa): void {
    if (despesa.payers.length === 1) {
      despesa.formatedPayers = despesa.payers[0];
      return;
    }
    const listaPagadoresOriginal = [...despesa.payers];
    const lastPayer = despesa.payers.pop();
    despesa.formatedPayers = `${despesa.payers.join(', ')} e ${lastPayer}`;
    despesa.payers = listaPagadoresOriginal;
  }

  formatNomesPagadoresRestantes(despesa: Despesa): void {
    if (despesa.remainingPayers.length === 1) {
      despesa.formatedRemainingPayers = despesa.remainingPayers[0];
      return;
    }

    if (despesa.remainingPayers.length === 0) {
      despesa.formatedRemainingPayers = 'Todos efetuaram o pagamento.';
      return;
    }

    const listaPagadoresRestantesOriginal = [...despesa.remainingPayers];
    const lastRemainingPayer = despesa.remainingPayers.pop();
    despesa.formatedRemainingPayers = `${despesa.remainingPayers.join(', ')} e ${lastRemainingPayer}`;
    despesa.remainingPayers = listaPagadoresRestantesOriginal;
  }

  formatCategoria(despesa: Despesa): void {
    switch (despesa.category) {
      case "CLEANING":
        despesa.category = "Limpeza";
        break;
      case "FOOD":
        despesa.category = "Alimento";
        break;
      case "UTILITIES":
        despesa.category = "Utilitarios";
        break;
      case "RENT":
        despesa.category = "Aluguel";
        break;
      case "INTERNET":
        despesa.category = "Internet";
        break;
      case "ENERGY":
        despesa.category = "Energia";
        break;
      case "WATER":
        despesa.category = "Agua";
        break;
      case "GAS":
        despesa.category = "Gas";
        break;
      case "OTHERS":
        despesa.category = "Outros";
        break;
    }
  }

  deleteDespesa(contaId: string): void {
    this.despesaService.deleteDespesa(contaId).subscribe({
      next: (response: string) => {
        console.log('Despesa deletada com sucesso:', response);
        this.pegarDespesas();
      },
      error: (err) => {
        console.error('Erro ao deletar despesa', err);
      }
    });
  }
}
