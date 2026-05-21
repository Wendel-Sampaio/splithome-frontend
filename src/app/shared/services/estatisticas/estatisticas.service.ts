import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EstatisticasFiltro {
  dataInicio?: string;
  dataFim?: string;
}

export interface EstatisticaCategoria {
  categoria: string;
  total: number;
}

export interface EstatisticaMensal {
  mes: string;
  total: number;
}

export interface EstatisticasResumo {
  totalMesAtual: number;
  maiorCategoria: EstatisticaCategoria | null;
  totaisPorCategoria: EstatisticaCategoria[];
  totaisPorMes: EstatisticaMensal[];
}

@Injectable({
  providedIn: 'root'
})
export class EstatisticasService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/stats/summary`;

  buscarResumo(filtro?: EstatisticasFiltro): Observable<EstatisticasResumo> {
    let params = new HttpParams();

    if (filtro?.dataInicio) {
      params = params.set('startDate', filtro.dataInicio);
    }

    if (filtro?.dataFim) {
      params = params.set('endDate', filtro.dataFim);
    }

    return this.http.get<unknown>(this.API, { params }).pipe(
      map(response => this.normalizarResumo(response))
    );
  }

  private normalizarResumo(response: unknown): EstatisticasResumo {
    const totaisPorCategoria = this.normalizarCategorias(this.lerValor(response, [
      'totalsByCategory',
      'categoryTotals',
      'totalByCategory',
      'categories',
      'byCategory'
    ]));
    const totaisPorMes = this.normalizarMeses(this.lerValor(response, [
      'totalsByMonth',
      'monthlyTotals',
      'totalByMonth',
      'months',
      'byMonth'
    ]));
    const totalMesAtual = this.lerNumero(response, [
      'currentMonthTotal',
      'totalCurrentMonth',
      'totalMesAtual',
      'gastoTotalMesAtual',
      'totalThisMonth'
    ]) ?? this.calcularTotalMesAtual(totaisPorMes);
    const maiorCategoria = this.normalizarMaiorCategoria(response, totaisPorCategoria);

    return {
      totalMesAtual,
      maiorCategoria,
      totaisPorCategoria,
      totaisPorMes
    };
  }

  private normalizarCategorias(valor: unknown): EstatisticaCategoria[] {
    if (!valor) {
      return [];
    }

    if (Array.isArray(valor)) {
      return valor
        .map(item => this.normalizarCategoria(item))
        .filter((item): item is EstatisticaCategoria => !!item)
        .sort((a, b) => b.total - a.total);
    }

    if (typeof valor === 'object') {
      return Object.entries(valor as Record<string, unknown>)
        .map(([categoria, total]) => ({
          categoria,
          total: this.converterNumero(total)
        }))
        .filter(item => item.total > 0)
        .sort((a, b) => b.total - a.total);
    }

    return [];
  }

  private normalizarMeses(valor: unknown): EstatisticaMensal[] {
    if (!valor) {
      return [];
    }

    if (Array.isArray(valor)) {
      return valor
        .map(item => this.normalizarMes(item))
        .filter((item): item is EstatisticaMensal => !!item)
        .sort((a, b) => a.mes.localeCompare(b.mes));
    }

    if (typeof valor === 'object') {
      return Object.entries(valor as Record<string, unknown>)
        .map(([mes, total]) => ({
          mes,
          total: this.converterNumero(total)
        }))
        .filter(item => item.total > 0)
        .sort((a, b) => a.mes.localeCompare(b.mes));
    }

    return [];
  }

  private normalizarCategoria(item: unknown): EstatisticaCategoria | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const itemObject = item as Record<string, unknown>;
    const categoria = this.lerTexto(itemObject, ['category', 'categoria', 'name', 'label']);
    const total = this.lerNumero(itemObject, ['total', 'value', 'amount', 'valor']);

    if (!categoria || total === null || total <= 0) {
      return null;
    }

    return { categoria, total };
  }

  private normalizarMes(item: unknown): EstatisticaMensal | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const itemObject = item as Record<string, unknown>;
    const mes = this.lerTexto(itemObject, ['month', 'mes', 'label', 'date', 'period']);
    const total = this.lerNumero(itemObject, ['total', 'value', 'amount', 'valor']);

    if (!mes || total === null || total <= 0) {
      return null;
    }

    return { mes, total };
  }

  private normalizarMaiorCategoria(
    response: unknown,
    totaisPorCategoria: EstatisticaCategoria[]
  ): EstatisticaCategoria | null {
    const valor = this.lerValor(response, [
      'biggestCategory',
      'highestCategory',
      'maiorCategoria',
      'topCategory'
    ]);
    const maiorCategoria = this.normalizarCategoria(valor);

    if (maiorCategoria) {
      return maiorCategoria;
    }

    return totaisPorCategoria[0] ?? null;
  }

  private calcularTotalMesAtual(totaisPorMes: EstatisticaMensal[]): number {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    return totaisPorMes.find(item => item.mes.startsWith(mesAtual))?.total ?? 0;
  }

  private lerValor(response: unknown, chaves: string[]): unknown {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const responseObject = response as Record<string, unknown>;
    const chave = chaves.find(key => responseObject[key] !== undefined);
    return chave ? responseObject[chave] : null;
  }

  private lerTexto(response: Record<string, unknown>, chaves: string[]): string | null {
    const chave = chaves.find(key => response[key] !== undefined);
    const valor = chave ? response[chave] : null;
    return typeof valor === 'string' ? valor : null;
  }

  private lerNumero(response: unknown, chaves: string[]): number | null {
    const valor = this.lerValor(response, chaves);
    const numero = this.converterNumero(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  private converterNumero(valor: unknown): number {
    if (typeof valor === 'number') {
      return valor;
    }

    if (typeof valor === 'string') {
      return Number(valor.replace(',', '.'));
    }

    return 0;
  }
}
