import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { Cartao, CreditCardBrand } from '../../../core/models/cartao/cartao';
import { Compra } from '../../../core/models/compra/compra';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { CompraService } from '../../services/compra/compra.service';
import { EstatisticaCategoria, EstatisticasResumo, EstatisticasService } from '../../services/estatisticas/estatisticas.service';
import {
  DividaMembro,
  ResumoFinanceiro,
  ResumoFinanceiroService,
  SaldoMembro,
  SugestaoLiquidacao
} from '../../services/resumo-financeiro/resumo-financeiro.service';
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

interface ContaPendente {
  title: string;
  subtitle: string;
  value: number;
  dueDate: string;
  tipo: 'compra' | 'despesa' | 'parcela';
  atrasada: boolean;
}

interface CartaoResumo {
  id: string;
  name: string;
  brand: CreditCardBrand | null;
  lastDigits: string | null;
  dueDay: number;
  total: number;
  pendente: number;
  quantidade: number;
}

interface ParcelaResumo {
  id?: string;
  numero?: number;
  dataVencimento?: string;
  dueDate?: string;
  pago?: boolean;
  paid?: boolean;
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
  private readonly userStateService = inject(UserStateService);
  private readonly dialog = inject(MatDialog);
  private readonly modal = inject(ModalService);
  private readonly destroyRef = inject(DestroyRef);

  readonly carregando = signal(true);
  readonly totalDespesasMes = signal(0);
  readonly totalEmAberto = signal(0);
  readonly totalCompras = signal(0);
  readonly totalAReceber = signal(0);
  readonly totalAPagar = signal(0);
  readonly pagamentosSugeridos = signal(0);
  readonly maiorCategoria = signal<string>('—');
  readonly atividades = signal<Atividade[]>([]);
  readonly barrasMes = signal<BarraMes[]>([]);
  readonly categorias = signal<EstatisticaCategoria[]>([]);
  readonly contasPendentes = signal<ContaPendente[]>([]);
  readonly cartoesResumo = signal<CartaoResumo[]>([]);
  readonly saldos = signal<SaldoMembro[]>([]);
  readonly dividas = signal<DividaMembro[]>([]);
  readonly liquidacoes = signal<SugestaoLiquidacao[]>([]);

