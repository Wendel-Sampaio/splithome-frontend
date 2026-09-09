import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { meuhttpInterceptor } from './http-interceptor.service';
import { UserService } from './user.service';

describe('meuhttpInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notify: jasmine.SpyObj<NotificationService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    notify = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getToken', 'removerToken']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/home' });
    userService.getToken.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([meuhttpInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notify },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('status 0 notifica erro de rede', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    expect(notify.error).toHaveBeenCalledWith('Sem conexão. Verifique sua internet.');
  });

  it('status 408 notifica timeout', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 408, statusText: 'Timeout' });
    expect(notify.error).toHaveBeenCalledWith('Tempo esgotado. Tente novamente.');
  });

  it('status 504 notifica timeout', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 504, statusText: 'Gateway Timeout' });
    expect(notify.error).toHaveBeenCalledWith('Tempo esgotado. Tente novamente.');
  });

  it('status 500 notifica erro servidor', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 500, statusText: 'Server Error' });
    expect(notify.error).toHaveBeenCalledWith('Erro no servidor. Tente novamente em instantes.');
  });

  it('status 503 notifica erro servidor', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 503, statusText: 'Unavailable' });
    expect(notify.error).toHaveBeenCalledWith('Erro no servidor. Tente novamente em instantes.');
  });

  it('status 401 remove token e navega para /login sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(userService.removerToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('envia Authorization quando há token mesmo se a rota atual for /login', () => {
    userService.getToken.and.returnValue('jwt-token');
    Object.defineProperty(router, 'url', { get: () => '/login' });

    http.post('/api/transactions/new-purchase', {}).subscribe();

    const req = httpMock.expectOne('/api/transactions/new-purchase');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it('status 403 notifica acesso negado', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 403, statusText: 'Forbidden' });
    expect(notify.error).toHaveBeenCalledWith('Acesso negado');
  });

  it('status 400 propaga sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 400, statusText: 'Bad Request' });
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('status 404 propaga sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 404, statusText: 'Not Found' });
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('status 422 propaga sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 422, statusText: 'Unprocessable' });
    expect(notify.error).not.toHaveBeenCalled();
  });
});
