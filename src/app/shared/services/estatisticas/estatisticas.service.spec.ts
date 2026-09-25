import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EstatisticasService } from './estatisticas.service';

describe('EstatisticasService: categorias persistidas', () => {
  let service: EstatisticasService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EstatisticasService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserva categorias customizadas com category nulo e IDs distintos para nomes iguais', () => {
    service.buscarResumo().subscribe(result => {
      expect(result.totaisPorCategoria.length).toBe(2);
      expect(result.totaisPorCategoria.map(c => c.categoryId)).toEqual(['custom', 'system']);
      expect(result.maiorCategoria?.categoryDetails?.custom).toBeTrue();
      expect(result.maiorCategoria?.categoria).toBe('FOOD');
    });
    http.expectOne(req => req.url.endsWith('/stats/summary')).flush({
      totalByCategory: [
        { category: 'FOOD', categoryId: 'system', total: 100, categoryDetails: { id: 'system', name: 'FOOD', systemDefault: true, custom: false } },
        { category: null, categoryId: 'custom', total: 180, categoryDetails: { id: 'custom', name: 'FOOD', systemDefault: false, custom: true } }
      ], totalByMonth: []
    });
  });

  it('continua aceitando respostas antigas com enum', () => {
    service.buscarResumo().subscribe(result => expect(result.totaisPorCategoria).toEqual([{ categoria: 'FOOD', total: 20 }]));
    http.expectOne(req => req.url.endsWith('/stats/summary')).flush({ totalByCategory: [{ category: 'FOOD', total: 20 }] });
  });
});
