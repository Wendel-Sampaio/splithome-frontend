import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransacaoService } from './transacao.service';
import { Categoria } from '../../../core/models/categoria/categoria';

describe('TransacaoService', () => {
  let service: TransacaoService;
  let http: HttpTestingController;
  const categoria: Categoria = { id: 'pets', name: 'Pets', systemDefault: false, custom: true };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TransacaoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserva os DTOs da lista retornada pelo servidor sem cache de outra família', () => {
    service.listarCategorias().subscribe(categorias => expect(categorias).toEqual([categoria]));
    http.expectOne(`${service.API}/categories`).flush([categoria]);
    service.listarCategorias().subscribe(categorias => expect(categorias).toEqual([]));
    http.expectOne(`${service.API}/categories`).flush([]);
  });

  it('envia apenas o nome ao criar, sem família ou flags fornecidas pelo cliente', () => {
    service.criarCategoria('Pets').subscribe(result => expect(result).toEqual(categoria));
    const req = http.expectOne(`${service.API}/categories`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Pets' });
    req.flush(categoria);
  });

  it('renomeia e desativa usando o ID', () => {
    service.atualizarCategoria('pets', 'Veterinário').subscribe();
    const update = http.expectOne(`${service.API}/categories/pets`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ name: 'Veterinário' });
    update.flush({ ...categoria, name: 'Veterinário' });
    service.excluirCategoria('pets').subscribe();
    const remove = http.expectOne(`${service.API}/categories/pets`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
});
