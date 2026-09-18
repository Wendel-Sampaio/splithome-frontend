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

  it('normaliza metadados de pagina quando o Spring serializa em page', () => {
    service.listarCompras({ page: 0, size: 5 }).subscribe(page => {
      expect(page.content.length).toBe(5);
      expect(page.totalElements).toBe(12);
      expect(page.totalPages).toBe(3);
      expect(page.size).toBe(5);
      expect(page.number).toBe(0);
      expect(page.last).toBeFalse();
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/transactions/purchases'));
    req.flush({
      content: [
        { id: 'c1' },
        { id: 'c2' },
        { id: 'c3' },
        { id: 'c4' },
        { id: 'c5' }
      ],
      page: {
        size: 5,
        number: 0,
        totalElements: 12,
        totalPages: 3
      }
    });
  });

  it('envia filtro de pagamento quando informado', () => {
    service.listarCompras({ paid: false }).subscribe();

    const req = httpMock.expectOne(request => request.url.endsWith('/transactions/purchases'));
    expect(req.request.params.get('paid')).toBe('false');
    req.flush([]);
  });

  it('normaliza despesas fixas e parcelas retornadas pelo backend', () => {
    service.listarDespesasFixas().subscribe(page => {
      expect(page.content[0].payers).toEqual(['Ana', 'Bruno']);
      expect(page.content[0].remainingPayers).toEqual(['Bruno']);
      expect(page.content[0].parcelas[0].numero).toBe(1);
      expect(page.content[0].parcelas[0].valor).toBe(50);
      expect(page.content[0].parcelas[0].dataVencimento).toBe('2026-09-10');
      expect(page.content[0].parcelas[0].pago).toBeFalse();
      expect(page.content[0].parcelas[0].pagadores).toEqual(['Ana', 'Bruno']);
      expect(page.content[0].parcelas[0].remainingPayers).toEqual(['Bruno']);
    });

    const req = httpMock.expectOne(request => request.url.endsWith('/transactions/fixed-expenses'));
    req.flush({
      content: [{
        id: 'd1',
        title: 'Internet',
        payers: ['Ana', 'Bruno'],
        remainingPayers: ['Bruno'],
        parcelas: [{
          id: 'p1',
          expenseId: 'd1',
          installmentNumber: 1,
          value: 50,
          dueDate: '2026-09-10',
          paid: false,
          payers: ['Ana', 'Bruno'],
          remainingPayers: ['Bruno']
        }]
      }]
    });
  });
});
