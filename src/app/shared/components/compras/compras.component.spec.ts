import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ComprasComponent } from './compras.component';
import { CompraService } from '../../services/compra/compra.service';
import { UserService } from '../../../core/auth/user/user.service';
import { PlanService } from '../../../core/plan/plan.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('ComprasComponent', () => {
  let component: ComprasComponent;
  let fixture: ComponentFixture<ComprasComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService',
      ['listarCompras', 'atualizarCompra', 'deleteCompra']);
    compraService.listarCompras.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u1', name: 'Eu' } as any));
    const planService = jasmine.createSpyObj<PlanService>('PlanService', ['isPremium']);
    planService.isPremium.and.returnValue(true);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [ComprasComponent],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: compraService },
        { provide: UserService, useValue: userService },
        { provide: PlanService, useValue: planService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loadingLista começa true e fica false após emissão', (done) => {
    component.compras$.subscribe(() => {
      expect(component.loadingLista()).toBe(false);
      done();
    });
  });

  it('erro ao carregar lista notifica erro', (done) => {
    compraService.listarCompras.and.returnValue(throwError(() => ({ status: 500 })));
    component.recarregarCompras();
    component.compras$.subscribe(() => {
      expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar as compras.');
      done();
    });
  });

  it('delete bem-sucedido notifica sucesso', () => {
    compraService.deleteCompra.and.returnValue(of('ok'));
    (component as any).confirmDeleteCompra('c1');
    expect(notify.success).toHaveBeenCalledWith('Compra excluída!');
  });

  it('delete com erro notifica erro de negócio', () => {
    compraService.deleteCompra.and.returnValue(throwError(() => ({ status: 400 })));
    (component as any).confirmDeleteCompra('c1');
    expect(notify.error).toHaveBeenCalledWith('Não foi possível excluir a compra.');
  });
});
