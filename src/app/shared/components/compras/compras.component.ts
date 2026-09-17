import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { CompraService } from '../../services/compra/compra.service';
import { Compra } from '../../../core/models/compra/compra';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormTransacaoComponent } from '../form-transacao/form-transacao.component';
import { UserService } from '../../../core/auth/user/user.service';
import { DialogPagamentoComponent } from '../dialog-pagamento/dialog-pagamento.component';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from '../confirm-delete/confirm-delete.component';
import { BehaviorSubject, catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification/notification.service';
import { PagadoresPipe } from '../../pipes/pagadores.pipe';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { CategoriaIconePipe } from '../../pipes/categoria-icone.pipe';
import { CategoriaCorPipe } from '../../pipes/categoria-cor.pipe';
import { PlanService } from '../../../core/plan/plan.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { parseOfxExpenses } from '../../services/ofx/ofx-parser';
import { forkJoin } from 'rxjs';
import { ModalService } from '../ui/modal';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompraDetalheComponent, CompraDetalheDialogData } from '../compra-detalhe/compra-detalhe.component';

interface Purchaser {
  id: string;
  name: string;
}

@Component({
  selector: 'tabela-compras',
  styleUrl: 'compras.component.scss',
  templateUrl: 'compras.component.html',
  imports: [
    MatTableModule,
    CommonModule,
    MatDialogModule,
    MatIconModule,
    PagadoresPipe,
    CategoriaPipe,
    CategoriaIconePipe,
    CategoriaCorPipe,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule
  ],
})
export class ComprasComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private modal = inject(ModalService);
  readonly dialog = inject(MatDialog);
  compraService = inject(CompraService);
  userService = inject(UserService);
  planService = inject(PlanService);
  userStateService = inject(UserStateService);
  transacaoService = inject(TransacaoService);
  private notify = inject(NotificationService);

  loadingLista = signal(true);
  loadingAcao = signal(false);

  pageSize = 10;
  pageIndex = 0;
  totalElements = 0;
  sortField = 'purchaseDate';
  sortDirection = 'desc';
  categories: string[] = [];
  purchasers: Purchaser[] = [];

  filterForm = this.fb.group({
    title: [''],
    category: [null as string | null],
    purchaserId: [null as string | null],
    startDate: [null as Date | null],
    endDate: [null as Date | null],
  });

  private readonly recarregarComprasSubject = new BehaviorSubject<void>(undefined);

  readonly compras$: Observable<Compra[]> = this.recarregarComprasSubject.pipe(
    switchMap(() => {
      this.loadingLista.set(true);
      const f = this.filterForm.value;
      return this.compraService.listarCompras({
        title: f.title || undefined,
        category: f.category || undefined,
        purchaserId: f.purchaserId || undefined,
        startDate: f.startDate ? this.formatDate(f.startDate) : undefined,
        endDate: f.endDate ? this.formatDate(f.endDate) : undefined,
        page: this.pageIndex,
        size: this.pageSize,
        sort: `${this.sortField},${this.sortDirection}`,
      }).pipe(
        switchMap(page => {
          this.totalElements = page.totalElements;
          return this.tratamentoLista(page.content);
        }),
        tap(compras => {
          this.purchasers = this.extractUniquePurchasers(compras);
          this.loadingLista.set(false);
        }),
        catchError(() => {
          this.loadingLista.set(false);
          this.notify.error('Não foi possível carregar as compras.');
          return of([]);
        })
      );
    })
  );

  ngOnInit(): void {
    this.transacaoService.listarCategorias().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cats => this.categories = cats);

    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.pageIndex = 0;
      this.recarregarCompras();
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.recarregarCompras();
  }

  onSortChange(sort: Sort): void {
    this.sortField = sort.active || 'purchaseDate';
    this.sortDirection = sort.direction || 'desc';
    this.pageIndex = 0;
    this.recarregarCompras();
  }

  abrirFormCompra() {
    const formRef = this.modal.open(FormTransacaoComponent, {
      size: 'lg',
      disableClose: true,
    });
    formRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      console.log(`Dialog result: ${result}`);
      this.recarregarCompras();
    });
  }

  editarCompra(compra: Compra): void {
    const formRef = this.modal.open(FormTransacaoComponent, {
      size: 'lg',
      disableClose: true,
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

  abrirDetalheCompra(compra: Compra): void {
    this.modal.open<CompraDetalheComponent, CompraDetalheDialogData>(CompraDetalheComponent, {
      size: 'xl',
      data: {
        compra,
        isPremium: this.isPremium
      }
    });
  }

  efetuarPagamento(element: Compra) {
    if (!this.verificaUserRemainingPayers(element)) {
      const user = this.userService.getUser();
      element.remainingPayers.push(user.id)
      element.isPaid = false;
      this.loadingAcao.set(true);
      this.compraService.atualizarCompra({
        ...element,
        remainingPayers: element.remainingPayers
      }).pipe(
        finalize(() => this.loadingAcao.set(false)),
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
    const dialogRef = this.modal.open(DialogPagamentoComponent, {
      size: 'sm',
      data: element
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.recarregarCompras();
      console.log(`Dialog result: ${result}`);
    });
  }

  importarOfxHandler(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.ofx')) {
      this.notify.error('Selecione um arquivo OFX válido.');
      return;
    }

    this.loadingAcao.set(true);
    this.lerArquivo(file).pipe(
      switchMap(content => {
        const items = parseOfxExpenses(content);
        if (!items.length) {
          this.notify.info('Nenhuma despesa encontrada no arquivo OFX.');
          this.loadingAcao.set(false);
          return of([]);
        }
        return forkJoin(items.map(item => this.compraService.cadastrarCompra(this.criarPayloadOfx(item))));
      }),
      finalize(() => this.loadingAcao.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (criadas: any[]) => {
        if (criadas.length) {
          this.notify.success(`${criadas.length} compra(s) importada(s) com sucesso!`);
          this.recarregarCompras();
        }
      },
      error: () => this.notify.error('Não foi possível importar o arquivo OFX.')
    });
  }

  private criarPayloadOfx(item: { title: string; value: number; paymentDate: string }): Record<string, unknown> {
    const user = this.userService.getUser();
    return {
      title: item.title,
      category: 'OTHERS',
      value: item.value,
      paymentDate: item.paymentDate,
      purchaserId: user.id,
      purchaseDate: item.paymentDate,
      payers: [user.id],
      remainingPayers: []
    };
  }

  private lerArquivo(file: File): Observable<string> {
    return new Observable<string>(observer => {
      const reader = new FileReader();
      reader.onload = () => {
        observer.next(String(reader.result ?? ''));
        observer.complete();
      };
      reader.onerror = () => observer.error(reader.error);
      reader.readAsText(file);
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

  get hasActiveFilters(): boolean {
    const f = this.filterForm.value;
    return Boolean(f.title || f.category || f.purchaserId || f.startDate || f.endDate);
  }

  recarregarCompras() {
    this.recarregarComprasSubject.next();
  }

  limparFiltros(): void {
    this.filterForm.reset({
      title: '',
      category: null,
      purchaserId: null,
      startDate: null,
      endDate: null,
    });
  }

  tratamentoLista(compras: Compra[]): Observable<Compra[]> {
    if (!compras.length) {
      return of([]);
    }

    if (!this.isPremium) {
      const usersById = new Map<string, string>();
      return of(compras.map((compra) => this.prepararCompra(compra, usersById)));
    }

    return this.userStateService.getFamilyUsers().pipe(
      map((users) => {
        const usersById = new Map<string, string>(users.map((user) => [user.id, user.name]));
        const currentUser = this.userService.getUser();
        if (currentUser.id) {
          usersById.set(currentUser.id, currentUser.name);
        }

        return compras.map((compra) => this.prepararCompra(compra, usersById));
      })
    );
  }

  isLastCompra(compra: Compra, compras: Compra[]): boolean {
    return compras[compras.length - 1] === compra;
  }

  verificaUserRemainingPayers(compra: Compra): boolean {
    const user = this.userService.getUser();
    return (compra.remainingPayers ?? []).includes(user.id)
      || (compra.remainingPayers ?? []).includes(user.name);
  }

  verificarPagamento(element: Compra): boolean {
    return element.isPaid;
  }

  deleteCompra(compra: Compra): void {
    const dialogRef = this.modal.open<ConfirmDeleteComponent, ConfirmDeleteDialogData, boolean>(ConfirmDeleteComponent, {
      size: 'sm',
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

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private extractUniquePurchasers(compras: Compra[]): Purchaser[] {
    const seen = new Set<string>();
    const result: Purchaser[] = [];
    for (const c of compras) {
      if (c.purchaserId && c.purchaserName && !seen.has(c.purchaserId)) {
        seen.add(c.purchaserId);
        result.push({ id: c.purchaserId, name: c.purchaserName });
      }
    }
    return result;
  }

  private prepararCompra(compra: Compra, usersById: Map<string, string>): Compra {
    const currentUser = this.userService.getUser();
    const payers = compra.payers ?? [];
    const unitValue = payers.length ? compra.value / payers.length : 0;
    const purchaserName = usersById.get(compra.purchaserId) ?? (compra.purchaserId === currentUser.id ? currentUser.name : '');
    const remainingPayers = compra.remainingPayers ?? [];
    const compraNormalizada = { ...compra, payers, remainingPayers };
    const payerNames = this.displayNamesFor(payers, usersById);
    const remainingPayerNames = this.displayNamesFor(remainingPayers, usersById);

    return {
      ...compraNormalizada,
      unitValue,
      purchaserName,
      payerNames,
      remainingPayerNames,
      showPaymentButton: payers.includes(currentUser.id) || payers.includes(currentUser.name),
      isPaid: !this.verificaUserRemainingPayers(compraNormalizada)
    };
  }

  private displayNamesFor(references: string[], usersById: Map<string, string>): string[] {
    return references.map((reference) => usersById.get(reference) ?? reference);
  }
}
