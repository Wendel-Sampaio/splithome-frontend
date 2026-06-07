import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Recado = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
};

type NovoRecado = {
  content: string;
  authorName: string;
};

@Injectable({ providedIn: 'root' })
export class RecadosService {
  private readonly recadosSubject = new BehaviorSubject<Recado[]>([
    {
      id: '1',
      content: 'Reunião da família no domingo, às 10h.',
      authorName: 'Sistema',
      createdAt: new Date().toISOString()
    }
  ]);

  listar(): Observable<Recado[]> {
    return this.recadosSubject.asObservable();
  }

  criar(recado: NovoRecado): void {
    const novoRecado: Recado = {
      id: this.gerarId(),
      content: recado.content.trim(),
      authorName: recado.authorName.trim(),
      createdAt: new Date().toISOString()
    };

    this.recadosSubject.next([novoRecado, ...this.recadosSubject.value]);
  }

  private gerarId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
}
