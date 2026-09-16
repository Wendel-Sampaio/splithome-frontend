import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CompraService } from './compra.service';

describe('CompraService', () => {
  let service: CompraService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CompraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normaliza uma lista simples de compras como pagina', () => {
    service.listarCompras().subscribe(page => {
      expect(page.content.length).toBe(2);
      expect(page.totalElements).toBe(2);
      expect(page.first).toBeTrue();
      expect(page.last).toBeTrue();
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/transactions/purchases'));
    req.flush([{ id: 'c1' }, { id: 'c2' }]);
  });

  it('normaliza total_elements quando a API usa snake_case', () => {
    service.listarCompras({ size: 5 }).subscribe(page => {
      expect(page.content.length).toBe(1);
      expect(page.totalElements).toBe(12);
      expect(page.size).toBe(5);
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/transactions/purchases'));
    req.flush({
      content: [{ id: 'c1' }],
      total_elements: '12',
      size: '5'
    });
  });
});
