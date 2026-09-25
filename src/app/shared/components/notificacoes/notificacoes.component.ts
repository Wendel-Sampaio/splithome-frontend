import { A11yModule } from '@angular/cdk/a11y';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserService } from '../../../core/auth/user/user.service';
import { Notificacao } from '../../../core/models/notificacao/notificacao';
import { NotificacoesService } from '../../services/notificacoes/notificacoes.service';

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [A11yModule, OverlayModule, MatIconModule, DatePipe],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificacoesComponent {
  private readonly api = inject(NotificacoesService);
  private readonly user = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private requests = new Subscription();
  private page = 0;

  @ViewChild('trigger') private trigger?: ElementRef<HTMLButtonElement>;
  readonly autenticado = signal(false);
  readonly aberto = signal(false);
  readonly itens = signal<Notificacao[]>([]);
  readonly naoLidas = signal(0);
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal('');
  readonly erroLeitura = signal('');
  readonly temMais = signal(false);
  readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 10 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -10 }
  ];

  constructor() {
    this.user.sessionChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.sincronizarSessao());
    this.destroyRef.onDestroy(() => this.requests.unsubscribe());
  }

  @HostListener('window:storage', ['$event'])
  storageChanged(event: StorageEvent): void {
    if (event.key === 'token' || event.key === null) this.sincronizarSessao();
  }

  private sincronizarSessao(): void {
    this.requests.unsubscribe();
    this.requests = new Subscription();
    this.aberto.set(false);
    this.itens.set([]);
    this.naoLidas.set(0);
    this.temMais.set(false);
    this.carregando.set(false);
    this.salvando.set(false);
    this.erro.set('');
    this.erroLeitura.set('');
    this.autenticado.set(!!this.user.getToken());
    if (this.autenticado()) this.carregar();
  }

  abrir(): void {
    if (!this.autenticado()) return;
    this.aberto.set(true);
    this.carregar();
  }

  fechar(): void {
    this.aberto.set(false);
    this.trigger?.nativeElement.focus();
  }

  carregar(mais = false): void {
    if (!this.autenticado() || this.carregando() || this.salvando()) return;
    const page = mais ? this.page + 1 : 0;
    this.carregando.set(true);
    this.erro.set('');
    this.requests.add(this.api.listar(page).subscribe({
      next: response => {
        // Evita duplicatas caso novas notificações desloquem a paginação.
        const items = mais ? [...this.itens(), ...response.items] : response.items;
        this.itens.set([...new Map(items.map(item => [item.id, item])).values()]);
        this.page = page;
        this.naoLidas.set(response.unreadCount);
        this.temMais.set(response.hasMore);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar as notificações. Tente novamente.');
      }
    }));
  }

  marcarLida(item: Notificacao, navegar = false): void {
    if (!this.autenticado() || this.salvando() || this.carregando()) return;
    if (item.readAt) {
      if (navegar) this.navegar(item);
      return;
    }
    this.salvando.set(true);
    this.erroLeitura.set('');
    this.requests.add(this.api.marcarComoLida(item.id).subscribe({
      next: response => {
        this.itens.update(items => items.map(value => value.id === item.id ? response.notification : value));
        this.naoLidas.set(response.unreadCount);
        this.salvando.set(false);
        if (navegar) this.navegar(item);
      },
      error: () => {
        this.salvando.set(false);
        this.erroLeitura.set('Não foi possível marcar a notificação como lida. Tente novamente.');
      }
    }));
  }

  marcarTodas(): void {
    if (!this.autenticado() || this.salvando() || this.carregando() || !this.naoLidas()) return;
    this.salvando.set(true);
    this.erroLeitura.set('');
    this.requests.add(this.api.marcarTodasComoLidas().subscribe({
      next: response => {
        const readAt = new Date().toISOString();
        this.itens.update(items => items.map(item => ({ ...item, readAt: item.readAt ?? readAt })));
        this.naoLidas.set(response.unreadCount);
        this.salvando.set(false);
      },
      error: () => {
        this.salvando.set(false);
        this.erroLeitura.set('Não foi possível marcar todas como lidas. Tente novamente.');
      }
    }));
  }

  destino(item: Notificacao): string | null {
    const route = item.route?.trim();
    if (!route || /[\\\u0000-\u001f]/.test(route) || route.startsWith('//')) return null;
    if (route.startsWith('/')) return route;
    try {
      const url = new URL(route);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  abrirDestino(event: MouseEvent, item: Notificacao): void {
    event.preventDefault();
    this.marcarLida(item, true);
  }

  private navegar(item: Notificacao): void {
    const destination = this.destino(item);
    if (!destination) return;
    if (destination.startsWith('/')) {
      void this.router.navigateByUrl(destination, { onSameUrlNavigation: 'reload' }).then(success => {
        if (success) this.fechar();
        else this.erroLeitura.set('Não foi possível abrir o destino da notificação.');
      }).catch(() => this.erroLeitura.set('Não foi possível abrir o destino da notificação.'));
    } else {
      window.location.assign(destination);
    }
  }
}
