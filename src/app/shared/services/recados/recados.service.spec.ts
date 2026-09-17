import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';

import { RecadosService } from './recados.service';

describe('RecadosService', () => {
  let service: RecadosService;
  let httpMock: HttpTestingController;
  const api = `${environment.apiUrl}/recados`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RecadosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista os recados persistidos da API', () => {
    const recados = [
      {
        id: 'recado-1',
        content: 'Comprar cafe',
        authorName: 'Ana',
        createdAt: '2026-09-17T10:00:00Z'
      }
    ];

    service.listar().subscribe(response => {
      expect(response).toEqual(recados);
    });

    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush(recados);
  });

  it('cria recado enviando apenas o conteudo', () => {
    const recado = {
      id: 'recado-1',
      content: 'Aviso',
      authorName: 'Ana',
      createdAt: '2026-09-17T10:00:00Z'
    };

    service.criar({ content: '  Aviso  ' }).subscribe(response => {
      expect(response).toEqual(recado);
    });

    const req = httpMock.expectOne(api);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Aviso' });
    req.flush(recado);
  });
});
