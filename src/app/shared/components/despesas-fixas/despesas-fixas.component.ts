import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompraService } from '../../services/compra/compra.service';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { NotificationService } from '../../services/notification/notification.service';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from '../confirm-delete/confirm-delete.component';
import { FormTransacaoComponent } from '../form-transacao/form-transacao.component';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { BehaviorSubject, catchError, finalize, of, switchMap, tap } from 'rxjs';
import { ModalService } from '../ui/modal';

@Component({
  selector: 'tabela-despesas-fixas',
  styleUrl: './despesas-fixas.component.scss',
  templateUrl: './despesas-fixas.component.html',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatTooltipModule,
    CategoriaPipe
  ]
})
export class DespesasFixasComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private modal = inject(ModalService);
  readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly userStateService = inject(UserStateService);
  readonly compraService = inject(CompraService);

  loadingLista = signal(true);
  loadingAcao = signal(false);
  pageSize = 10;
  pageIndex = 0;
  totalElements = 0;
  despesas: DespesaFixa[] = [];

  displayedColumns: string[] = [
    'title',
    'category',
    'totalValue',
    'installmentsCount',
    'dueDay',
    'startDate',
    'responsibleName',
    'actions'
  ];

  private readonly recarregarSubject = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    this.recarregarSubject.pipe(
      switchMap(() => {
        this.loadingLista.set(true);
        return this.compraService.listarDespesasFixas({
          page: this.pageIndex,
          size: this.pageSize,
          sort: 'createdAt,desc'
        }).pipe(
          switchMap(page => this.tratamentoLista(page.content)),
          tap(despesas => {
            this.despesas = despesas;
            this.totalElements = despesas.length;
            this.loadingLista.set(false);
          }),
          catchError(() => {
            this.loadingLista.set(false);
            this.notify.error('Não foi possível carregar as despesas fixas.');
            return of([]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.recarregar();
  }

  recarregar(): void {
    this.recarregarSubject.next();
  }

  private tratamentoLista(despesas: DespesaFixa[]): import("rxjs").Observable<DespesaFixa[]> {
    if (!despesas.length) {
      return of([]);
    }
    return this.userStateService.getFamilyUsers().pipe(
      switchMap(users => {
        const map = new Map<string, string>(users.map(u => [u.id, u.name]));
        const currentUser = this.userService.getUser();
        map.set(currentUser.id, currentUser.name);
        return of(despesas.map(d => this.prepararDespesa(d, map)));
      }),
      catchError(() => of(despesas.map(d => this.prepararDespesa(d, new Map()))))
    );
  }

  private prepararDespesa(despesa: DespesaFixa, usersById: Map<string, string>): DespesaFixa {
    const currentUser = this.userService.getUser();
    const isNotResponsible = despesa.responsibleId !== currentUser.id;
    const payers = despesa.payers ?? [];
    const remainingPayers = despesa.remainingPayers ?? [];
    const responsibleName = usersById.get(despesa.responsibleId)
      ?? (despesa.responsibleId === currentUser.id ? currentUser.name : '');
    return {
      ...despesa,
      responsibleName,
      showPaymentButton: isNotResponsible && payers.includes(currentUser.name),
      isPaid: !(remainingPayers ?? []).includes(currentUser.name)
    };
  }

  abrirForm(): void {
    const ref = this.modal.open(FormTransacaoComponent, {
      size: 'lg',
      disableClose: true,
      data: { tipo: 'despesa-fixa' }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.recarregar();
      }
    });
  }

  editar(despesa: DespesaFixa): void {
    const ref = this.modal.open(FormTransacaoComponent, {
      size: 'lg',
      disableClose: true,
      data: {
        tipo: 'despesa-fixa',
        despesaFixa: { ...despesa }
      }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.recarregar();
      }
    });
  }

  pagarParcela(parcelaId: string): void {
    this.loadingAcao.set(true);
    this.compraService.pagarParcela(parcelaId).pipe(
      finalize(() => this.loadingAcao.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Parcela paga!');
        this.recarregar();
      },
      error: () => this.notify.error('Não foi possível pagar a parcela.')
    });
  }

  verificaParcelaPagaPorMim(parcela: import("../../../core/models/parcela/parcela").Parcela): boolean {
    const userName = this.userService.getUser().name;
    return (parcela.remainingPayers ?? []).includes(userName);
  }

  delete(despesa: DespesaFixa): void {
    const ref = this.modal.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      size: 'sm',
      data: {
        itemType: 'a despesa fixa',
        title: despesa.title,
        valueLabel: this.formatCurrency(despesa.valorTotal)
      }
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (confirmed) {
        this.confirmDelete(despesa.id);
      }
    });
  }

  private confirmDelete(id: string): void {
    this.compraService.excluirDespesaFixa(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.success('Despesa fixa excluída!');
        this.recarregar();
      },
      error: () => this.notify.error('Não foi possível excluir a despesa fixa.')
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: string): string {
    if (!date) {
      return '';
    }
    const [y, m, d] = date.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
}
