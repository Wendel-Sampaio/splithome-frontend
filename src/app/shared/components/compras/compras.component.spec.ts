import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ComprasComponent } from './compras.component';
import { UserService } from '../../../core/auth/user/user.service';
import { Compra } from '../../../core/models/compra/compra';
import { User } from '../../../core/models/user/user';
import { CompraDetalheComponent } from '../compra-detalhe/compra-detalhe.component';

function makeUser(over: Partial<User> = {}): User {
  return { id: 'u1', name: 'João', email: '', phoneNumber: '', pixKey: '', familyCode: '', plan: 'FREE', profilePhoto: '', ...over } as User;
}

function makeCompra(over: Partial<Compra> = {}): Compra {
  return Object.assign(new Compra(), {
    id: 'c1', title: 'Mercado', category: 'FOOD', value: 100, unitValue: 50,
    payers: ['João', 'Maria'], paymentDate: '', remainingPayers: ['Maria'],
    purchaserId: 'u1', purchaserName: 'João', purchaseDate: '', showPaymentButton: true, isPaid: false
  }, over);
}

describe('ComprasComponent', () => {
  let component: ComprasComponent;
  let fixture: ComponentFixture<ComprasComponent>;
  let userService: UserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  describe('verificaUserRemainingPayers', () => {
    it('true quando o usuário está em remainingPayers', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ name: 'Maria' }));
      expect(component.verificaUserRemainingPayers(makeCompra({ remainingPayers: ['Maria'] }))).toBeTrue();
    });

    it('false quando o usuário não está em remainingPayers', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ name: 'João' }));
      expect(component.verificaUserRemainingPayers(makeCompra({ remainingPayers: ['Maria'] }))).toBeFalse();
    });
  });

  describe('verificarPagamento', () => {
    it('não força comprador como não pago quando a compra já veio marcada como paga para o usuário', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ id: 'u1' }));
      const compra = makeCompra({ purchaserId: 'u1', remainingPayers: ['Maria'], isPaid: true });
      expect(component.verificarPagamento(compra)).toBeTrue();
      expect(compra.isPaid).toBeTrue();
    });

    it('mantém compra paga quando não há pendências para o usuário', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ id: 'u1' }));
      const compra = makeCompra({ purchaserId: 'u1', remainingPayers: [], isPaid: true });
      expect(component.verificarPagamento(compra)).toBeTrue();
    });
  });

  describe('tratamentoLista', () => {
    it('lista vazia resolve para []', async () => {
      const resultado = await firstValueFrom(component.tratamentoLista([]));
      expect(resultado).toEqual([]);
    });

    it('mostra botão de pagamento para o comprador quando ele também é pagador', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ id: 'u1', name: 'João' }));
      const compra = makeCompra({
        purchaserId: 'u1',
        payers: ['u1'],
        remainingPayers: ['u1']
      });

      const preparada = (component as any).prepararCompra(compra, new Map([['u1', 'João']]));

      expect(preparada.showPaymentButton).toBeTrue();
      expect(preparada.isPaid).toBeFalse();
    });
  });

  it('identifica e limpa filtros ativos', () => {
    component.filterForm.patchValue({ title: 'mercado' });

    expect(component.hasActiveFilters).toBeTrue();

    component.limparFiltros();

    expect(component.hasActiveFilters).toBeFalse();
    expect(component.filterForm.value.title).toBe('');
    expect(component.filterForm.value.category).toBeNull();
  });

  it('abre o detalhe da compra com o estado premium atual', () => {
    spyOn(component.planService, 'isPremium').and.returnValue(true);
    const openSpy = spyOn((component as any).modal, 'open');
    const compra = makeCompra();

    component.abrirDetalheCompra(compra);

    expect(openSpy).toHaveBeenCalledWith(CompraDetalheComponent, jasmine.objectContaining({
      size: 'xl',
      data: {
        compra,
        isPremium: true
      }
    }));
  });
});
