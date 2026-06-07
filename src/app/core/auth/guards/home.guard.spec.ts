import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { homeGuard } from './home.guard';

describe('homeGuard', () => {
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
    () => homeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  it('deve permitir acesso quando NÃO há token', () => {
    expect(run()).toBeTrue();
  });

  it('deve bloquear e redirecionar para /home quando há token', () => {
    const navigate = spyOn(router, 'navigate');
    localStorage.setItem('token', 'qualquer.token');
    expect(run()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });
});
