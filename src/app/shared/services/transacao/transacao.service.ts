import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TransacaoService {

  constructor() { }

  http = inject(HttpClient)
  API = `${environment.apiUrl}/transactions`;


  listarCategorias(): Observable<string[]> {
    return this.http.get<string[]>(this.API+"/categories");
  }
  
}
