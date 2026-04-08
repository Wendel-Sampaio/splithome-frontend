import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { API_URL } from '../../../../../api-url';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // -------------------------------------------------------------------------
  // localStorage
  // -------------------------------------------------------------------------
  describe('gerenciamento de token', () => {
    it('addToken salva token no localStorage', () => {
      service.addToken('meu.jwt.token');
      expect(localStorage.getItem('token')).toBe('meu.jwt.token');
    });

    it('getToken retorna token salvo', () => {
      localStorage.setItem('token', 'token.salvo');
      expect(service.getToken()).toBe('token.salvo');
    });

    it('getToken retorna null quando não há token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('removerToken remove o token do localStorage', () => {
      localStorage.setItem('token', 'token.a.remover');
      service.removerToken();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // jwtDecode
  // -------------------------------------------------------------------------
  describe('jwtDecode', () => {
    it('retorna string vazia quando não há token', () => {
      expect(service.jwtDecode()).toBe('');
    });

    it('decodifica token JWT válido e retorna payload', () => {
      // JWT com payload: { "sub": "test@email.com", "name": "Teste", "id": "uuid-123" }
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
        '.eyJzdWIiOiJ0ZXN0QGVtYWlsLmNvbSIsIm5hbWUiOiJUZXN0ZSIsImlkIjoidXVpZC0xMjMifQ' +
        '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('token', fakeToken);

      const payload = service.jwtDecode() as any;

      expect(payload).toBeTruthy();
      expect(payload['name']).toBe('Teste');
    });
  });

  // -------------------------------------------------------------------------
  // logar — chamada HTTP
  // -------------------------------------------------------------------------
  describe('logar', () => {
    it('faz POST para /api/user/auth/login com credenciais', () => {
      const login = { email: 'user@email.com', password: 'Senha@123' } as any;

      service.logar(login).subscribe();

      const req = httpMock.expectOne(`${API_URL}/user/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(login);
      req.flush('token.jwt.mock');
    });

    it('retorna token recebido do servidor', () => {
      const login = { email: 'user@email.com', password: 'Senha@123' } as any;
      let tokenRecebido = '';

      service.logar(login).subscribe(token => tokenRecebido = token);

      const req = httpMock.expectOne(`${API_URL}/user/auth/login`);
      req.flush('token.retornado.pelo.servidor');

      expect(tokenRecebido).toBe('token.retornado.pelo.servidor');
    });
  });

  // -------------------------------------------------------------------------
  // cadastrar — chamada HTTP
  // -------------------------------------------------------------------------
  describe('cadastrar', () => {
    it('faz POST para /api/user/auth/register', () => {
      const registro = { name: 'Novo', email: 'novo@email.com', password: 'Senha@123', familyCode: 'FAM00001' } as any;

      service.cadastrar(registro).subscribe();

      const req = httpMock.expectOne(`${API_URL}/user/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush('Usuário cadastrado com sucesso!');
    });
  });

  // -------------------------------------------------------------------------
  // getUserById — chamada HTTP
  // -------------------------------------------------------------------------
  describe('getUserById', () => {
    it('faz GET para /api/user/:id', () => {
      const id = 'uuid-teste-123';

      service.getUserById(id).subscribe();

      const req = httpMock.expectOne(`${API_URL}/user/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush({ id, name: 'Teste' });
    });
  });

  // -------------------------------------------------------------------------
  // getAllUsers — chamada HTTP
  // -------------------------------------------------------------------------
  describe('getAllUsers', () => {
    it('faz GET para /api/user/listall', () => {
      service.getAllUsers().subscribe();

      const req = httpMock.expectOne(`${API_URL}/user/listall`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
