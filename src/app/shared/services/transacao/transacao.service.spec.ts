import { TestBed } from '@angular/core/testing';

import { TransacaoService } from './transacao.service';

describe('TransacaoService', () => {
  let service: TransacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransacaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
