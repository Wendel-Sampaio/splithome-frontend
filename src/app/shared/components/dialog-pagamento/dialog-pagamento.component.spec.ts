import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DialogPagamentoComponent } from './dialog-pagamento.component';
import { UserService } from '../../../core/auth/user/user.service';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('DialogPagamentoComponent', () => {
  let component: DialogPagamentoComponent;
  let fixture: ComponentFixture<DialogPagamentoComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DialogPagamentoComponent>>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService', ['atualizarCompra', 'atualizarDespesaFixa']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u2', name: 'Outro' } as any));
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<DialogPagamentoComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DialogPagamentoComponent],
      providers: [
        provideHttpClient(),
        { provide: UserService, useValue: userService },
        { provide: CompraService, useValue: compraService },
        { provide: NotificationService, useValue: notify },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {
          id: 'c1', remainingPayers: ['Eu'], purchaserId: 'u2', tipo: 'compra'
        }}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogPagamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('pagamento de compra com sucesso notifica e fecha', () => {
    compraService.atualizarCompra.and.returnValue(of({} as any));
    component.efetuarPagamento();
    expect(compraService.atualizarCompra).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Pagamento registrado!');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.loading()).toBe(false);
  });

  it('erro de pagamento notifica erro', () => {
    compraService.atualizarCompra.and.returnValue(throwError(() => ({ status: 500 })));
    component.efetuarPagamento();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível registrar o pagamento.');
    expect(component.loading()).toBe(false);
  });
});
