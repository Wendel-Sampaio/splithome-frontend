import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Categoria } from '../../../core/models/categoria/categoria';

@Injectable({ providedIn: 'root' })
export class TransacaoService {
  private readonly http = inject(HttpClient);
  readonly API = `${environment.apiUrl}/transactions`;

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.API}/categories`);
  }

  criarCategoria(name: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.API}/categories`, { name });
  }

  atualizarCategoria(id: string, name: string): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.API}/categories/${id}`, { name });
  }

  excluirCategoria(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/categories/${id}`);
  }
}
