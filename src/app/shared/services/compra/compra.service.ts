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
    return this.http.get<Page<Compra>>(`${this.API}/purchases`, { params });
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
    return this.http.get<Page<DespesaFixa>>(`${this.API}/fixed-expenses`, { params });
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
}
