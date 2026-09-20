import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompraService } from '../../services/compra/compra.service';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { Parcela } from '../../../core/models/parcela/parcela';
import { NotificationService } from '../../services/notification/notification.service';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { ConfirmDeleteComponent, ConfirmDeleteDialogData } from '../confirm-delete/confirm-delete.component';
import { FormTransacaoComponent } from '../form-transacao/form-transacao.component';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { CategoriaIconePipe } from '../../pipes/categoria-icone.pipe';
import { CategoriaCorPipe } from '../../pipes/categoria-cor.pipe';
import { PagadoresPipe } from '../../pipes/pagadores.pipe';
import { BehaviorSubject, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ModalService } from '../ui/modal';

@Component({
  selector: 'tabela-despesas-fixas',
  styleUrl: './despesas-fixas.component.scss',
  templateUrl: './despesas-fixas.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatTooltipModule,
    CategoriaPipe,
    CategoriaIconePipe,
    CategoriaCorPipe,
    PagadoresPipe
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
  pageSize = 20;
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

  private readonly selecionadas = new Set<string>();

  private readonly recarregarSubject = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    this.recarregarSubject.pipe(
      switchMap(() => {
        this.loadingLista.set(true);
        this.selecionadas.clear();
        return this.compraService.listarDespesasFixas({
          page: this.pageIndex,
          size: this.pageSize,
          sort: 'createdAt,desc'
        }).pipe(
          tap(page => {
            this.totalElements = page.totalElements;
          }),
          switchMap(page => this.tratamentoLista(page.content)),
          tap(despesas => {
            this.despesas = despesas;
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
      payerNames: this.displayNamesFor(payers, usersById),
      remainingPayerNames: this.displayNamesFor(remainingPayers, usersById),
      parcelas: (despesa.parcelas ?? []).map((parcela) => ({
        ...parcela,
        pagadorNames: this.displayNamesFor(parcela.pagadores ?? [], usersById),
        remainingPayerNames: this.displayNamesFor(parcela.remainingPayers ?? [], usersById)
      })),
      showPaymentButton: isNotResponsible && (payers.includes(currentUser.id) || payers.includes(currentUser.name)),
      isPaid: !(remainingPayers ?? []).includes(currentUser.id) && !(remainingPayers ?? []).includes(currentUser.name)
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

  // Quitar um parcelamento longo clicando parcela a parcela é penoso, então a
  // seleção em lote aparece assim que há mais de uma parcela minha em aberto.
  permiteSelecao(despesa: DespesaFixa): boolean {
    return this.parcelasSelecionaveis(despesa).length > 1;
  }

  parcelasSelecionaveis(despesa: DespesaFixa): Parcela[] {
    return (despesa.parcelas ?? []).filter(parcela => this.verificaParcelaPendenteParaMim(parcela));
  }

  parcelasSelecionadas(despesa: DespesaFixa): Parcela[] {
    return this.parcelasSelecionaveis(despesa).filter(parcela => this.estaSelecionada(parcela));
  }

  estaSelecionada(parcela: Parcela): boolean {
    return this.selecionadas.has(parcela.id);
  }

  alternarSelecao(parcela: Parcela, selecionada: boolean): void {
    if (selecionada) {
      this.selecionadas.add(parcela.id);
      return;
    }

    this.selecionadas.delete(parcela.id);
  }

  todasSelecionadas(despesa: DespesaFixa): boolean {
    const selecionaveis = this.parcelasSelecionaveis(despesa);
    return selecionaveis.length > 0 && selecionaveis.every(parcela => this.estaSelecionada(parcela));
  }

  selecaoParcial(despesa: DespesaFixa): boolean {
    const selecionadas = this.parcelasSelecionadas(despesa).length;
    return selecionadas > 0 && selecionadas < this.parcelasSelecionaveis(despesa).length;
  }

  alternarTodas(despesa: DespesaFixa, selecionar: boolean): void {
    this.parcelasSelecionaveis(despesa).forEach(parcela => this.alternarSelecao(parcela, selecionar));
  }

  valorSelecionado(despesa: DespesaFixa): number {
    return this.parcelasSelecionadas(despesa)
      .reduce((total, parcela) => total + this.valorParcelaPorPessoa(parcela), 0);
  }

  rotuloPagamentoEmLote(despesa: DespesaFixa): string {
    const quantidade = this.parcelasSelecionadas(despesa).length;
    if (!quantidade) {
      return 'Pagar selecionadas';
    }

    const substantivo = quantidade === 1 ? 'parcela' : 'parcelas';
    return `Pagar ${quantidade} ${substantivo} · ${this.formatCurrency(this.valorSelecionado(despesa))}`;
  }

  // O back-end paga uma parcela por requisição; o lote falha por parcela, então
  // cada uma responde por si e o aviso final diz quantas ficaram para trás.
  pagarSelecionadas(despesa: DespesaFixa): void {
    const parcelas = this.parcelasSelecionadas(despesa);
    if (!parcelas.length) {
      return;
    }

    this.loadingAcao.set(true);
    forkJoin(parcelas.map(parcela => this.compraService.pagarParcela(parcela.id).pipe(
      map(() => true),
      catchError(() => of(false))
    ))).pipe(
      finalize(() => this.loadingAcao.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(resultados => {
      const pagas = resultados.filter(Boolean).length;
      const falhas = resultados.length - pagas;

      if (pagas) {
        this.notify.success(pagas === 1 ? 'Parcela paga!' : `${pagas} parcelas pagas!`);
      }
      if (falhas) {
        this.notify.error(falhas === 1
          ? 'Não foi possível pagar 1 das parcelas selecionadas.'
          : `Não foi possível pagar ${falhas} das parcelas selecionadas.`);
      }

      this.recarregar();
    });
  }

  verificaParcelaPendenteParaMim(parcela: import("../../../core/models/parcela/parcela").Parcela): boolean {
    const user = this.userService.getUser();
    return (parcela.remainingPayers ?? []).includes(user.id)
      || (parcela.remainingPayers ?? []).includes(user.name);
  }

  private displayNamesFor(references: string[], usersById: Map<string, string>): string[] {
    return references.map((reference) => usersById.get(reference) ?? reference);
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

  rotuloParcelas(despesa: DespesaFixa): string {
    return despesa.quantidadeParcelas ? `${despesa.quantidadeParcelas}x` : 'Mensal';
  }

  iconeCobranca(despesa: DespesaFixa): string {
    return despesa.quantidadeParcelas ? 'layers' : 'autorenew';
  }

  // O cabeçalho recebe o que nenhum outro campo do card já diz: o andamento do
  // parcelamento, ou desde quando a recorrência corre.
  resumoSecundario(despesa: DespesaFixa): string {
    if (!despesa.quantidadeParcelas) {
      return `Início ${this.formatDate(despesa.dataInicio)}`;
    }
    return `${this.parcelasPagas(despesa)} de ${this.totalParcelas(despesa)} pagas`;
  }

  // A regra, por extenso, para não se confundir com a data da próxima cobrança.
  rotuloVencimento(despesa: DespesaFixa): string {
    return `Todo dia ${despesa.diaVencimento}`;
  }

  temParcelas(despesa: DespesaFixa): boolean {
    return !!despesa.parcelas?.length;
  }

  totalParcelas(despesa: DespesaFixa): number {
    return despesa.parcelas?.length ?? 0;
  }

  parcelasPagas(despesa: DespesaFixa): number {
    return despesa.parcelas?.filter(parcela => parcela.pago).length ?? 0;
  }

  percentualParcelasPagas(despesa: DespesaFixa): number {
    const total = this.totalParcelas(despesa);
    if (!total) {
      return 0;
    }

    return Math.round((this.parcelasPagas(despesa) / total) * 100);
  }

  proximaCobranca(despesa: DespesaFixa): string {
    if (!despesa.parcelas?.length) {
      return '—';
    }

    const proxima = [...despesa.parcelas]
      .sort((a, b) => a.numero - b.numero)
      .find(parcela => !parcela.pago);

    return proxima ? this.formatDate(proxima.dataVencimento) : 'Quitada';
  }

  valorTotalPorPessoa(despesa: DespesaFixa): number {
    return this.valorPorPagador(despesa.valorTotal, despesa.payers);
  }

  valorPorCobranca(despesa: DespesaFixa): number {
    const valor = despesa.quantidadeParcelas
      ? despesa.valorTotal / despesa.quantidadeParcelas
      : despesa.valorTotal;

    return this.valorPorPagador(valor, despesa.payers);
  }

  valorParcelaPorPessoa(parcela: Parcela): number {
    return this.valorPorPagador(parcela.valor, parcela.pagadores);
  }

  private valorPorPagador(valor: number, pagadores: string[] = []): number {
    if (!valor || !pagadores.length) {
      return valor ?? 0;
    }

    return valor / pagadores.length;
  }

  formatDate(date: string): string {
    if (!date) {
      return '';
    }
    const [y, m, d] = date.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
}
