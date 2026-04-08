import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { loginGuard } from './login.guard';
import { UserService } from '../user/user.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('loginGuard', () => {
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => loginGuard(...guardParameters));

  beforeEach(() => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
      ]
    });
  });

  it('retorna true quando token está presente (usuário autenticado)', () => {
    userServiceSpy.getToken.and.returnValue('token.jwt.valido');

    const resultado = executeGuard({} as any, {} as any);

    expect(resultado).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('retorna false e redireciona para /login quando token é null', () => {
    userServiceSpy.getToken.and.returnValue(null);

    const resultado = executeGuard({} as any, {} as any);

    expect(resultado).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
