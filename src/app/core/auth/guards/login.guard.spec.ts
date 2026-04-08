import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { loginGuard } from './login.guard';
import { UserService } from '../user/user.service';

/**
 * Testes para loginGuard.
 *
 * loginGuard protege rotas autenticadas, redirecionando para /login
 * se o usuário não tiver token no localStorage.
 *
 * Riscos documentados:
 * - Mesmo risco do homeGuard: não valida expiração do token.
 *   Um token expirado permitirá o acesso à rota protegida até que
 *   uma requisição HTTP falhe com 401.
 * - O token é lido do localStorage, vulnerável a ataques XSS.
 *   Scripts injetados na página podem roubar o token.
 *   Mitigação sugerida: migrar para HttpOnly cookie.
 *
 * Cenários testados:
 * 1. Token ausente → redireciona para /login, retorna false
 * 2. Token presente → permite acesso, retorna true
 * 3. Token expirado → permite acesso indevidamente (comportamento atual)
 * 4. Múltiplas chamadas → comportamento consistente
 */
describe('loginGuard', () => {
  const executeGuard: CanActivateFn = (...args) =>
    TestBed.runInInjectionContext(() => loginGuard(...args));

  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('deve redirecionar para /login e retornar false quando token é null', () => {
    userServiceSpy.getToken.and.returnValue(null);

    const resultado = executeGuard({} as any, {} as any);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(resultado).toBeFalse();
  });

  it('deve retornar true e não redirecionar quando token está presente', () => {
    userServiceSpy.getToken.and.returnValue('jwt.token.aqui');

    const resultado = executeGuard({} as any, {} as any);

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(resultado).toBeTrue();
  });

  /**
   * RISCO: token expirado não é detectado pelo guard.
   * O usuário com token expirado consegue acessar rotas protegidas,
   * mas a primeira requisição HTTP retornará 401 e não haverá tratamento
   * automático (sem refresh token implementado).
   *
   * Impacto: experiência quebrada — usuário vê a tela mas as operações falham.
   * Correção sugerida: verificar 'exp' do JWT no guard e redirecionar para /login
   * se expirado, removendo o token do localStorage.
   */
  it('deve permitir acesso com token expirado — sem validação de expiração', () => {
    const tokenExpirado = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwiZXhwIjoxfQ.assinatura';
    userServiceSpy.getToken.and.returnValue(tokenExpirado);

    const resultado = executeGuard({} as any, {} as any);

    // Permite acesso sem verificar validade do token — comportamento atual
    expect(resultado).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    // TODO: após corrigir, deve retornar false e redirecionar quando token expirado
  });

  it('deve ser consistente em múltiplas chamadas com o mesmo estado', () => {
    userServiceSpy.getToken.and.returnValue('token-valido');

    const resultado1 = executeGuard({} as any, {} as any);
    const resultado2 = executeGuard({} as any, {} as any);

    expect(resultado1).toBeTrue();
    expect(resultado2).toBeTrue();
  });

  it('deve ser chamado sem lançar exceção', () => {
    userServiceSpy.getToken.and.returnValue(null);
    expect(() => executeGuard({} as any, {} as any)).not.toThrow();
  });
});