  readonly coresCategoria = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308', '#14b8a6'];

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
      ),
      cartoes: this.compraService.listarCartoes().pipe(catchError(() => of([] as Cartao[]))),
      usuarios: this.userStateService.getFamilyUsers().pipe(catchError(() => of([] as User[])))
    })
      .pipe(
        finalize(() => this.carregando.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ estatisticas, resumo, compras, despesas, cartoes, usuarios }) => {
        const usuariosPorId = this.criarMapaUsuarios(usuarios);
        const comprasCarregadas = (compras?.content ?? []).map((compra) => this.prepararCompra(compra, usuariosPorId));
        const despesasCarregadas = despesas.map((despesa) => this.prepararDespesa(despesa, usuariosPorId));
        const totalCompras = Math.max(compras?.totalElements ?? 0, comprasCarregadas.length);
        const totalEmAbertoLocal = this.calcularTotalEmAberto(comprasCarregadas, despesasCarregadas);

        this.aplicarEstatisticas(estatisticas);
        this.aplicarResumo(resumo, totalEmAbertoLocal);
        this.totalCompras.set(totalCompras);
        this.montarAtividades(comprasCarregadas, despesasCarregadas);
        this.montarContasPendentes(comprasCarregadas, despesasCarregadas);
        this.montarResumoCartoes(cartoes, despesasCarregadas);
      });
  }

  private criarMapaUsuarios(usuarios: User[]): Map<string, string> {
    const usuariosPorId = new Map<string, string>(usuarios.map((usuario) => [usuario.id, usuario.name]));
    const usuarioAtual = this.userService.getUser();

    if (usuarioAtual.id) {
      usuariosPorId.set(usuarioAtual.id, usuarioAtual.name);
    }

    return usuariosPorId;
  }

  private prepararCompra(compra: Compra, usuariosPorId: Map<string, string>): Compra {
    const payers = compra.payers ?? [];
    const remainingPayers = compra.remainingPayers ?? [];

    return {
      ...compra,
      payers,
      remainingPayers,
      purchaserName: this.nomeUsuario(compra.purchaserId, compra.purchaserName, usuariosPorId),
      payerNames: this.displayNamesFor(payers, usuariosPorId),
      remainingPayerNames: this.displayNamesFor(remainingPayers, usuariosPorId)
    };
  }

  private prepararDespesa(despesa: DespesaFixa, usuariosPorId: Map<string, string>): DespesaFixa {
    const payers = despesa.payers ?? [];
    const remainingPayers = despesa.remainingPayers ?? [];

    return {
      ...despesa,
      payers,
      remainingPayers,
      responsibleName: this.nomeUsuario(despesa.responsibleId, despesa.responsibleName, usuariosPorId),
      payerNames: this.displayNamesFor(payers, usuariosPorId),
      remainingPayerNames: this.displayNamesFor(remainingPayers, usuariosPorId),
      parcelas: (despesa.parcelas ?? []).map((parcela) => ({
        ...parcela,
        pagadorNames: this.displayNamesFor(parcela.pagadores ?? [], usuariosPorId),
        remainingPayerNames: this.displayNamesFor(parcela.remainingPayers ?? [], usuariosPorId)
      }))
    };
  }

  private nomeUsuario(id: string | undefined, nome: string | undefined, usuariosPorId: Map<string, string>): string {
    const nomeLimpo = nome?.trim();

    if (nomeLimpo) {
      return nomeLimpo;
    }

    return id ? usuariosPorId.get(id) ?? 'Não informado' : 'Não informado';
  }

  private displayNamesFor(references: string[], usuariosPorId: Map<string, string>): string[] {
    return references.map((reference) => usuariosPorId.get(reference) ?? reference);
  }

  private aplicarEstatisticas(estatisticas: EstatisticasResumo | null): void {
    if (!estatisticas) {
      return;
    }

    this.totalDespesasMes.set(estatisticas.totalMesAtual ?? 0);
    this.maiorCategoria.set(estatisticas.maiorCategoria?.categoria ?? '—');
    this.categorias.set((estatisticas.totaisPorCategoria ?? []).slice(0, 6));

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
    this.saldos.set(resumo?.balances ?? []);
    this.dividas.set((resumo?.debts ?? []).slice(0, 4));
    this.liquidacoes.set((resumo?.settlements ?? []).slice(0, 4));
    this.pagamentosSugeridos.set(resumo?.settlements.length ?? 0);
    this.totalAReceber.set(
      resumo?.balances
        .filter((saldo) => saldo.netBalance > 0)
        .reduce((total, saldo) => total + saldo.netBalance, 0) ?? 0
    );
    this.totalAPagar.set(
      Math.abs(resumo?.balances
        .filter((saldo) => saldo.netBalance < 0)
        .reduce((total, saldo) => total + saldo.netBalance, 0) ?? 0)
    );
  }

  private montarAtividades(compras: Compra[], despesas: DespesaFixa[]): void {
    const deCompras: Atividade[] = compras.map((c) => ({
      title: c.title,
      category: c.category,
      value: this.calcularValorPorPagador(c.value, c.payers),
      date: c.purchaseDate,
      tipo: 'compra',
      autor: c.purchaserName
    }));

    const deDespesas: Atividade[] = despesas.map((d) => ({
      title: d.title,
      category: d.category,
      value: this.calcularValorPorPagador(this.valorPorCobranca(d), d.payers),
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

  private montarContasPendentes(compras: Compra[], despesas: DespesaFixa[]): void {
    const pendenciasCompras: ContaPendente[] = compras
      .filter((compra) => !compra.isPaid || (compra.remainingPayers?.length ?? 0) > 0)
      .map((compra) => {
        const vencimento = compra.paymentDate || compra.purchaseDate;

        return {
          title: compra.title,
          subtitle: `${compra.purchaserName} · ${this.quantidadePendente(compra.remainingPayers)} pendente(s)`,
          value: this.valorOuPendente(
            compra.value,
            this.calcularValorPendente(
              compra.value,
              compra.payers,
              compra.remainingPayers,
              [compra.purchaserId, compra.purchaserName]
            ),
            compra.payers
          ),
          dueDate: vencimento,
          tipo: 'compra' as const,
          atrasada: this.estaAtrasada(vencimento)
        };
      });

    const pendenciasDespesas: ContaPendente[] = despesas.flatMap<ContaPendente>((despesa): ContaPendente[] => {
      const parcelas = this.lerParcelas(despesa);

      if (parcelas.length) {
        return parcelas
          .filter((parcela) => !this.parcelaPaga(parcela) || (parcela.remainingPayers?.length ?? 0) > 0)
          .map((parcela) => {
            const valor = parcela.value ?? parcela.valor ?? 0;
            const vencimento = parcela.dueDate ?? parcela.dataVencimento ?? despesa.paymentDate ?? despesa.dataInicio;

            return {
              title: despesa.title,
              subtitle: `Parcela ${parcela.numero ?? '-'} · ${this.quantidadePendente(parcela.remainingPayers)} pendente(s)`,
              value: this.valorOuPendente(
                valor,
                this.calcularValorPendente(
                  valor,
                  parcela.payers ?? parcela.pagadores ?? [],
                  parcela.remainingPayers ?? [],
                  [despesa.responsibleId, despesa.responsibleName]
                ),
                parcela.payers ?? parcela.pagadores ?? []
              ),
              dueDate: vencimento,
              tipo: 'parcela' as const,
              atrasada: this.estaAtrasada(vencimento)
            };
          });
      }

      const vencimento = despesa.paymentDate || despesa.dataInicio;

      return [{
        title: despesa.title,
        subtitle: `${despesa.responsibleName} · ${this.quantidadePendente(despesa.remainingPayers)} pendente(s)`,
        value: this.valorOuPendente(
          despesa.valorTotal,
          this.calcularValorPendente(
            despesa.valorTotal,
            despesa.payers,
            despesa.remainingPayers,
            [despesa.responsibleId, despesa.responsibleName]
          ),
          despesa.payers
        ),
        dueDate: vencimento,
        tipo: 'despesa' as const,
        atrasada: this.estaAtrasada(vencimento)
      }];
    });

    const pendencias = [...pendenciasCompras, ...pendenciasDespesas]
      .filter((conta) => conta.value > 0)
      .sort((a, b) => this.timestamp(a.dueDate) - this.timestamp(b.dueDate))
      .slice(0, 6);

    this.contasPendentes.set(pendencias);
  }

  private montarResumoCartoes(cartoes: Cartao[], despesas: DespesaFixa[]): void {
    const resumos = new Map<string, CartaoResumo>();

    cartoes.forEach((cartao) => {
      resumos.set(cartao.id, {
        id: cartao.id,
        name: cartao.name,
        brand: cartao.brand,
        lastDigits: cartao.lastDigits,
        dueDay: cartao.dueDay,
        total: 0,
        pendente: 0,
        quantidade: 0
      });
    });

    despesas
      .filter((despesa) => !!despesa.creditCardId)
      .forEach((despesa) => {
        const cartaoId = despesa.creditCardId as string;
        const resumo = resumos.get(cartaoId) ?? {
          id: cartaoId,
          name: despesa.creditCardName || 'Cartão vinculado',
          brand: null,
          lastDigits: null,
          dueDay: despesa.diaVencimento,
          total: 0,
          pendente: 0,
          quantidade: 0
        };
        const valorPendente = this.calcularPendenteDespesa(despesa);

        resumo.total += this.calcularValorPorPagador(despesa.valorTotal ?? 0, despesa.payers);
        resumo.pendente += valorPendente;
        resumo.quantidade += 1;
        resumos.set(cartaoId, resumo);
      });

    this.cartoesResumo.set(
      [...resumos.values()]
        .sort((a, b) => b.pendente - a.pendente || b.total - a.total || a.name.localeCompare(b.name))
        .slice(0, 5)
    );
  }

  private calcularPendenteDespesa(despesa: DespesaFixa): number {
    const parcelas = this.lerParcelas(despesa);

    if (parcelas.length) {
      return parcelas.reduce((total, parcela) => {
        const valor = parcela.value ?? parcela.valor ?? 0;
        return total + this.calcularValorPendente(
          valor,
          parcela.payers ?? parcela.pagadores ?? [],
          parcela.remainingPayers ?? [],
          [despesa.responsibleId, despesa.responsibleName]
        );
      }, 0);
    }

    return this.calcularValorPendente(
      despesa.valorTotal,
      despesa.payers,
      despesa.remainingPayers,
      [despesa.responsibleId, despesa.responsibleName]
    );
  }

  private calcularTotalEmAberto(compras: Compra[], despesas: DespesaFixa[]): number {
    const totalCompras = compras.reduce((total, compra) => {
      return total + this.calcularValorPendente(
        compra.value,
        compra.payers,
        compra.remainingPayers,
        [compra.purchaserId, compra.purchaserName]
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
            [despesa.responsibleId, despesa.responsibleName]
          );
        }, 0);
      }

      return total + this.calcularValorPendente(
        despesa.valorTotal,
        despesa.payers,
        despesa.remainingPayers,
        [despesa.responsibleId, despesa.responsibleName]
      );
    }, 0);

    return totalCompras + totalDespesas;
  }

  private calcularValorPendente(
    valor: number,
    pagadores: string[] = [],
    pagadoresRestantes: string[] = [],
    responsavel?: string | Array<string | undefined>
  ): number {
    if (!valor || !pagadores.length || !pagadoresRestantes.length) {
      return 0;
    }

    const cota = valor / pagadores.length;
    const referenciasResponsavel = Array.isArray(responsavel)
      ? responsavel.filter((reference): reference is string => !!reference)
      : [responsavel].filter((reference): reference is string => !!reference);
    const pendentes = pagadoresRestantes.filter((pagador) => pagador && !referenciasResponsavel.includes(pagador));

    return pendentes.length * cota;
  }

  private lerParcelas(despesa: DespesaFixa): ParcelaResumo[] {
    return Array.isArray(despesa.parcelas) ? despesa.parcelas as ParcelaResumo[] : [];
  }

  private parcelaPaga(parcela: ParcelaResumo): boolean {
    return parcela.pago ?? parcela.paid ?? false;
  }

  private valorOuPendente(valorTotal: number, valorPendente: number, pagadores: string[] = []): number {
    return valorPendente > 0 ? valorPendente : this.calcularValorPorPagador(valorTotal, pagadores);
  }

  private valorPorCobranca(despesa: DespesaFixa): number {
    return despesa.quantidadeParcelas
      ? despesa.valorTotal / despesa.quantidadeParcelas
      : despesa.valorTotal;
  }

  private calcularValorPorPagador(valor: number, pagadores: string[] = []): number {
    if (!valor || !pagadores.length) {
      return valor ?? 0;
    }

    return valor / pagadores.length;
  }

  private quantidadePendente(pendentes?: string[]): number {
    return pendentes?.length ?? 0;
  }

  private estaAtrasada(data: string): boolean {
    if (!data) {
      return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataConta = new Date(data);
    dataConta.setHours(0, 0, 0, 0);
    return !Number.isNaN(dataConta.getTime()) && dataConta < hoje;
  }

  private timestamp(data: string): number {
    const time = new Date(data).getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
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

  iconeConta(tipo: ContaPendente['tipo']): string {
    if (tipo === 'compra') {
      return 'shopping_cart';
    }

    if (tipo === 'parcela') {
      return 'event_repeat';
    }

    return 'payments';
  }

  get totalCategorias(): number {
    return this.categorias().reduce((total, item) => total + item.total, 0);
  }

  get pieGradient(): string {
    const categorias = this.categorias();

    if (!categorias.length || this.totalCategorias <= 0) {
      return '#eef3ef';
    }

    let inicio = 0;
    const partes = categorias.map((item, index) => {
      const fim = inicio + (item.total / this.totalCategorias) * 360;
      const cor = this.getCorCategoria(index);
      const segmento = `${cor} ${inicio}deg ${fim}deg`;
      inicio = fim;
      return segmento;
    });

    return `conic-gradient(${partes.join(', ')})`;
  }

  getCorCategoria(index: number): string {
    return this.coresCategoria[index % this.coresCategoria.length];
  }

  saldoClasse(saldo: SaldoMembro): string {
    if (saldo.netBalance > 0) {
      return 'positivo';
    }

    if (saldo.netBalance < 0) {
      return 'negativo';
    }

    return 'neutro';
  }

  formatarMes(mes: string): string {
    const [ano, numeroMes] = mes.split('-');
    const data = new Date(Number(ano), Number(numeroMes) - 1, 1);

    if (Number.isNaN(data.getTime())) {
      return mes;
    }

    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', '');
  }

  formatarDataCurta(data: string): string {
    if (!data) {
      return 'Sem data';
    }

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return data;
    }

    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(dataObj).replace('.', '');
  }

  brandLabel(brand: CreditCardBrand | null): string {
    const labels: Record<CreditCardBrand, string> = {
      VISA: 'Visa',
      MASTERCARD: 'Mastercard',
      ELO: 'Elo',
      AMEX: 'Amex',
      HIPERCARD: 'Hipercard',
      OUTROS: 'Outros'
    };

    return brand ? labels[brand] : 'Sem bandeira';
  }

  brandInitial(brand: CreditCardBrand | null): string {
    return this.brandLabel(brand).slice(0, 2).toUpperCase();
  }
}
