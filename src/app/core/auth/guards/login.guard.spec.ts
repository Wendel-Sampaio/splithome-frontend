import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { loginGuard } from './login.guard';

describe('loginGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  const run = () => TestBed.runInInjectionContext(
    () => loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  it('deve bloquear e redirecionar para /login quando NÃO há token', () => {
    const navigate = spyOn(router, 'navigate');
    expect(run()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve permitir acesso quando há token', () => {
    localStorage.setItem('token', 'qualquer.token');
    expect(run()).toBeTrue();
  });
});
