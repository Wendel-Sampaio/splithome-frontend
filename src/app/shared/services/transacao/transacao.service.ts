import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.http.get<string[]>(this.API + '/categories');
  }

  listarDespesas(): Observable<Despesa[]> {
    return this.http.get<Despesa[]>(`${this.API}/expenses`);
  }

  cadastrarDespesa(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/new-expense`, data);
  }

}
