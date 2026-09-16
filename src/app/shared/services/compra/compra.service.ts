import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Compra } from '../../../core/models/compra/compra';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/models/page/page';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';
import { Parcela } from '../../../core/models/parcela/parcela';
import { Cartao, CreditCardBrand } from '../../../core/models/cartao/cartao';

export interface CompraFilter {
  title?: string;
  category?: string;
  purchaserId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  constructor() { }

  http = inject(HttpClient)

  API = `${environment.apiUrl}/transactions`;

  // ----------------- Compras (avulsas) -----------------
  listarCompras(filter: CompraFilter = {}): Observable<Page<Compra>> {
    let params = new HttpParams();
    if (filter.title) params = params.set('title', filter.title);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.purchaserId) params = params.set('purchaserId', filter.purchaserId);
    if (filter.startDate) params = params.set('startDate', filter.startDate);
    if (filter.endDate) params = params.set('endDate', filter.endDate);
    if (filter.page !== undefined) params = params.set('page', filter.page.toString());
    if (filter.size !== undefined) params = params.set('size', filter.size.toString());
    if (filter.sort) params = params.set('sort', filter.sort);
    return this.http.get<unknown>(`${this.API}/purchases`, { params }).pipe(
      map(response => this.normalizarPagina<Compra>(response))
    );
  }

  cadastrarCompra(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/new-purchase`, data);
  }

  atualizarCompra(data: any): Observable<any> {
    return this.http.put<any>(`${this.API}/update-purchase`, data);
  }

  deleteCompra(contaId: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/delete/${contaId}`, { responseType: 'text' as 'json' });
  }

  // ----------------- Despesas fixas -----------------
  listarDespesasFixas(filter: { page?: number; size?: number; sort?: string } = {}): Observable<Page<DespesaFixa>> {
    let params = new HttpParams();
    if (filter.page !== undefined) params = params.set('page', filter.page.toString());
    if (filter.size !== undefined) params = params.set('size', filter.size.toString());
    if (filter.sort) params = params.set('sort', filter.sort);
    return this.http.get<unknown>(`${this.API}/fixed-expenses`, { params }).pipe(
      map(response => this.normalizarPagina<DespesaFixa>(response))
    );
  }

  listarDespesas(): Observable<any[]> {
    return this.listarDespesasFixas({ size: 1000 }).pipe(map(page => page.content));
  }

  cadastrarDespesaFixa(data: any): Observable<DespesaFixa> {
    return this.http.post<DespesaFixa>(`${this.API}/new-fixed-expense`, data);
  }

  atualizarDespesaFixa(id: string, data: any): Observable<DespesaFixa> {
    return this.http.put<DespesaFixa>(`${this.API}/update-fixed-expense/${id}`, data);
  }

  excluirDespesaFixa(id: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/delete-fixed-expense/${id}`, { responseType: 'text' as 'json' });
  }

  cadastrarDespesa(data: any): Observable<any> {
    return this.cadastrarDespesaFixa(data);
  }

  atualizarDespesa(data: any): Observable<any> {
    return this.atualizarDespesaFixa(data.id, data);
  }

  deleteDespesa(id: string): Observable<string> {
    return this.excluirDespesaFixa(id);
  }

  listarParcelas(expenseId: string): Observable<Parcela[]> {
    return this.http.get<Parcela[]>(`${this.API}/expenses/${expenseId}/installments`);
  }

  pagarParcela(installmentId: string): Observable<Parcela> {
    return this.http.post<Parcela>(`${this.API}/installments/${installmentId}/pay`, {});
  }

  // ----------------- Cartões de crédito -----------------
  listarCartoes(): Observable<Cartao[]> {
    return this.http.get<Cartao[]>(`${this.API}/credit-cards`);
  }

  cadastrarCartao(cartao: { name: string; brand: CreditCardBrand | null; lastDigits: string | null; billingDay: number; dueDay: number }): Observable<Cartao> {
    return this.http.post<Cartao>(`${this.API}/credit-cards`, cartao);
  }

  atualizarCartao(id: string, cartao: { name: string; brand: CreditCardBrand | null; lastDigits: string | null; billingDay: number; dueDay: number }): Observable<Cartao> {
    return this.http.put<Cartao>(`${this.API}/credit-cards/${id}`, cartao);
  }

  excluirCartao(id: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/credit-cards/${id}`, { responseType: 'text' as 'json' });
  }

  private normalizarPagina<T>(response: unknown): Page<T> {
    if (Array.isArray(response)) {
      return this.criarPagina(response as T[], response.length);
    }

    if (!response || typeof response !== 'object') {
      return this.criarPagina<T>([], 0);
    }

    const payload = response as Record<string, unknown>;
    const content = this.lerLista<T>(payload, ['content', 'items', 'results', 'data']);
    const totalElements = Math.max(
      this.lerNumero(payload, ['totalElements', 'total_elements', 'total', 'count']) ?? content.length,
      content.length
    );
    const totalPages = this.lerNumero(payload, ['totalPages', 'total_pages'])
      ?? (content.length ? 1 : 0);
    const size = this.lerNumero(payload, ['size', 'pageSize', 'page_size'])
      ?? content.length;
    const number = this.lerNumero(payload, ['number', 'page', 'pageNumber', 'page_number'])
      ?? 0;

    return {
      content,
      totalElements,
      totalPages,
      size,
      number,
      first: typeof payload['first'] === 'boolean' ? payload['first'] : number === 0,
      last: typeof payload['last'] === 'boolean' ? payload['last'] : totalPages <= number + 1
    };
  }

  private criarPagina<T>(content: T[], totalElements: number): Page<T> {
    return {
      content,
      totalElements,
      totalPages: content.length ? 1 : 0,
      size: content.length,
      number: 0,
      first: true,
      last: true
    };
  }

  private lerLista<T>(payload: Record<string, unknown>, chaves: string[]): T[] {
    const chave = chaves.find(key => Array.isArray(payload[key]));
    return chave ? payload[chave] as T[] : [];
  }

  private lerNumero(payload: Record<string, unknown>, chaves: string[]): number | null {
    const chave = chaves.find(key => payload[key] !== undefined);
    const valor = chave ? payload[chave] : null;

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : null;
    }

    if (typeof valor === 'string') {
      const numero = Number(valor.replace(',', '.'));
      return Number.isFinite(numero) ? numero : null;
    }

    return null;
  }
}
