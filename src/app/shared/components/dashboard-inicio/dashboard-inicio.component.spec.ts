import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardInicioComponent } from './dashboard-inicio.component';
import { UserService } from '../../../core/auth/user/user.service';

describe('DashboardInicioComponent', () => {
  let component: DashboardInicioComponent;
  let fixture: ComponentFixture<DashboardInicioComponent>;
  let httpMock: HttpTestingController;
  let userService: UserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardInicioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
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
    expect(component.totalEmAberto()).toBe(30);
    expect(component.maiorCategoria()).toBe('OTHERS');

    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Outros');
    expect(texto).not.toContain('OTHERS');
  });

  function carregarDashboard(payload?: {
    estatisticas?: Record<string, unknown>;
    resumo?: Record<string, unknown>;
    compras?: Record<string, unknown>;
    despesas?: Record<string, unknown>;
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
  }
});
