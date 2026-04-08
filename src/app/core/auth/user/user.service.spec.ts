import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserService } from './user.service';
import { Login } from './login';
import { Register } from './register';

/**
 * Testes para UserService.
 *
 * Riscos de segurança documentados:
 * 1. XSS via localStorage: o token JWT é armazenado em localStorage,
 *    acessível por qualquer script na página. Um ataque XSS pode
 *    exfiltrar o token. Mitigação: usar HttpOnly cookie.
 *
 * 2. Ausência de validação de expiração: getToken() retorna o token
 *    bruto sem checar o campo 'exp'. jwtDecode() decodifica mas não
 *    valida. Os guards confiam que se há token, o usuário está autenticado.
 *
 * 3. getUser() usa cast direto `jwtDecode() as User` sem validação.
 *    Se o token for malformado ou não contiver os campos esperados,
 *    o cast silencioso produz um objeto parcialmente populado.
 *
 * Cenários testados:
 * - addToken / getToken / removerToken: ciclo de vida do token no localStorage
 * - jwtDecode: ausência de token retorna string vazia
 * - getUser: retorna objeto decodificado do JWT
 * - logar / cadastrar: chamadas HTTP corretas
 */
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
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
  // Gerenciamento de token no localStorage
  // -------------------------------------------------------------------------

  describe('token no localStorage', () => {

    it('deve armazenar token no localStorage', () => {
      service.addToken('meu.jwt.token');
      expect(localStorage.getItem('token')).toBe('meu.jwt.token');
    });

    it('deve recuperar token do localStorage', () => {
      localStorage.setItem('token', 'token-existente');
      expect(service.getToken()).toBe('token-existente');
    });

    it('deve retornar null quando não há token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('deve remover token do localStorage', () => {
      localStorage.setItem('token', 'token-a-remover');
      service.removerToken();
      expect(localStorage.getItem('token')).toBeNull();
    });

    /**
     * RISCO DE SEGURANÇA: token acessível via JavaScript.
     * Este teste documenta que o token é legível por código JS na página,
     * o que o expõe a ataques XSS.
     */
    it('token é acessível via JavaScript — risco XSS documentado', () => {
      service.addToken('jwt.sensivel.aqui');
      // Qualquer script injetado pode fazer isso:
      const tokenRoubado = localStorage.getItem('token');
      expect(tokenRoubado).toBe('jwt.sensivel.aqui');
      // TODO: migrar para HttpOnly cookie para eliminar este vetor de ataque
    });
  });

  // -------------------------------------------------------------------------
  // jwtDecode / getUser
  // -------------------------------------------------------------------------

  describe('jwtDecode', () => {

    it('deve retornar string vazia quando não há token no localStorage', () => {
      expect(service.jwtDecode()).toBe('');
    });

    it('deve decodificar um JWT real e retornar o payload', () => {
      // JWT com payload: { "sub": "joao@test.com", "name": "João", "id": "uuid-1", "familyCode": "ABCD1234", "exp": 9999999999 }
      // Gerado com HMAC256 (somente para teste — não usado para validação aqui)
      const jwtFake = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'eyJzdWIiOiJqb2FvQHRlc3QuY29tIiwibmFtZSI6IkpvXHUwMGUzbyIsImlkIjoidXVpZC0xIiwiZmFtaWx5Q29kZSI6IkFCQ0QxMjM0IiwiZXhwIjo5OTk5OTk5OTk5fQ',
        'assinatura_nao_verificada_aqui'
      ].join('.');

      localStorage.setItem('token', jwtFake);
      const decoded = service.jwtDecode() as any;

      expect(decoded.sub).toBe('joao@test.com');
      expect(decoded.name).toBeDefined();
      expect(decoded.familyCode).toBe('ABCD1234');
    });

    /**
     * RISCO: getUser() faz cast direto sem validação.
     * Se o token estiver corrompido, jwtDecode lança exceção que não é tratada
     * no guard/componente — causa crash em runtime.
     */
    it('deve lançar exceção para token malformado no localStorage — sem tratamento de erro', () => {
      localStorage.setItem('token', 'token.nao.e.um.jwt.valido');
      expect(() => service.jwtDecode()).toThrow();
      // TODO: envolver jwtDecode em try/catch e retornar null/redirecionar para login
    });
  });

  // -------------------------------------------------------------------------
  // Requisições HTTP
  // -------------------------------------------------------------------------

  describe('logar', () => {

    it('deve fazer POST para /auth/login com as credenciais', () => {
      const login = new Login('joao@test.com', 'Senha@123');
      service.logar(login).subscribe();

      const req = httpMock.expectOne(req =>
        req.method === 'POST' && req.url.includes('/user/auth/login')
      );
      expect(req.request.body).toEqual(login);
      req.flush('jwt.token.response');
    });
  });

  describe('cadastrar', () => {

    it('deve fazer POST para /auth/register com os dados de registro', () => {
      const register = new Register('João', 'joao@test.com', 'Senha@123', 'ABCD1234');
      service.cadastrar(register).subscribe();

      const req = httpMock.expectOne(req =>
        req.method === 'POST' && req.url.includes('/user/auth/register')
      );
      expect(req.request.body).toEqual(register);
      req.flush('Usuário cadastrado com sucesso!');
    });
  });

  describe('getUserById', () => {

    it('deve fazer GET para /user/{id}', () => {
      const id = 'uuid-123';
      service.getUserById(id).subscribe();

      const req = httpMock.expectOne(req =>
        req.method === 'GET' && req.url.includes(`/user/${id}`)
      );
      req.flush({ id, name: 'João', email: 'joao@test.com', phoneNumber: '', pixKey: '', familyCode: 'ABC' });
    });
  });

  describe('getAllUsers', () => {

    it('deve fazer GET para /user/listall', () => {
      service.getAllUsers().subscribe();

      const req = httpMock.expectOne(req =>
        req.method === 'GET' && req.url.includes('/user/listall')
      );
      req.flush([]);
    });
  });
});
