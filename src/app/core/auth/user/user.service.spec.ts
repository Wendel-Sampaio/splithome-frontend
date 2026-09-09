import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserService } from './user.service';
import { Login } from './login';
import { Register } from './register';

/**
 * Testes para UserService.
 *
 * Riscos de segurança documentados:
 * 1. XSS via localStorage: o token JWT fica em localStorage, legível por qualquer
 *    script da página. Mitigação: HttpOnly cookie.
 * 2. jwtDecode() lança exceção em token malformado e não é tratada nos guards.
 */
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('token no localStorage', () => {
    it('deve armazenar token', () => {
      service.addToken('meu.jwt.token');
      expect(localStorage.getItem('token')).toBe('meu.jwt.token');
    });

    it('deve recuperar token', () => {
      localStorage.setItem('token', 'token-existente');
      expect(service.getToken()).toBe('token-existente');
    });

    it('deve retornar null quando não há token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('deve remover token', () => {
      localStorage.setItem('token', 'token-a-remover');
      service.removerToken();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('token é legível via JavaScript — risco XSS documentado', () => {
      service.addToken('jwt.sensivel.aqui');
      expect(localStorage.getItem('token')).toBe('jwt.sensivel.aqui');
    });
  });

  describe('jwtDecode / getUser', () => {
    it('jwtDecode deve retornar null quando não há token', () => {
      expect(service.jwtDecode()).toBeNull();
    });

    it('deve decodificar um JWT e mapear os campos do User', () => {
      // payload: { "name":"João", "email":"joao@test.com", "id":"uuid-1", "familyCode":"ABCD1234", "exp":9999999999 }
      const jwtFake = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'eyJuYW1lIjoiSm9cdTAwZTNvIiwiZW1haWwiOiJqb2FvQHRlc3QuY29tIiwiaWQiOiJ1dWlkLTEiLCJmYW1pbHlDb2RlIjoiQUJDRDEyMzQiLCJleHAiOjk5OTk5OTk5OTl9',
        'assinatura_nao_verificada'
      ].join('.');

      localStorage.setItem('token', jwtFake);
      const decoded = service.jwtDecode();

      expect(decoded).not.toBeNull();
      expect(decoded!.email).toBe('joao@test.com');
      expect(decoded!.id).toBe('uuid-1');
      expect(decoded!.familyCode).toBe('ABCD1234');
    });

    it('getUser deve retornar usuário default quando não há token', () => {
      const user = service.getUser();
      expect(user.id).toBe('');
      expect(user.plan).toBe('FREE');
    });

    it('jwtDecode deve lançar exceção para token malformado (sem tratamento)', () => {
      localStorage.setItem('token', 'token.nao.e.um.jwt.valido');
      expect(() => service.jwtDecode()).toThrow();
    });
  });

  describe('requisições HTTP', () => {
    it('logar deve fazer POST para /user/auth/login e extrair token de resposta em texto', () => {
      const login = new Login('joao@test.com', 'Senha@123');
      let token = '';
      service.logar(login).subscribe(response => token = response);

      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('/user/auth/login'));
      expect(req.request.body).toEqual(login);
      req.flush('jwt.token.response');
      expect(token).toBe('jwt.token.response');
    });

    it('logar deve extrair token quando backend retorna LoginResponseDTO serializado', () => {
      const login = new Login('joao@test.com', 'Senha@123');
      let token = '';
      service.logar(login).subscribe(response => token = response);

      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('/user/auth/login'));
      expect(req.request.body).toEqual(login);
      req.flush('{"token":"jwt.token.response"}');
      expect(token).toBe('jwt.token.response');
    });

    it('cadastrar deve fazer POST para /user/auth/register', () => {
      const register = new Register('João', 'joao@test.com', 'Senha@123');
      service.cadastrar(register).subscribe();

      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('/user/auth/register'));
      expect(req.request.body).toEqual(register);
      req.flush('Usuário cadastrado com sucesso!');
    });

    it('getUserById deve fazer GET para /user/{id}', () => {
      service.getUserById('uuid-123').subscribe();
      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('/user/uuid-123'));
      expect(req.request.method).toBe('GET');
      req.flush({ id: 'uuid-123', name: 'João', email: 'joao@test.com', phoneNumber: '', pixKey: '', familyCode: 'ABC' });
    });

    it('getAllUsers deve fazer GET para /user/listall', () => {
      service.getAllUsers().subscribe();
      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('/user/listall'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
