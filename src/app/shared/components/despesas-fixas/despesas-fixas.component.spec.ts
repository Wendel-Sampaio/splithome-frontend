import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { DespesasFixasComponent } from './despesas-fixas.component';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { DespesaFixa } from '../../../core/models/despesa-fixa/despesa-fixa';

describe('DespesasFixasComponent', () => {
  let component: DespesasFixasComponent;
  let fixture: ComponentFixture<DespesasFixasComponent>;

  function despesa(parcial: Partial<DespesaFixa>): DespesaFixa {
    return {
      id: 'd1',
      title: 'Pague menos',
      category: 'OTHERS',
      valorTotal: 464.9,
      quantidadeParcelas: 5,
      diaVencimento: 13,
      dataInicio: '2026-09-13',
      paymentDate: '2026-09-13',
      responsibleId: 'u1',
      responsibleName: 'Ana Teste',
      creditCardId: null,
      payers: ['u1'],
      remainingPayers: [],
      parcelas: [],
      ...parcial
    } as DespesaFixa;
  }

  function parcela(numero: number, pago: boolean, dataVencimento = '2026-09-13') {
    return { id: `p${numero}`, numero, valor: 92.98, dataVencimento, pago, pagadores: ['u1'] } as any;
  }

  beforeEach(async () => {
    const compraService = jasmine.createSpyObj<CompraService>('CompraService', ['listarDespesasFixas']);
    compraService.listarDespesasFixas.and.returnValue(
      of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } as any)
    );
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Ana Teste' } as any);
    const userStateService = jasmine.createSpyObj<any>('UserStateService', ['getFamilyUsers']);
    userStateService.getFamilyUsers.and.returnValue(of([]));
    const notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [DespesasFixasComponent],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: compraService },
        { provide: UserService, useValue: userService },
        { provide: UserStateService, useValue: userStateService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasFixasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('resumoSecundario', () => {
    it('mostra o andamento do parcelamento em vez da data de início', () => {
      const parcelada = despesa({ parcelas: [parcela(1, true), parcela(2, false), parcela(3, false)] });

      expect(component.resumoSecundario(parcelada)).toBe('1 de 3 pagas');
    });

    it('mostra desde quando a recorrência corre, que nenhum outro campo informa', () => {
      const recorrente = despesa({ quantidadeParcelas: null, dataInicio: '2026-09-13' });

      expect(component.resumoSecundario(recorrente)).toBe('Início 13/09/2026');
    });
  });

  describe('rotuloVencimento', () => {
    it('diz a regra por extenso para não se confundir com a data da próxima cobrança', () => {
      const comParcela = despesa({ parcelas: [parcela(1, false)] });

      expect(component.rotuloVencimento(comParcela)).toBe('Todo dia 13');
      expect(component.proximaCobranca(comParcela)).toBe('13/09/2026');
    });
  });

  describe('iconeCobranca', () => {
    it('distingue parcelamento de recorrência', () => {
      expect(component.iconeCobranca(despesa({}))).toBe('layers');
      expect(component.iconeCobranca(despesa({ quantidadeParcelas: null }))).toBe('autorenew');
    });
  });

  describe('proximaCobranca', () => {
    it('aponta a primeira parcela em aberto', () => {
      const comPaga = despesa({
        parcelas: [parcela(1, true, '2026-09-13'), parcela(2, false, '2026-10-13')]
      });

      expect(component.proximaCobranca(comPaga)).toBe('13/10/2026');
    });

    it('avisa quando tudo já foi pago', () => {
      expect(component.proximaCobranca(despesa({ parcelas: [parcela(1, true)] }))).toBe('Quitada');
    });

    it('não repete o dia de vencimento quando não há parcelas para datar', () => {
      expect(component.proximaCobranca(despesa({ parcelas: [] }))).toBe('—');
    });
  });
});
