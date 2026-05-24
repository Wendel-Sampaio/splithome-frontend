import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormTransacaoComponent } from '../form-transacao/form-transacao.component';
import { UserService } from '../../../core/auth/user/user.service';
import { MatCardTitle } from '@angular/material/card';
import { DialogPagamentoComponent } from '../dialog-pagamento/dialog-pagamento.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from '../confirm-delete/confirm-delete.component';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification/notification.service';
import { PagadoresPipe } from '../../pipes/pagadores.pipe';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { PlanService } from '../../../core/plan/plan.service';

@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [
    MatTableModule,
    CommonModule,
    MatDialogModule,
    MatCardTitle,
    MatIconModule,
    MatButtonModule,
    PagadoresPipe,
    CategoriaPipe,
    MatProgressSpinnerModule
  ],
})
export class ComprasComponent {
  private destroyRef = inject(DestroyRef);
  readonly dialog = inject(MatDialog);
  compraService = inject(CompraService);
  userService = inject(UserService);
  planService = inject(PlanService);
  private notify = inject(NotificationService);
  loadingLista = signal(true);
  loadingAcao = signal(false);
  private readonly recarregarComprasSubject = new BehaviorSubject<void>(undefined);
  readonly compras$ = this.recarregarComprasSubject.pipe(
    switchMap(() => {
      this.loadingLista.set(true);
      return this.compraService.listarCompras().pipe(
        switchMap(compras => this.tratamentoLista(compras)),
        tap(() => this.loadingLista.set(false)),
        catchError(() => {
          this.loadingLista.set(false);
          this.notify.error('Não foi possível carregar as compras.');
          return of([]);
        })
      );
    })
  );

  abrirFormCompra() {
    const formRef = this.dialog.open(FormTransacaoComponent, {
      width: '550px',
    });
    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.recarregarCompras();
    });
  }

  editarCompra(compra: Compra): void {
    const formRef = this.dialog.open(FormTransacaoComponent, {
      width: '550px',
      data: {
        tipo: 'compra',
        compra: {
          ...compra,
          payers: [...compra.payers],
          remainingPayers: [...compra.remainingPayers]
        }
      }
    });

    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.recarregarCompras();
    });
  }

  efetuarPagamento(element: any) {
    if (!this.verificaUserRemainingPayers(element)) {
      const userName = this.userService.getUser().name;
      element.remainingPayers.push(userName)
      element.isPaid = false;
      this.loadingAcao.set(true);
      this.compraService.atualizarCompra({
        id: element.id,
        remainingPayers: element.remainingPayers
      }).pipe(
        tap({ complete: () => this.loadingAcao.set(false), error: () => this.loadingAcao.set(false) }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.notify.success('Pagamento registrado!');
          this.recarregarCompras();
        },
        error: () => {
          this.notify.error('Não foi possível registrar o pagamento.');
        }
      });
      return;
    }
    const dialogRef = this.dialog.open(DialogPagamentoComponent, {
      data: element
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.recarregarCompras();
      console.log(`Dialog result: ${result}`);
    });
  }

  private readonly premiumColumns: string[] = [
    'title',
    'category',
    'purchaseDate',
    'paymentDate',
    'value',
    'payers',
    'unitValue',
    'purchaserName',
    'payment',
    'remainingPayers',
    'actions'
  ];

  private readonly freeColumns: string[] = [
    'title',
    'category',
    'purchaseDate',
    'paymentDate',
    'value',
    'purchaserName',
    'actions'
  ];

  get isPremium(): boolean {
    return this.planService.isPremium();
  }

  get displayedColumns(): string[] {
    return this.isPremium ? this.premiumColumns : this.freeColumns;
  }

  recarregarCompras() {
    this.recarregarComprasSubject.next();
  }

  tratamentoLista(compras: Compra[]): Observable<Compra[]> {
    if (!compras.length) {
      return of([]);
    }

    return forkJoin(compras.map(compra => this.prepararCompra(compra)));
  }

  isLastCompra(compra: Compra, compras: Compra[]): boolean {
    return compras[compras.length - 1] === compra;
  }

  verificaUserRemainingPayers(compra: Compra): boolean {
    const userName = this.userService.getUser().name;
    return (compra.remainingPayers ?? []).includes(userName);
  }

  verificarPagamento(element: Compra): boolean {
    if (element.purchaserId === this.userService.getUser().id) {
      if ((element.remainingPayers ?? []).length !== 0) {
        return element.isPaid = false;
      }
    }
    return element.isPaid;
  }

  deleteCompra(compra: Compra): void {
    const dialogRef = this.dialog.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      data: {
        itemType: 'a compra',
        title: compra.title,
        valueLabel: this.formatCurrency(compra.value)
      }
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.confirmDeleteCompra(compra.id);
    });
  }

  private confirmDeleteCompra(contaId: string): void {
    this.compraService.deleteCompra(contaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.success('Compra excluída!');
        this.recarregarCompras();
      },
      error: () => {
        this.notify.error('Não foi possível excluir a compra.');
      }
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private prepararCompra(compra: Compra): Observable<Compra> {
    const currentUser = this.userService.getUser();
    const userName = currentUser.name;
    const isNotPurchaser = compra.purchaserId !== currentUser.id;
    const payers = compra.payers ?? [];
    const remainingPayers = compra.remainingPayers ?? [];
    const unitValue = payers.length ? compra.value / payers.length : 0;
    const compraNormalizada = { ...compra, payers, remainingPayers };

    return this.userService.getUserById(compra.purchaserId).pipe(
      map(user => ({
        ...compraNormalizada,
        unitValue,
        purchaserName: user.name,
        showPaymentButton: isNotPurchaser && payers.includes(userName),
        isPaid: !this.verificaUserRemainingPayers(compraNormalizada)
      })),
      catchError(() => of({
        ...compraNormalizada,
        unitValue,
        purchaserName: '',
        showPaymentButton: isNotPurchaser && payers.includes(userName),
        isPaid: !this.verificaUserRemainingPayers(compraNormalizada)
      }))
    );
  }

}
