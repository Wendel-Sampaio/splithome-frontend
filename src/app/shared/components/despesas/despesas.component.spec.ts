import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DespesasComponent } from './despesas.component';
import { CompraService } from '../../services/compra/compra.service';
import { UserService } from '../../../core/auth/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('DespesasComponent', () => {
  let component: DespesasComponent;
  let fixture: ComponentFixture<DespesasComponent>;
  let despesaService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    despesaService = jasmine.createSpyObj<CompraService>('CompraService',
      ['listarDespesas', 'atualizarDespesa', 'deleteDespesa']);
    despesaService.listarDespesas.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u1', name: 'Eu' } as any));
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [DespesasComponent],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: despesaService },
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loadingLista começa true e fica false após emissão', (done) => {
    component.despesas$.subscribe(() => {
      expect(component.loadingLista()).toBe(false);
      done();
    });
  });

  it('erro ao carregar lista notifica erro', (done) => {
    despesaService.listarDespesas.and.returnValue(throwError(() => ({ status: 500 })));
    component.recarregarDespesas();
    component.despesas$.subscribe(() => {
      expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar as despesas.');
      done();
    });
  });

  it('delete bem-sucedido notifica sucesso', () => {
    despesaService.deleteDespesa.and.returnValue(of('ok'));
    (component as any).confirmDeleteDespesa('d1');
    expect(notify.success).toHaveBeenCalledWith('Despesa excluída!');
  });

  it('delete com erro notifica erro de negócio', () => {
    despesaService.deleteDespesa.and.returnValue(throwError(() => ({ status: 400 })));
    (component as any).confirmDeleteDespesa('d1');
    expect(notify.error).toHaveBeenCalledWith('Não foi possível excluir a despesa.');
  });
});
