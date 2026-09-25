import { OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../core/auth/user/user.service';
import { meuhttpInterceptor } from '../../../core/auth/user/http-interceptor.service';
import { Notificacao } from '../../../core/models/notificacao/notificacao';
import { NotificationService } from '../../services/notification/notification.service';
import { NotificacoesComponent } from './notificacoes.component';

describe('NotificacoesComponent com API', () => {
  let fixture: ComponentFixture<NotificacoesComponent>;
  let component: NotificacoesComponent;
  let http: HttpTestingController;
  let user: UserService;
  let overlay: HTMLElement;
  const api = `${environment.apiUrl}/notifications`;
  const item: Notificacao = {
    id: 'notification-1', title: 'Novo recado', message: 'Comprar café', route: '/recados',
    createdAt: '2026-09-25T10:00:00Z', readAt: null
  };

  beforeEach(() => {
    localStorage.removeItem('token');
    TestBed.configureTestingModule({
      imports: [NotificacoesComponent],
      providers: [provideRouter([]), provideHttpClient(withInterceptors([meuhttpInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['error']) }]
    });
    user = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => {
    fixture?.destroy();
    http.verify();
    localStorage.removeItem('token');
  });

  function create(authenticated = true) {
    if (authenticated) user.addToken('test-token');
    fixture = TestBed.createComponent(NotificacoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function flushList(items = [item], unreadCount = 1, hasMore = false, page = 0) {
    const request = http.expectOne(`${api}?page=${page}&size=20`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ items, unreadCount, hasMore });
    fixture.detectChanges();
  }

  function open() {
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
  }

  it('não exibe o ícone nem consulta a API sem sessão', () => {
    create(false);
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    component.abrir(); component.carregar(); component.marcarLida(item); component.marcarTodas();
    http.expectNone(request => request.url.startsWith(api));
    expect(component.aberto()).toBeFalse();
  });

  it('exibe carregamento, lista e total de não lidas informado pelo backend', () => {
    create(); open();
    expect(overlay.textContent).toContain('Carregando notificações');
    flushList([item, { ...item, id: 'read', readAt: item.createdAt }], 31, true);
    expect(fixture.nativeElement.querySelector('.notif-badge').textContent).toContain('31');
    expect(overlay.querySelectorAll('li.unread').length).toBe(1);
    expect(overlay.querySelectorAll('li').length).toBe(2);
    expect(overlay.textContent).toContain('Comprar café');
  });

  it('exibe vazio sem badge', () => {
    create(); open(); flushList([], 0);
    expect(overlay.textContent).toContain('Nenhuma notificação por enquanto');
    expect(fixture.nativeElement.querySelector('.notif-badge')).toBeNull();
  });

  it('exibe erro e permite tentar novamente', () => {
    create(); open();
    http.expectOne(`${api}?page=0&size=20`).flush({}, { status: 500, statusText: 'error' });
    fixture.detectChanges();
    expect(overlay.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível carregar');
    (overlay.querySelector('.error button') as HTMLButtonElement).click();
    flushList();
    expect(overlay.querySelector('[role="alert"]')).toBeNull();
  });

  it('persiste a leitura, atualiza visual e contador e impede duplo envio', () => {
    create(); open(); flushList();
    const button = overlay.querySelector('.item-actions button') as HTMLButtonElement;
    button.click(); button.click();
    const request = http.expectOne(`${api}/${item.id}/read`);
    expect(request.request.method).toBe('PUT');
    expect(component.itens()[0].readAt).toBeNull();
    request.flush({ notification: { ...item, readAt: item.createdAt }, unreadCount: 0 });
    fixture.detectChanges();
    expect(overlay.querySelector('li.unread')).toBeNull();
    expect(fixture.nativeElement.querySelector('.notif-badge')).toBeNull();
  });

  it('marca todas, incluindo páginas ainda não carregadas', () => {
    create(); open(); flushList([item], 45, true);
    (overlay.querySelectorAll('.actions button')[1] as HTMLButtonElement).click();
    const request = http.expectOne(`${api}/read-all`);
    expect(request.request.method).toBe('PUT');
    request.flush({ unreadCount: 0 }); fixture.detectChanges();
    expect(component.naoLidas()).toBe(0);
    expect(overlay.querySelector('li.unread')).toBeNull();
  });

  it('preserva itens e contador quando a leitura individual ou em lote falha', () => {
    create(); open(); flushList();
    component.marcarLida(item);
    http.expectOne(`${api}/${item.id}/read`).flush({}, { status: 500, statusText: 'error' });
    expect(component.naoLidas()).toBe(1);
    expect(component.itens()[0].readAt).toBeNull();
    component.marcarTodas();
    http.expectOne(`${api}/read-all`).flush({}, { status: 500, statusText: 'error' });
    fixture.detectChanges();
    expect(component.naoLidas()).toBe(1);
    expect(overlay.querySelector('li.unread')).not.toBeNull();
    expect(overlay.textContent).toContain('Não foi possível marcar todas');
  });

  it('carrega outras páginas sem duplicar itens', () => {
    create(); flushList([item], 3, true);
    component.carregar(true);
    flushList([item, { ...item, id: 'second' }], 3, false, 1);
    expect(component.itens().length).toBe(2);
    expect(component.naoLidas()).toBe(3);
    expect(component.temMais()).toBeFalse();
  });

  it('atualiza a lista ao reabrir e mantém a leitura retornada pelo servidor', () => {
    create(); flushList(); open();
    flushList([{ ...item, readAt: item.createdAt }], 0);
    expect(overlay.querySelector('li.unread')).toBeNull();
  });

  it('navega para a rota somente após confirmar a leitura', async () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    create(); open(); flushList();
    (overlay.querySelector('a') as HTMLAnchorElement).click();
    expect(navigate).not.toHaveBeenCalled();
    http.expectOne(`${api}/${item.id}/read`).flush({ notification: { ...item, readAt: item.createdAt }, unreadCount: 0 });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/recados', { onSameUrlNavigation: 'reload' });
    expect(component.aberto()).toBeFalse();
  });

  it('aceita links HTTP e HTTPS e rejeita destinos executáveis', () => {
    create(false);
    expect(component.destino({ ...item, route: 'https://example.com/aviso' })).toBe('https://example.com/aviso');
    for (const route of ['javascript:alert(1)', '//example.com', '/\\example.com', null]) {
      expect(component.destino({ ...item, route })).toBeNull();
    }
  });

  it('limpa o dropdown e cancela requisições ao sair, sem vazar dados para outra sessão', () => {
    create(); open(); flushList();
    component.carregar();
    const pending = http.expectOne(`${api}?page=0&size=20`);
    user.removerToken(); fixture.detectChanges();
    expect(pending.cancelled).toBeTrue();
    expect(component.itens()).toEqual([]);
    expect(component.naoLidas()).toBe(0);
    expect(overlay.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    user.addToken('test-token'); flushList([], 0);
    expect(component.itens()).toEqual([]);
  });

  it('esconde notificações após 401 e redireciona ao login', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    create(); open();
    http.expectOne(`${api}?page=0&size=20`).flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(component.autenticado()).toBeFalse();
    expect(component.itens()).toEqual([]);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('limpa os dados ao receber logout de outra aba', () => {
    create(); flushList(); localStorage.removeItem('token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'token' }));
    fixture.detectChanges();
    expect(component.itens()).toEqual([]);
    expect(component.autenticado()).toBeFalse();
  });

  it('fecha com Escape e devolve o foco ao ícone', async () => {
    create(); open(); flushList(); await fixture.whenStable();
    overlay.querySelector('button')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(component.aberto()).toBeFalse();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('button'));
  });
});
