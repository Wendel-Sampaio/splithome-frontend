import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type Recado = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
};

type NovoRecado = {
  content: string;
};

@Injectable({ providedIn: 'root' })
export class RecadosService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/recados`;

  listar(): Observable<Recado[]> {
    return this.http.get<Recado[]>(this.API);
  }

  criar(recado: NovoRecado): Observable<Recado> {
    return this.http.post<Recado>(this.API, {
      content: recado.content.trim()
    });
  }
}
