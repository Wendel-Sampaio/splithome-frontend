import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { API_URL } from '../../../../../api-url';

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
  
}
