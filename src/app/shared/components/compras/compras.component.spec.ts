import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ComprasComponent } from './compras.component';
import { UserService } from '../../../core/auth/user/user.service';
import { Compra } from '../../../core/models/compra/compra';
import { User } from '../../../core/models/user/user';

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
    it('comprador com remainingPayers pendentes → isPaid vira false', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ id: 'u1' }));
      const compra = makeCompra({ purchaserId: 'u1', remainingPayers: ['Maria'], isPaid: true });
      expect(component.verificarPagamento(compra)).toBeFalse();
      expect(compra.isPaid).toBeFalse();
    });

    it('comprador sem remainingPayers → mantém isPaid', () => {
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
  });
});
