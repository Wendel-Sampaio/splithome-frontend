import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ResumoFinanceiroFiltro {
  dataInicio?: string;
  dataFim?: string;
}

export interface SaldoMembro {
  memberId: string;
  memberName: string;
  netBalance: number;
}

export interface DividaMembro {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
}

export interface SugestaoLiquidacao {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
}

export interface ResumoFinanceiro {
  balances: SaldoMembro[];
  debts: DividaMembro[];
  settlements: SugestaoLiquidacao[];
  totalOutstanding: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResumoFinanceiroService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/stats/financial-summary`;

  buscarResumo(filtro?: ResumoFinanceiroFiltro): Observable<ResumoFinanceiro> {
    let params = new HttpParams();

    if (filtro?.dataInicio) {
      params = params.set('from', filtro.dataInicio);
    }

    if (filtro?.dataFim) {
      params = params.set('to', filtro.dataFim);
    }

    return this.http.get<unknown>(this.API, { params }).pipe(
      map((response) => this.normalizarResumo(response))
    );
  }

  private normalizarResumo(response: unknown): ResumoFinanceiro {
    const payload = response && typeof response === 'object'
      ? response as Record<string, unknown>
      : {};

    const balances = this.normalizarLista<SaldoMembro>(payload['balances']);
    const debts = this.normalizarLista<DividaMembro>(payload['debts']);
    const settlements = this.normalizarLista<SugestaoLiquidacao>(payload['settlements']);
    const totalOutstanding = typeof payload['totalOutstanding'] === 'number'
      ? payload['totalOutstanding']
      : 0;

    return {
      balances,
      debts,
      settlements,
      totalOutstanding
    };
  }

  private normalizarLista<T>(value: unknown): T[] {
    return Array.isArray(value) ? value as T[] : [];
  }
}
