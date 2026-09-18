import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DashboardInicioComponent } from './dashboard-inicio.component';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';

describe('DashboardInicioComponent', () => {
  let component: DashboardInicioComponent;
  let fixture: ComponentFixture<DashboardInicioComponent>;
  let httpMock: HttpTestingController;
  let userService: UserService;
  let userStateService: jasmine.SpyObj<UserStateService>;

  beforeEach(async () => {
    userStateService = jasmine.createSpyObj<UserStateService>('UserStateService', ['getFamilyUsers']);
    userStateService.getFamilyUsers.and.returnValue(of([
      {
        id: 'u1',
        name: 'Joao Silva',
        email: 'joao@splithome.dev',
        phoneNumber: '',
        pixKey: '',
        familyCode: 'FAM123',
        plan: 'PREMIUM'
      },
      {
        id: 'u2',
        name: 'Maria',
        email: 'maria@splithome.dev',
        phoneNumber: '',
        pixKey: '',
        familyCode: 'FAM123',
        plan: 'PREMIUM'
      }
    ]));

    await TestBed.configureTestingModule({
      imports: [DashboardInicioComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserStateService, useValue: userStateService }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    userService = TestBed.inject(UserService);
    spyOn(userService, 'getUser').and.returnValue({
      id: 'u1',
      name: 'Joao Silva',
      email: 'joao@splithome.dev',
      phoneNumber: '',
      pixKey: '',
      familyCode: 'FAM123',
      plan: 'PREMIUM'
    });
    spyOn(userService, 'isPremium').and.returnValue(true);

    fixture = TestBed.createComponent(DashboardInicioComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    carregarDashboard();
    expect(component).toBeTruthy();
  });

  it('formata valores em BRL', () => {
    expect(component.moeda(540)).toContain('540');
    expect(component.moeda(540)).toContain('R$');
  });

  it('emite a view ao clicar em um atalho', () => {
    const spy = spyOn(component.abrirView, 'emit');
    component.ir('compras');
    expect(spy).toHaveBeenCalledWith('compras');
  });

  it('usa compras carregadas como fallback para total, em aberto e categoria traduzida', () => {
    carregarDashboard({
      compras: {
        content: [{
          id: 'c1',
          title: 'Mercado',
          category: 'OTHERS',
          value: 90,
          payers: ['Joao Silva', 'Maria', 'Ana'],
          paymentDate: '2026-09-16',
          remainingPayers: ['Joao Silva', 'Maria'],
          purchaserId: 'u1',
          purchaserName: 'Joao Silva',
          purchaseDate: '2026-09-16'
        }]
      },
      resumo: {
        balances: [],
        debts: [],
        settlements: [],
        totalOutstanding: 0
      }
    });

    expect(component.totalCompras()).toBe(1);
    expect(component.totalEmAberto()).toBe(60);
    expect(component.maiorCategoria()).toBe('OTHERS');

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Outros');
    expect(texto).not.toContain('OTHERS');
  });

  it('mantem contas individuais em aberto separadas dos valores a receber', () => {
    carregarDashboard({
      resumo: {
        balances: [
          { memberId: 'u1', memberName: 'Joao Silva', netBalance: 100 },
          { memberId: 'u2', memberName: 'Maria', netBalance: -100 }
        ],
        debts: [{ fromMemberId: 'u2', fromMemberName: 'Maria', toMemberId: 'u1', toMemberName: 'Joao Silva', amount: 100 }],
        settlements: [{ fromMemberId: 'u2', fromMemberName: 'Maria', toMemberId: 'u1', toMemberName: 'Joao Silva', amount: 100 }],
        totalOutstanding: 100
      },
      compras: {
        content: [{
          id: 'c-individual',
          title: 'Conta individual',
          category: 'OTHERS',
          value: 120,
          payers: ['u1'],
          paymentDate: '2099-09-20',
          remainingPayers: ['u1'],
          purchaserId: 'u1',
          purchaserName: 'Joao Silva',
          purchaseDate: '2099-09-16',
          isPaid: false
        }]
      },
      despesas: {
        content: [{
          id: 'd-compartilhada',
          title: 'Conta compartilhada',
          category: 'OTHERS',
          valorTotal: 200,
          quantidadeParcelas: null,
          diaVencimento: 10,
          dataInicio: '2099-09-01',
          paymentDate: '2099-09-10',
          responsibleId: 'u1',
          responsibleName: 'Joao Silva',
          creditCardId: null,
          payers: ['u1', 'u2'],
          remainingPayers: ['u2'],
          parcelas: []
        }]
      }
    });

    expect(component.totalEmAberto()).toBe(220);
    expect(component.totalAReceber()).toBe(100);
    expect(component.totalAPagar()).toBe(100);
  });

  it('monta pendencias, resumo por cartao e dados financeiros na tela inicial', () => {
    carregarDashboard({
      estatisticas: {
        totalByCategory: [{ category: 'OTHERS', total: 190 }],
        totalByMonth: [{ month: '2026-09', total: 190 }]
      },
      resumo: {
        balances: [
          { memberId: 'u1', memberName: 'Joao Silva', netBalance: 95 },
          { memberId: 'u2', memberName: 'Maria', netBalance: -95 }
        ],
        debts: [{ fromMemberId: 'u2', fromMemberName: 'Maria', toMemberId: 'u1', toMemberName: 'Joao Silva', amount: 95 }],
        settlements: [{ fromMemberId: 'u2', fromMemberName: 'Maria', toMemberId: 'u1', toMemberName: 'Joao Silva', amount: 95 }],
        totalOutstanding: 95
      },
      compras: {
        content: [{
          id: 'c1',
          title: 'Mercado',
          category: 'OTHERS',
          value: 90,
          payers: ['Joao Silva', 'Maria'],
          paymentDate: '2099-09-20',
          remainingPayers: ['Maria'],
          purchaserId: 'u1',
          purchaserName: 'Joao Silva',
          purchaseDate: '2099-09-16',
          isPaid: false
        }]
      },
      despesas: {
        content: [{
          id: 'd1',
          title: 'Internet',
          category: 'OTHERS',
          valorTotal: 100,
          quantidadeParcelas: null,
          diaVencimento: 10,
          dataInicio: '2099-09-01',
          paymentDate: '2099-09-10',
          responsibleId: 'u1',
          responsibleName: 'Joao Silva',
          creditCardId: 'card-1',
          creditCardName: 'Nubank Casa',
          payers: ['Joao Silva', 'Maria'],
          remainingPayers: ['Maria'],
          parcelas: []
        }]
      },
      cartoes: [{
        id: 'card-1',
        name: 'Nubank Casa',
        brand: 'MASTERCARD',
        lastDigits: '4321',
        billingDay: 25,
        dueDay: 5
      }]
    });

    expect(component.contasPendentes().length).toBe(2);
    expect(component.cartoesResumo()[0].name).toBe('Nubank Casa');
    expect(component.cartoesResumo()[0].pendente).toBe(50);
    expect(component.totalAReceber()).toBe(95);
    expect(component.totalAPagar()).toBe(95);
    expect(component.pagamentosSugeridos()).toBe(1);

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Contas ainda');
    expect(texto).toContain('Nubank Casa');
    expect(texto).toContain('Gastos por categoria');
    expect(texto).toContain('Maria deve para Joao Silva');
  });

  it('resolve nomes ausentes nas contas pendentes para nao exibir undefined', () => {
    carregarDashboard({
      compras: {
        content: [{
          id: 'c1',
          title: 'Rio Tinto',
          category: 'OTHERS',
          value: 18.70,
          payers: ['u1', 'u2'],
          paymentDate: '2099-09-07',
          remainingPayers: ['u2'],
          purchaserId: 'u1',
          purchaseDate: '2099-09-07',
          isPaid: false
        }]
      },
      despesas: {
        content: [{
          id: 'd1',
          title: 'Internet',
          category: 'OTHERS',
          valorTotal: 100,
          quantidadeParcelas: null,
          diaVencimento: 10,
          dataInicio: '2099-09-01',
          paymentDate: '2099-09-10',
          responsibleId: 'u2',
          creditCardId: null,
          payers: ['u1', 'u2'],
          remainingPayers: ['u1'],
          parcelas: []
        }]
      }
    });

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Rio Tinto');
    expect(texto).toContain('Joao Silva');
    expect(texto).toContain('Maria');
    expect(texto).not.toContain('undefined');
  });

  function carregarDashboard(payload?: {
    estatisticas?: Record<string, unknown>;
    resumo?: Record<string, unknown>;
    compras?: Record<string, unknown>;
    despesas?: Record<string, unknown>;
    cartoes?: Record<string, unknown>[];
  }): void {
    fixture.detectChanges();

    httpMock.expectOne(request => request.url.endsWith('/stats/summary')).flush(
      payload?.estatisticas ?? {
        totalByCategory: [{ category: 'OTHERS', total: 90 }],
        totalByMonth: [{ month: '2026-09', total: 90 }],
        grandTotal: 90
      }
    );
    httpMock.expectOne(request => request.url.endsWith('/stats/financial-summary')).flush(
      payload?.resumo ?? {
        balances: [],
        debts: [],
        settlements: [],
        totalOutstanding: 0
      }
    );
    httpMock.expectOne(request => request.url.endsWith('/transactions/purchases')).flush(
      payload?.compras ?? { content: [], totalElements: 0 }
    );
    httpMock.expectOne(request => request.url.endsWith('/transactions/fixed-expenses')).flush(
      payload?.despesas ?? { content: [], totalElements: 0 }
    );
    httpMock.expectOne(request => request.url.endsWith('/transactions/credit-cards')).flush(payload?.cartoes ?? []);
  }
});
