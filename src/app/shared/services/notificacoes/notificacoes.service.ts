import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { LeituraNotificacao, PaginaNotificacoes } from '../../../core/models/notificacao/notificacao';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/notifications`;

  listar(page = 0) {
    return this.http.get<PaginaNotificacoes>(this.api, { params: { page, size: 20 } });
  }

  marcarComoLida(id: string) {
    return this.http.put<LeituraNotificacao>(`${this.api}/${encodeURIComponent(id)}/read`, {});
  }

  marcarTodasComoLidas() {
    return this.http.put<{ unreadCount: number }>(`${this.api}/read-all`, {});
  }
}
