import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Compra } from '../../../core/models/compra/compra';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Despesa } from '../../../core/models/despesa/despesa';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  constructor() { }

  http = inject(HttpClient)

  API = `${environment.apiUrl}/transactions`;
  
  listarCompras(): Observable<Compra[]> {
    return this.http.get<unknown>(`${this.API}/purchases`).pipe(
      map(response => this.extractList<Compra>(response, ['purchases', 'compras']))
    );
  }

  listarDespesas(): Observable<Despesa[]> {
    return this.http.get<unknown>(`${this.API}/expenses`).pipe(
      map(response => this.extractList<Despesa>(response, ['expenses', 'despesas']))
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

  private extractList<T>(response: unknown, specificKeys: string[]): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      console.warn('Resposta inesperada ao listar transações:', response);
      return [];
    }

    const responseObject = response as Record<string, unknown>;
    const possibleKeys = [...specificKeys, 'content', 'data', 'items', 'results'];
    const listKey = possibleKeys.find(key => Array.isArray(responseObject[key]));

    if (listKey) {
      return responseObject[listKey] as T[];
    }

    console.warn('Resposta inesperada ao listar transações:', response);
    return [];
  }
}
