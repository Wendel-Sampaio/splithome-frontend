import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ComprasComponent } from './compras.component';
import { CompraService } from '../../services/compra/compra.service';
import { UserService } from '../../../core/auth/user/user.service';
import { Compra } from '../../../core/models/compra/compra';
import { User } from '../../../core/models/user/user';

/**
 * Testes para ComprasComponent.
 *
 * Bugs cobertos:
 * 1. calculaValorUnitario: divisão por zero → Infinity quando payers está vazio
 * 2. formatNomesPagadores: uso de .pop() muta o array antes da restauração
 *    (restauração ocorre, mas a janela de mutação existe e pode causar efeitos
 *    colaterais em chamadas concorrentes via Observable; além disso, array vazio
 *    não é tratado)
 * 3. formatNomesPagadoresRestantes: mesmo padrão de mutação
 *
 * Riscos adicionais testados:
 * - verificaUserRemainingPayers com lista vazia
 * - mudarStatusDaCompra em todos os cenários
 * - formatCategoria com categoria desconhecida (caso não mapeado)
 */
describe('ComprasComponent', () => {
  let component: ComprasComponent;
  let fixture: ComponentFixture<ComprasComponent>;
  let compraServiceSpy: jasmine.SpyObj<CompraService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  const mockUser: User = {
    id: 'user-joao-001',
    name: 'João',
    email: 'joao@test.com',
    phoneNumber: '11999999999',
    pixKey: 'joao@pix.com',
    familyCode: 'ABCD1234'
  };

  function makeCompra(overrides: Partial<Compra> = {}): Compra {
    const c = new Compra();
    c.id = 'compra-001';
    c.title = 'Compra Teste';
    c.category = 'FOOD';
    c.value = 90;
    c.payers = ['João', 'Maria', 'Pedro'];
    c.remainingPayers = ['João', 'Maria'];
    c.purchaserId = 'user-joao-001';
    c.purchaseDate = '2026-04-01';
    c.paymentDate = '2026-04-30';
    c.isPaid = false;
    c.showPaymentButton = true;
    return Object.assign(c, overrides);
  }

  beforeEach(async () => {
    compraServiceSpy = jasmine.createSpyObj('CompraService', [
      'listarCompras', 'atualizarCompra', 'deleteCompra', 'cadastrarCompra'
    ]);
    compraServiceSpy.listarCompras.and.returnValue(of([]));
    compraServiceSpy.atualizarCompra.and.returnValue(of({}));
    compraServiceSpy.deleteCompra.and.returnValue(of('ok'));

    userServiceSpy = jasmine.createSpyObj('UserService', ['getUser', 'getUserById', 'getToken']);
    userServiceSpy.getUser.and.returnValue(mockUser);
    userServiceSpy.getUserById.and.returnValue(of(mockUser));

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ComprasComponent, NoopAnimationsModule],
      providers: [
        { provide: CompraService, useValue: compraServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve chamar listarCompras no ngOnInit', () => {
    expect(compraServiceSpy.listarCompras).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // calculaValorUnitario
  // -------------------------------------------------------------------------

  describe('calculaValorUnitario', () => {

    it('deve dividir o valor pelo número de pagadores', () => {
      const compra = makeCompra({ value: 90, payers: ['João', 'Maria', 'Pedro'] });
      component.calculaValorUnitario(compra);
      expect(compra.unitValue).toBe(30);
    });

    it('deve retornar 0 para valor zero', () => {
      const compra = makeCompra({ value: 0, payers: ['João'] });
      component.calculaValorUnitario(compra);
      expect(compra.unitValue).toBe(0);
    });

    /**
     * BUG: payers vazio causa divisão por zero → Infinity.
     * Impacto: a tabela exibe "Infinity" como valor unitário,
     * causando confusão para o usuário final.
     * Correção sugerida: verificar payers.length === 0 antes de dividir.
     */
    it('deve resultar em Infinity quando lista de pagadores está vazia — BUG divisão por zero', () => {
      const compra = makeCompra({ value: 100, payers: [] });
      component.calculaValorUnitario(compra);
      expect(compra.unitValue).toBe(Infinity);
    });

    it('deve calcular corretamente para um único pagador', () => {
      const compra = makeCompra({ value: 50, payers: ['João'] });
      component.calculaValorUnitario(compra);
      expect(compra.unitValue).toBe(50);
    });
  });

  // -------------------------------------------------------------------------
  // formatNomesPagadores
  // -------------------------------------------------------------------------

  describe('formatNomesPagadores', () => {

    it('deve retornar o nome diretamente para um único pagador', () => {
      const compra = makeCompra({ payers: ['João'] });
      component.formatNomesPagadores(compra);
      expect(compra.formatedPayers).toBe('João');
    });

    it('deve formatar dois pagadores com "e" sem vírgula', () => {
      const compra = makeCompra({ payers: ['João', 'Maria'] });
      component.formatNomesPagadores(compra);
      expect(compra.formatedPayers).toBe('João e Maria');
    });

    it('deve formatar múltiplos pagadores com vírgulas e "e" antes do último', () => {
      const compra = makeCompra({ payers: ['João', 'Maria', 'Pedro'] });
      component.formatNomesPagadores(compra);
      expect(compra.formatedPayers).toBe('João, Maria e Pedro');
    });

    /**
     * RISCO: .pop() muta o array original temporariamente antes de restaurar.
     * Verifica que o array está completo após a formatação.
     */
    it('deve restaurar o array de pagadores original após usar .pop()', () => {
      const originalPayers = ['João', 'Maria', 'Pedro'];
      const compra = makeCompra({ payers: [...originalPayers] });
      component.formatNomesPagadores(compra);
      expect(compra.payers).toEqual(originalPayers);
      expect(compra.payers.length).toBe(3);
    });

    it('deve restaurar array de dois pagadores após formatação', () => {
      const compra = makeCompra({ payers: ['Ana', 'Bruno'] });
      component.formatNomesPagadores(compra);
      expect(compra.payers).toEqual(['Ana', 'Bruno']);
    });

    it('deve chamar tratamento correto sem alterar outros campos da compra', () => {
      const compra = makeCompra({ payers: ['João', 'Maria'], value: 100 });
      component.formatNomesPagadores(compra);
      // Outros campos não devem ser alterados
      expect(compra.value).toBe(100);
      expect(compra.remainingPayers).toEqual(['João', 'Maria']);
    });
  });

  // -------------------------------------------------------------------------
  // formatNomesPagadoresRestantes
  // -------------------------------------------------------------------------

  describe('formatNomesPagadoresRestantes', () => {

    it('deve exibir mensagem de confirmação quando nenhum pagamento está pendente', () => {
      const compra = makeCompra({ remainingPayers: [] });
      component.formatNomesPagadoresRestantes(compra);
      expect(compra.formatedRemainingPayers).toBe('Todos efetuaram o pagamento.');
    });

    it('deve exibir o nome quando há um único pagador restante', () => {
      const compra = makeCompra({ remainingPayers: ['Maria'] });
      component.formatNomesPagadoresRestantes(compra);
      expect(compra.formatedRemainingPayers).toBe('Maria');
    });

    it('deve formatar dois pagadores restantes com "e"', () => {
      const compra = makeCompra({ remainingPayers: ['Maria', 'Pedro'] });
      component.formatNomesPagadoresRestantes(compra);
      expect(compra.formatedRemainingPayers).toBe('Maria e Pedro');
    });

    it('deve formatar múltiplos pagadores restantes com vírgulas', () => {
      const compra = makeCompra({ remainingPayers: ['Ana', 'Bruno', 'Carlos'] });
      component.formatNomesPagadoresRestantes(compra);
      expect(compra.formatedRemainingPayers).toBe('Ana, Bruno e Carlos');
    });

    /**
     * RISCO: mesma lógica de .pop() com restauração — verifica integridade do array.
     */
    it('deve restaurar o array de pagadores restantes após usar .pop()', () => {
      const originalRestantes = ['Maria', 'Pedro'];
      const compra = makeCompra({ remainingPayers: [...originalRestantes] });
      component.formatNomesPagadoresRestantes(compra);
      expect(compra.remainingPayers).toEqual(originalRestantes);
      expect(compra.remainingPayers.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // verificaUserRemainingPayers
  // -------------------------------------------------------------------------

  describe('verificaUserRemainingPayers', () => {

    it('deve retornar true quando usuário autenticado está nos pagadores restantes', () => {
      const compra = makeCompra({ remainingPayers: ['João', 'Maria'] });
      expect(component.verificaUserRemainingPayers(compra)).toBeTrue();
    });

    it('deve retornar false quando usuário autenticado não está nos pagadores restantes', () => {
      const compra = makeCompra({ remainingPayers: ['Maria', 'Pedro'] });
      expect(component.verificaUserRemainingPayers(compra)).toBeFalse();
    });

    it('deve retornar false quando a lista de pagadores restantes está vazia', () => {
      const compra = makeCompra({ remainingPayers: [] });
      expect(component.verificaUserRemainingPayers(compra)).toBeFalse();
    });

    it('deve ser case-sensitive na comparação de nomes', () => {
      const compra = makeCompra({ remainingPayers: ['joao'] }); // minúsculo
      // UserService retorna 'João' (com maiúscula e cedilha)
      expect(component.verificaUserRemainingPayers(compra)).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // mudarStatusDaCompra
  // -------------------------------------------------------------------------

  describe('mudarStatusDaCompra', () => {

    it('deve marcar compra como não paga quando usuário está nos pagadores restantes', () => {
      const compra = makeCompra({ remainingPayers: ['João'], isPaid: true });
      component.mudarStatusDaCompra(compra);
      expect(compra.isPaid).toBeFalse();
    });

    it('deve marcar compra como paga quando usuário não está nos pagadores restantes', () => {
      const compra = makeCompra({ remainingPayers: ['Maria'], isPaid: false });
      component.mudarStatusDaCompra(compra);
      expect(compra.isPaid).toBeTrue();
    });

    it('deve marcar compra como paga quando lista de restantes está vazia', () => {
      const compra = makeCompra({ remainingPayers: [], isPaid: false });
      component.mudarStatusDaCompra(compra);
      expect(compra.isPaid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // formatCategoria
  // -------------------------------------------------------------------------

  describe('formatCategoria', () => {

    const mapeamentos: Array<[string, string]> = [
      ['CLEANING',  'Limpeza'],
      ['FOOD',      'Alimento'],
      ['UTILITIES', 'Utilitários'],
      ['RENT',      'Aluguel'],
      ['INTERNET',  'Internet'],
      ['ENERGY',    'Energia'],
      ['WATER',     'Água'],
      ['GAS',       'Gás'],
      ['OTHERS',    'Outros'],
    ];

    mapeamentos.forEach(([input, esperado]) => {
      it(`deve traduzir "${input}" para "${esperado}"`, () => {
        const compra = makeCompra({ category: input });
        component.formatCategoria(compra);
        expect(compra.category).toBe(esperado);
      });
    });

    it('deve manter o valor original para categoria não mapeada', () => {
      const compra = makeCompra({ category: 'CATEGORIA_DESCONHECIDA' });
      component.formatCategoria(compra);
      expect(compra.category).toBe('CATEGORIA_DESCONHECIDA');
    });
  });

  // -------------------------------------------------------------------------
  // verificarPagamento
  // -------------------------------------------------------------------------

  describe('verificarPagamento', () => {

    it('deve retornar isPaid=false quando comprador tem pagadores restantes', () => {
      // Element onde o usuário autenticado É o comprador e há restantes
      const compra = makeCompra({
        purchaserId: 'user-joao-001',
        remainingPayers: ['Maria'],
        isPaid: true
      });
      const resultado = component.verificarPagamento(compra);
      expect(resultado).toBeFalse();
    });

    it('deve retornar isPaid quando usuário não é o comprador', () => {
      const compra = makeCompra({
        purchaserId: 'outro-user-999',
        remainingPayers: ['Maria'],
        isPaid: true
      });
      const resultado = component.verificarPagamento(compra);
      expect(resultado).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // tratamentoLista — smoke test de integração dos formatadores
  // -------------------------------------------------------------------------

  describe('tratamentoLista', () => {

    it('deve processar lista de compras sem lançar exceções', () => {
      const compras = [
        makeCompra({ payers: ['João', 'Maria'], remainingPayers: ['João'] }),
        makeCompra({ payers: ['Pedro'], remainingPayers: [] })
      ];
      expect(() => component.tratamentoLista(compras)).not.toThrow();
    });

    it('deve processar lista vazia sem erros', () => {
      expect(() => component.tratamentoLista([])).not.toThrow();
    });
  });
});
