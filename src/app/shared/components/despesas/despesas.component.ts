import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardTitle } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap } from "rxjs";
import { UserService } from "../../../core/auth/user/user.service";
import { Despesa } from "../../../core/models/despesa/despesa";
import { CompraService } from "../../services/compra/compra.service";
import { CategoriaPipe } from "../../pipes/categoria.pipe";
import { PagadoresPipe } from "../../pipes/pagadores.pipe";
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from "../confirm-delete/confirm-delete.component";
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
    MatCardTitle,
    CategoriaPipe,
    PagadoresPipe
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent {
  readonly dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  despesaService = inject(CompraService);
  userService = inject(UserService);
  private readonly recarregarDespesasSubject = new BehaviorSubject<void>(undefined);
  readonly despesas$ = this.recarregarDespesasSubject.pipe(
    switchMap(() => this.despesaService.listarDespesas().pipe(
      switchMap(despesas => this.tratamentoLista(despesas)),
      catchError(() => {
        console.log("Erro ao carregar lista de despesas!");
        return of([]);
      })
    ))
  );

  displayedColumns: string[] = [
    'title',
    'category',
    'paymentDate',
    'value',
    'payers',
    'unitValue',
    'responsibleName',
    'payment',
    'remainingPayers',
    'actions'
  ];

  abrirFormDespesa(): void {
    const formRef = this.dialog.open(FormTransacaoComponent, {
      width: '550px',
      data: { tipo: 'despesa' }
    });
    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.recarregarDespesas();
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
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.recarregarDespesas(),
      });
      return;
    }

    const dialogRef = this.dialog.open(DialogPagamentoComponent, {
      data: { ...element, tipo: 'despesa' }
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.recarregarDespesas();
      console.log(`Dialog result: ${result}`);
    });
  }

  recarregarDespesas(): void {
    this.recarregarDespesasSubject.next();
  }

  tratamentoLista(despesas: Despesa[]): Observable<Despesa[]> {
    if (!despesas.length) {
      return of([]);
    }

    return forkJoin(despesas.map(despesa => this.prepararDespesa(despesa)));
  }

  isLastDespesa(despesa: Despesa, despesas: Despesa[]): boolean {
    return despesas[despesas.length - 1] === despesa;
  }

  verificaUserRemainingPayers(despesa: Despesa): boolean {
    const userName = this.userService.getUser().name;
    return (despesa.remainingPayers ?? []).includes(userName);
  }

  verificarPagamento(element: Despesa): boolean {
    if (element.responsibleId === this.userService.getUser().id && (element.remainingPayers ?? []).length !== 0) {
      return element.isPaid = false;
    }
    return element.isPaid;
  }

  deleteDespesa(despesa: Despesa): void {
    const dialogRef = this.dialog.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        itemType: 'a despesa',
        title: despesa.title,
        valueLabel: this.formatCurrency(despesa.value)
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.confirmDeleteDespesa(despesa.id);
    });
  }

  private confirmDeleteDespesa(contaId: string): void {
    this.despesaService.deleteDespesa(contaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: string) => {
        console.log('Despesa deletada com sucesso:', response);
        this.recarregarDespesas();
      },
      error: (err) => {
        console.error('Erro ao deletar despesa', err);
      }
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private prepararDespesa(despesa: Despesa): Observable<Despesa> {
    const currentUser = this.userService.getUser();
    const userName = currentUser.name;
    const isNotResponsible = despesa.responsibleId !== currentUser.id;
    const payers = despesa.payers ?? [];
    const remainingPayers = despesa.remainingPayers ?? [];
    const unitValue = payers.length ? despesa.value / payers.length : 0;
    const despesaNormalizada = { ...despesa, payers, remainingPayers };

    return this.userService.getUserById(despesa.responsibleId).pipe(
      map(user => ({
        ...despesaNormalizada,
        unitValue,
        responsibleName: user.name,
        showPaymentButton: isNotResponsible && payers.includes(userName),
        isPaid: !this.verificaUserRemainingPayers(despesaNormalizada)
      })),
      catchError(() => of({
        ...despesaNormalizada,
        unitValue,
        responsibleName: '',
        showPaymentButton: isNotResponsible && payers.includes(userName),
        isPaid: !this.verificaUserRemainingPayers(despesaNormalizada)
      }))
    );
  }
}
