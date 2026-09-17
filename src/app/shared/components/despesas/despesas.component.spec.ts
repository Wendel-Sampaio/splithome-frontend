import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { DespesasComponent } from './despesas.component';
import { CompraService } from '../../services/compra/compra.service';
import { UserService } from '../../../core/auth/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';

describe('DespesasComponent', () => {
  let component: DespesasComponent;
  let fixture: ComponentFixture<DespesasComponent>;
  let despesaService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let userStateService: jasmine.SpyObj<UserStateService>;

  beforeEach(async () => {
    despesaService = jasmine.createSpyObj<CompraService>('CompraService',
      ['listarDespesas', 'atualizarDespesa', 'deleteDespesa', 'cadastrarDespesa']);
    despesaService.listarDespesas.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu', plan: 'PREMIUM' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u1', name: 'Eu' } as any));
    userStateService = jasmine.createSpyObj<UserStateService>('UserStateService', ['getFamilyUsers']);
    userStateService.getFamilyUsers.and.returnValue(of([
      { id: 'u1', name: 'Eu' },
      { id: 'u2', name: 'Maria' },
      { id: 'u3', name: 'Bruno' }
    ] as any));
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [DespesasComponent],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: despesaService },
        { provide: UserService, useValue: userService },
        { provide: UserStateService, useValue: userStateService },
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

  it('importa despesas de arquivo OFX', () => {
    despesaService.cadastrarDespesa.and.returnValue(of({}));
    const file = new File(['conteudo'], 'extrato.ofx');
    const input = { files: [file], value: 'extrato.ofx' } as unknown as HTMLInputElement;
    spyOn(component as any, 'lerArquivo').and.returnValue(of(`
      <STMTTRN>
        <DTPOSTED>20260701
        <TRNAMT>-25.90
        <NAME>Padaria
      </STMTTRN>
    `));

    component.importarOfx({ target: input } as unknown as Event);

    expect(despesaService.cadastrarDespesa).toHaveBeenCalledOnceWith({
      title: 'Padaria',
      category: 'OTHERS',
      value: 25.9,
      paymentDate: '2026-07-01',
      responsibleId: 'u1',
      payers: ['u1'],
      remainingPayers: ['u1']
    });
    expect(notify.success).toHaveBeenCalledWith('1 despesa(s) importada(s) com sucesso!');
  });

  it('resolve nomes de pagadores usando os membros da familia', (done) => {
    component.tratamentoLista([{
      id: 'd1',
      title: 'Conta de luz',
      category: 'HOME',
      value: 90,
      paymentDate: '',
      responsibleId: 'u2',
      responsibleName: '',
      payers: ['u1', 'u2', 'u3'],
      remainingPayers: ['u3'],
      isPaid: false
    } as any]).subscribe((despesas) => {
      expect(despesas[0].responsibleName).toBe('Maria');
      expect(despesas[0].payerNames).toEqual(['Eu', 'Maria', 'Bruno']);
      expect(despesas[0].remainingPayerNames).toEqual(['Bruno']);
      done();
    });
  });

  it('não importa arquivo que não seja OFX', () => {
    const file = new File(['conteudo'], 'extrato.txt');
    const input = { files: [file], value: 'extrato.txt' } as unknown as HTMLInputElement;

    component.importarOfx({ target: input } as unknown as Event);

    expect(despesaService.cadastrarDespesa).not.toHaveBeenCalled();
    expect(notify.error).toHaveBeenCalledWith('Selecione um arquivo OFX válido.');
  });
});
