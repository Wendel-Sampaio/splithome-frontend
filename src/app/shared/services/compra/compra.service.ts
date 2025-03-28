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

  API = "http://localhost:8080/api/transactions"
  
  listarCompras(): Observable<Compra[]>{
    return this.http.get<Compra[]>(this.API+"/purchases");
  }
  
  cadastrarCompra(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/new-purchase`, data);
  }

  atualizarCompra(data: any): Observable<any> {
    console.log("Antes da requisição:", data)
    return this.http.put<any>(this.API+"/update-purchase", data)
  }

  deleteCompra(contaId: string): Observable<string> {
    return this.http.delete<string>(`${this.API}/delete/${contaId}`, {responseType: 'text' as 'json'}); 
  }
  
}
