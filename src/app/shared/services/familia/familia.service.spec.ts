import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FamiliaService } from './familia.service';

describe('FamiliaService', () => {
  let service: FamiliaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(FamiliaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('busca os dados da familia pela rota de minha familia', () => {
    service.obterMinhaFamilia().subscribe((family) => {
      expect(family?.name).toBe('Casa Silva');
      expect(family?.familyCode).toBe('CASA123');
      expect(family?.members.length).toBe(1);
    });

    const req = httpMock.expectOne((request) => request.url.endsWith('/family/my-family'));
    expect(req.request.method).toBe('GET');
    req.flush({
      name: 'Casa Silva',
      familyCode: 'CASA123',
      members: [
        {
          id: 'user-1',
          name: 'Ana Silva',
          email: 'ana@splithome.dev'
        }
      ]
    });
  });
});
