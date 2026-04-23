import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { API_URL } from '../../../../../api-url';
import { Despesa } from '../../../core/models/despesa/despesa';

@Injectable({
  providedIn: 'root'
})
export class TransacaoService {

  constructor() { }

  http = inject(HttpClient)
  API = `${API_URL}/transactions`;

  listarCategorias(): Observable<string[]> {
    return this.http.get<string[]>(this.API+"/categories");
  }
  
  cadastrarDespesa(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/new-expense`, data);
  }

  listarDespesas(): Observable<Despesa[]> {
    return this.http.get<Despesa[]>(`${this.API}/expenses`);
  }

  deleteDespesa(contaId: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/delete/${contaId}`, { responseType: 'text' as 'json' });
  }
}
