import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Compra } from '../../../core/models/compra/compra';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Despesa } from '../../../core/models/despesa/despesa';
import { Page } from '../../../core/models/page/page';

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

  listarDespesas(): Observable<Despesa[]> {
    return this.http.get<Page<Despesa>>(`${this.API}/expenses`).pipe(
      map(response => response.content)
    );
  }

  cadastrarCompra(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/new-purchase`, data);
  }

  cadastrarDespesa(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/new-expense`, data);
  }

  atualizarCompra(data: any): Observable<any> {
    console.log("Antes da requisição:", data)
    return this.http.put<any>(`${this.API}/update-purchase`, data);
  }

  atualizarDespesa(data: any): Observable<any> {
    console.log("Antes da requisicao:", data)
    return this.http.put<any>(`${this.API}/update-expense`, data);
  }

  deleteCompra(contaId: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/delete/${contaId}`, { responseType: 'text' as 'json' });
  }

  deleteDespesa(contaId: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/delete/${contaId}`, { responseType: 'text' as 'json' });
  }
}
