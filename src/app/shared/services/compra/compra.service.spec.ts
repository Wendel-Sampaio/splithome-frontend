import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CompraService } from './compra.service';
import { API_URL } from '../../../../../api-url';

describe('CompraService', () => {
  let service: CompraService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CompraService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(CompraService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('cria o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('listarCompras()', () => {
    it('faz GET para /api/transactions/purchases', () => {
      service.listarCompras().subscribe();

      const req = httpMock.expectOne(`${API_URL}/transactions/purchases`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('retorna lista de compras recebida do servidor', () => {
      const comprasMock = [{ id: '1', title: 'Supermercado', value: 150 }];
      let resultado: any;

      service.listarCompras().subscribe(compras => resultado = compras);

      const req = httpMock.expectOne(`${API_URL}/transactions/purchases`);
      req.flush(comprasMock);

      expect(resultado).toEqual(comprasMock);
    });
  });

  describe('cadastrarCompra()', () => {
    it('faz POST para /api/transactions/new-purchase com os dados corretos', () => {
      const novaCompra = { title: 'Feira', value: 80, category: 'FOOD' };

      service.cadastrarCompra(novaCompra).subscribe();

      const req = httpMock.expectOne(`${API_URL}/transactions/new-purchase`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(novaCompra);
      req.flush({ id: 'uuid-gerado' });
    });
  });

  describe('atualizarCompra()', () => {
    it('faz PUT para /api/transactions/update-purchase', () => {
      const atualizacao = { id: 'uuid-123', remainingPayers: [] };

      service.atualizarCompra(atualizacao).subscribe();

      const req = httpMock.expectOne(`${API_URL}/transactions/update-purchase`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(atualizacao);
      req.flush(atualizacao);
    });
  });

  describe('deleteCompra()', () => {
    it('faz DELETE para /api/transactions/delete/:id', () => {
      const id = 'uuid-a-deletar';

      service.deleteCompra(id).subscribe();

      const req = httpMock.expectOne(`${API_URL}/transactions/delete/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush('');
    });
  });
});
