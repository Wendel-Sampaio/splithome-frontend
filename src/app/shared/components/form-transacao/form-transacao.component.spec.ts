import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FormTransacaoComponent } from './form-transacao.component';
import { CompraService } from '../../services/compra/compra.service';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { PlanService } from '../../../core/plan/plan.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('FormTransacaoComponent', () => {
  let component: FormTransacaoComponent;
  let fixture: ComponentFixture<FormTransacaoComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FormTransacaoComponent>>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService',
      ['cadastrarCompra', 'atualizarCompra', 'listarCartoes']);
    compraService.listarCartoes.and.returnValue(of([]));
    const transacaoService = jasmine.createSpyObj<TransacaoService>('TransacaoService', ['listarCategorias']);
    transacaoService.listarCategorias.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService',
      ['getUser', 'getAllUsers', 'getProfilePhoto', 'getUserById']);
    userService.getUser.and.returnValue({
      id: 'u1', name: 'Eu', email: '', phoneNumber: '', pixKey: '',
      familyCode: 'F1', plan: 'PREMIUM', profilePhoto: ''
    } as any);
    userService.getAllUsers.and.returnValue(of([]));
    userService.getUserById.and.returnValue(of({ id: 'u2', name: 'Outro' } as any));
    const userStateService = jasmine.createSpyObj<any>('UserStateService', ['getFamilyUsers']);
    userStateService.getFamilyUsers.and.returnValue(of([]));
    const planService = jasmine.createSpyObj<PlanService>('PlanService', ['isPremium']);
    planService.isPremium.and.returnValue(true);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<FormTransacaoComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [FormTransacaoComponent],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: compraService },
        { provide: TransacaoService, useValue: transacaoService },
        { provide: UserService, useValue: userService },
        { provide: UserStateService, useValue: userStateService },
        { provide: PlanService, useValue: planService },
        { provide: NotificationService, useValue: notify },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormTransacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function preencher() {
    component.formTransacao.patchValue({
      titulo: 'X', categoria: 'C', valor: '10', dataPagamento: new Date()
    });
    component.pagadores = ['Eu'];
  }

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('sem pagador não bloqueia mais o envio (pagadores são opcionais)', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.pagadores = [];
    component.cadastrarTransacao();
    expect(notify.warning).not.toHaveBeenCalledWith('Selecione pelo menos um pagador.');
    expect(notify.warning).not.toHaveBeenCalled();
    expect(compraService.cadastrarCompra).toHaveBeenCalled();
  });

  it('sucesso de compra notifica success e fecha dialog', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.cadastrarTransacao();
    expect(notify.success).toHaveBeenCalledWith('Compra cadastrada com sucesso!');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.loading()).toBe(false);
  });

  it('usuário free pode cadastrar compra sem divisão de pagadores', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.pagadores = ['Eu'];
    (component as any).isPremium = false;

    component.cadastrarTransacao();

    expect(notify.warning).not.toHaveBeenCalled();
    expect(compraService.cadastrarCompra).toHaveBeenCalled();
    const payload = compraService.cadastrarCompra.calls.mostRecent().args[0];
    expect(payload.payers).toEqual([]);
    expect(payload.remainingPayers).toEqual([]);
    expect(payload.paymentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.purchaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('permite selecionar membros da mesma familia independentemente do plano do membro', () => {
    const membroFamilia = {
      id: 'u2',
      name: 'Outro',
      email: '',
      phoneNumber: '',
      pixKey: '',
      familyCode: 'F1',
      plan: 'FREE',
      profilePhoto: ''
    };

    expect((component as any).usuarioPodeSerPagador(membroFamilia)).toBeTrue();
  });

  it('erro de compra notifica error e mantém dialog aberto', () => {
    compraService.cadastrarCompra.and.returnValue(throwError(() => ({ status: 500 })));
    preencher();
    component.cadastrarTransacao();
    expect(notify.error).toHaveBeenCalledWith('Erro ao cadastrar compra.');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });
});
