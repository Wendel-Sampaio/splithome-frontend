import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Compra } from '../../../core/models/compra/compra';
import { Observable } from 'rxjs';
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
    return this.http.get<Compra[]>(`${this.API}/purchases`);
  }

  listarDespesas(): Observable<Despesa[]> {
    return this.http.get<Despesa[]>(`${this.API}/expenses`);
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
