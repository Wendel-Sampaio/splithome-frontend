import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { Compra } from '../../../core/models/compra/compra';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { UserService } from '../../../core/auth/user/user.service';
import { CompraService } from '../../services/compra/compra.service';
import { EstatisticasResumo, EstatisticasService } from '../../services/estatisticas/estatisticas.service';
import { ResumoFinanceiro, ResumoFinanceiroService } from '../../services/resumo-financeiro/resumo-financeiro.service';
import { CategoriaPipe } from '../../pipes/categoria.pipe';
import { FormTransacaoComponent } from '../form-transacao/form-transacao.component';
import { ModalService } from '../ui/modal';

export type DashboardView = 'compras' | 'despesas' | 'graficos' | 'resumoFinanceiro' | 'cartoes';

interface Atividade {
  title: string;
  category: string;
  value: number;
  date: string;
  tipo: 'compra' | 'despesa';
  autor: string;
}

interface BarraMes {
  label: string;
  total: number;
  altura: number;
}

interface ParcelaResumo {
  valor?: number;
  value?: number;
  pagadores?: string[];
  payers?: string[];
  remainingPayers?: string[];
}

@Component({
  selector: 'app-dashboard-inicio',
  standalone: true,
  imports: [CommonModule, MatIcon, MatButtonModule, CategoriaPipe],
  templateUrl: './dashboard-inicio.component.html',
  styleUrl: './dashboard-inicio.component.scss'
})
export class DashboardInicioComponent implements OnInit {
  @Output() abrirView = new EventEmitter<DashboardView>();

  private readonly estatisticasService = inject(EstatisticasService);
  private readonly resumoService = inject(ResumoFinanceiroService);
  private readonly compraService = inject(CompraService);
  private readonly userService = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly modal = inject(ModalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly carregando = signal(true);
  readonly totalDespesasMes = signal(0);
  readonly totalEmAberto = signal(0);
  readonly totalCompras = signal(0);
  readonly maiorCategoria = signal<string>('—');
  readonly atividades = signal<Atividade[]>([]);
  readonly barrasMes = signal<BarraMes[]>([]);

  ngOnInit(): void {
    this.carregarDados();
  }

  get primeiroNome(): string {
    const nome = this.userService.getUser().name?.trim() ?? '';
    return nome ? nome.split(' ')[0] : 'por aí';
  }

  private carregarDados(): void {
    this.carregando.set(true);

    forkJoin({
      estatisticas: this.estatisticasService.buscarResumo().pipe(catchError(() => of(null))),
      resumo: this.userService.isPremium()
        ? this.resumoService.buscarResumo().pipe(catchError(() => of(null)))
        : of(null),
      compras: this.compraService
        .listarCompras({ size: 1000, sort: 'purchaseDate,desc' })
        .pipe(catchError(() => of(null))),
      despesas: this.compraService.listarDespesasFixas({ size: 1000, sort: 'createdAt,desc' }).pipe(
        map(page => page?.content ?? []),
        catchError(() => of([] as DespesaFixa[]))
      )
    })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ estatisticas, resumo, compras, despesas }) => {
        const comprasCarregadas = compras?.content ?? [];
        const totalCompras = Math.max(compras?.totalElements ?? 0, comprasCarregadas.length);
        const totalEmAbertoLocal = this.calcularTotalEmAberto(comprasCarregadas, despesas);

        this.aplicarEstatisticas(estatisticas);
        this.aplicarResumo(resumo, totalEmAbertoLocal);
        this.totalCompras.set(totalCompras);
        this.montarAtividades(comprasCarregadas, despesas);
      });
  }

  private aplicarEstatisticas(estatisticas: EstatisticasResumo | null): void {
    if (!estatisticas) {
      return;
    }

    this.totalDespesasMes.set(estatisticas.totalMesAtual ?? 0);
    this.maiorCategoria.set(estatisticas.maiorCategoria?.categoria ?? '—');

    const meses = estatisticas.totaisPorMes ?? [];
    const maior = meses.reduce((max, mes) => Math.max(max, mes.total), 0) || 1;
    this.barrasMes.set(
      meses.slice(-6).map((mes) => ({
        label: mes.mes,
        total: mes.total,
        altura: Math.round((mes.total / maior) * 100)
      }))
    );
  }

  private aplicarResumo(resumo: ResumoFinanceiro | null, totalEmAbertoLocal: number): void {
    const totalResumo = resumo?.totalOutstanding ?? 0;
    this.totalEmAberto.set(Math.max(totalResumo, totalEmAbertoLocal));
  }

  private montarAtividades(compras: Compra[], despesas: DespesaFixa[]): void {
    const deCompras: Atividade[] = compras.map((c) => ({
      title: c.title,
      category: c.category,
      value: c.value,
      date: c.purchaseDate,
      tipo: 'compra',
      autor: c.purchaserName
    }));

    const deDespesas: Atividade[] = despesas.map((d) => ({
      title: d.title,
      category: d.category,
      value: d.valorTotal,
      date: d.dataInicio,
      tipo: 'despesa',
      autor: d.responsibleName
    }));

    const todas = [...deCompras, ...deDespesas]
      .filter((a) => !!a.title)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    this.atividades.set(todas);
  }

  private calcularTotalEmAberto(compras: Compra[], despesas: DespesaFixa[]): number {
    const totalCompras = compras.reduce((total, compra) => {
      return total + this.calcularValorPendente(
        compra.value,
        compra.payers,
        compra.remainingPayers,
        compra.purchaserName
      );
    }, 0);

    const totalDespesas = despesas.reduce((total, despesa) => {
      const parcelas = this.lerParcelas(despesa);

      if (parcelas.length) {
        return total + parcelas.reduce((subtotal, parcela) => {
          return subtotal + this.calcularValorPendente(
            parcela.value ?? parcela.valor ?? 0,
            parcela.payers ?? parcela.pagadores ?? [],
            parcela.remainingPayers ?? [],
            despesa.responsibleName
          );
        }, 0);
      }

      return total + this.calcularValorPendente(
        despesa.valorTotal,
        despesa.payers,
        despesa.remainingPayers,
        despesa.responsibleName
      );
    }, 0);

    return totalCompras + totalDespesas;
  }

  private calcularValorPendente(
    valor: number,
    pagadores: string[] = [],
    pagadoresRestantes: string[] = [],
    responsavel?: string
  ): number {
    if (!valor || !pagadores.length || !pagadoresRestantes.length) {
      return 0;
    }

    const cota = valor / pagadores.length;
    const pendentes = pagadoresRestantes.filter((pagador) => pagador && pagador !== responsavel);

    return pendentes.length * cota;
  }

  private lerParcelas(despesa: DespesaFixa): ParcelaResumo[] {
    return Array.isArray(despesa.parcelas) ? despesa.parcelas as ParcelaResumo[] : [];
  }

  novaCompra(): void {
    this.abrirFormulario('compra');
  }

  novaDespesa(): void {
    this.abrirFormulario('despesa-fixa');
  }

  private abrirFormulario(tipo: 'compra' | 'despesa-fixa'): void {
    const ref = this.modal.open(FormTransacaoComponent, {
      size: 'lg',
      disableClose: true,
      data: { tipo }
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.carregarDados());
  }

  ir(view: DashboardView): void {
    this.abrirView.emit(view);
  }

  private readonly formatadorMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  moeda(valor: number): string {
    return this.formatadorMoeda.format(valor ?? 0);
  }

  iconeAtividade(tipo: 'compra' | 'despesa'): string {
    return tipo === 'compra' ? 'shopping_cart' : 'payments';
  }
}
