import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Compra } from '../../../core/models/compra/compra';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  constructor() { }

  http = inject(HttpClient)

  API = "http://localhost:8080/api/transactions/purchases"
  
  listarCompras(): Observable<Compra[]>{
    return this.http.get<Compra[]>(this.API, {responseType: 'json'});
  }
  
}
