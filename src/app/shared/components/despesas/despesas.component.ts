import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardTitle } from "@angular/material/card";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, switchMap, tap } from "rxjs";
import { NotificationService } from "../../services/notification/notification.service";
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
    MatProgressSpinnerModule,
    CategoriaPipe,
    PagadoresPipe
  ],
  templateUrl: './despesas.component.html',
  styleUrl: './despesas.component.scss'
})
export class DespesasComponent {
  readonly dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private notify = inject(NotificationService);
  despesaService = inject(CompraService);
  userService = inject(UserService);
  loadingLista = signal(true);
  loadingAcao = signal(false);
  private readonly recarregarDespesasSubject = new BehaviorSubject<void>(undefined);
  readonly despesas$ = this.recarregarDespesasSubject.pipe(
    switchMap(() => {
      this.loadingLista.set(true);
      return this.despesaService.listarDespesas().pipe(
        switchMap(despesas => this.tratamentoLista(despesas)),
        tap(() => this.loadingLista.set(false)),
        catchError(() => {
          this.loadingLista.set(false);
          this.notify.error('Não foi possível carregar as despesas.');
          return of([]);
        })
      );
    })
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
      this.loadingAcao.set(true);
      this.despesaService.atualizarDespesa({
        id: element.id,
        remainingPayers: element.remainingPayers
      }).pipe(
        finalize(() => this.loadingAcao.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.notify.success('Pagamento registrado!');
          this.recarregarDespesas();
        },
        error: () => {
          this.notify.error('Não foi possível registrar o pagamento.');
        }
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
      next: () => {
        this.notify.success('Despesa excluída!');
        this.recarregarDespesas();
      },
      error: () => {
        this.notify.error('Não foi possível excluir a despesa.');
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
