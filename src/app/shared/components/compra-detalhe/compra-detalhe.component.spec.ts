import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Compra } from '../../../core/models/compra/compra';
import { PlanService } from '../../../core/plan/plan.service';
import { CompraDetalheComponent, CompraDetalheDialogData } from './compra-detalhe.component';

function makeCompra(over: Partial<Compra> = {}): Compra {
  return Object.assign(new Compra(), {
    id: 'c1',
    title: 'Mercado',
    category: 'FOOD',
    value: 120,
    unitValue: 40,
    payers: ['u1', 'u2', 'u3'],
    payerNames: ['Ana', 'Bruno', 'Carla'],
    paymentDate: '2026-09-15',
    remainingPayers: ['u2'],
    remainingPayerNames: ['Bruno'],
    purchaserId: 'u1',
    purchaserName: 'Ana',
    purchaseDate: '2026-09-14',
    showPaymentButton: true,
    isPaid: false,
  }, over);
}

describe('CompraDetalheComponent', () => {
  let fixture: ComponentFixture<CompraDetalheComponent>;
  let component: CompraDetalheComponent;
  let planService: jasmine.SpyObj<PlanService>;

  beforeEach(async () => {
    planService = jasmine.createSpyObj<PlanService>('PlanService', ['requiresPremium']);
    const data: CompraDetalheDialogData = {
      compra: makeCompra(),
      isPremium: true,
    };

    await TestBed.configureTestingModule({
      imports: [CompraDetalheComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: PlanService, useValue: planService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompraDetalheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calcula pessoas pagas e pendentes a partir da divisão', () => {
    expect(component.pagadores).toEqual(['Ana', 'Bruno', 'Carla']);
    expect(component.pendentes).toEqual(['Bruno']);
    expect(component.pagos).toEqual(['Ana', 'Carla']);
    expect(component.progressoPagamento).toBe(67);
  });

  it('aciona o fluxo premium para usuários grátis', () => {
    component.abrirUpgrade();

    expect(planService.requiresPremium).toHaveBeenCalledWith('split-payments');
  });
});
