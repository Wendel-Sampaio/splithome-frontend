import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransacaoService {

  constructor() { }

  http = inject(HttpClient)
  API = "http://localhost:8080/api/transactions";


  listarCategorias(): Observable<string[]> {
    return this.http.get<string[]>(this.API+"/categories");
  }
  
}
