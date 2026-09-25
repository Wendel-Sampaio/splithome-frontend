export interface Notificacao {
  id: string;
  title: string;
  message: string;
  route: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface PaginaNotificacoes {
  items: Notificacao[];
  hasMore: boolean;
  unreadCount: number;
}

export interface LeituraNotificacao {
  notification: Notificacao;
  unreadCount: number;
}
