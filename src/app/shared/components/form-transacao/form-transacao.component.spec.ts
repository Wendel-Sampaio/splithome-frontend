import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FormTransacaoComponent } from './form-transacao.component';
import { CompraService } from '../../services/compra/compra.service';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { UserService } from '../../../core/auth/user/user.service';
import { UserStateService } from '../../../core/auth/user/user-state.service';
import { PlanService } from '../../../core/plan/plan.service';
import { NotificationService } from '../../services/notification/notification.service';
import { provideBrDateAdapterTesting } from '../../testing/br-date-adapter-testing';

describe('FormTransacaoComponent', () => {
  let component: FormTransacaoComponent;
  let fixture: ComponentFixture<FormTransacaoComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FormTransacaoComponent>>;

  async function montar(data: unknown) {
    TestBed.resetTestingModule();
    compraService = jasmine.createSpyObj<CompraService>('CompraService',
      ['cadastrarCompra', 'atualizarCompra', 'listarCartoes', 'cadastrarDespesaFixa', 'atualizarDespesaFixa']);
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
        ...provideBrDateAdapterTesting(),
        { provide: CompraService, useValue: compraService },
        { provide: TransacaoService, useValue: transacaoService },
        { provide: UserService, useValue: userService },
        { provide: UserStateService, useValue: userStateService },
        { provide: PlanService, useValue: planService },
        { provide: NotificationService, useValue: notify },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormTransacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await montar(null);
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

  it('sem pagador bloqueia o envio com mensagem clara', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.pagadores = [];
    component.cadastrarTransacao();
    expect(notify.warning).toHaveBeenCalledWith('Selecione pelo menos um pagador para a conta.');
    expect(compraService.cadastrarCompra).not.toHaveBeenCalled();
  });

  it('sucesso de compra notifica success e fecha dialog', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.cadastrarTransacao();
    expect(notify.success).toHaveBeenCalledWith('Compra cadastrada com sucesso!');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.loading()).toBe(false);
  });

  it('normaliza pagador salvo por nome para id antes de enviar e deixa comprador pendente', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    (component as any).usuariosFamilia = [{ id: 'u1', name: 'Eu' }];
    component.pagadores = ['Eu'];

    component.cadastrarTransacao();

    const payload = compraService.cadastrarCompra.calls.mostRecent().args[0];
    expect(payload.payers).toEqual(['u1']);
    expect(payload.remainingPayers).toEqual(['u1']);
  });

  it('mantem todos os pagadores como pendentes ao criar compra', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.formTransacao.patchValue({ responsavel: 'u1' });
    (component as any).usuariosFamilia = [
      { id: 'u1', name: 'Eu' },
      { id: 'u2', name: 'Outro' }
    ];
    component.pagadores = ['Eu', 'Outro'];

    component.cadastrarTransacao();

    const payload = compraService.cadastrarCompra.calls.mostRecent().args[0];
    expect(payload.payers).toEqual(['u1', 'u2']);
    expect(payload.remainingPayers).toEqual(['u1', 'u2']);
  });

  it('converte valor em formato brasileiro antes de enviar compra', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.formTransacao.patchValue({ valor: 'R$ 10,91' });
    (component as any).usuariosFamilia = [{ id: 'u1', name: 'Eu' }];

    component.cadastrarTransacao();

    const payload = compraService.cadastrarCompra.calls.mostRecent().args[0];
    expect(payload.value).toBe(10.91);
  });

  it('aceita valor com centavos menor que um real digitado com vírgula', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    const campoValor: HTMLInputElement = fixture.nativeElement.querySelector('input[appValorBrl]');
    campoValor.value = '0,50';
    campoValor.dispatchEvent(new Event('input'));

    expect(component.formTransacao.get('valor')?.valid).toBeTrue();

    component.cadastrarTransacao();

    const payload = compraService.cadastrarCompra.calls.mostRecent().args[0];
    expect(payload.value).toBe(0.5);
  });

  it('bloqueia envio quando valor da compra nao e numerico', () => {
    preencher();
    component.formTransacao.patchValue({ valor: 'R$ abc' });

    component.cadastrarTransacao();

    expect(notify.warning).toHaveBeenCalledWith('Informe um valor maior que R$ 0,00.');
    expect(compraService.cadastrarCompra).not.toHaveBeenCalled();
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

  describe('despesa fixa com cartão vinculado', () => {
    const CARTAO = { id: 'c1', name: 'Nubank', brand: null, lastDigits: null, billingDay: 6, dueDay: 13 };

    beforeEach(async () => {
      await montar({ tipo: 'despesa-fixa' });
      component.cartoes = [CARTAO];
      (component as any).usuariosFamilia = [{ id: 'u1', name: 'Eu' }];
      component.pagadores = ['u1'];
    });

    function preencherDespesa(extra: Record<string, unknown> = {}) {
      component.formTransacao.patchValue({
        titulo: 'Geladeira',
        categoria: 'CASA',
        valorTotal: '464,90',
        modoCobranca: 'parcelada',
        quantidadeParcelas: 5,
        ...extra
      });
    }

    it('troca dia de vencimento e data de início pela data da compra ao escolher um cartão', () => {
      expect(component.usaDatasDoCartao).toBeFalse();

      component.formTransacao.patchValue({ cartaoId: 'c1' });

      expect(component.usaDatasDoCartao).toBeTrue();
      expect(component.formTransacao.get('dataCompra')?.hasValidator(Validators.required)).toBeTrue();
      expect(component.formTransacao.get('diaVencimento')?.hasValidator(Validators.required)).toBeFalse();
      expect(component.formTransacao.get('dataInicio')?.hasValidator(Validators.required)).toBeFalse();
    });

    it('lista todas as parcelas a partir da fatura em que a compra entrou', () => {
      preencherDespesa({ cartaoId: 'c1', dataCompra: new Date(2026, 7, 8) });

      // Comprou dia 8 num cartão que fecha dia 6: entra na fatura que vence 13/09.
      expect(component.datasVencimento.map((data) => data.toDateString())).toEqual([
        new Date(2026, 8, 13).toDateString(),
        new Date(2026, 9, 13).toDateString(),
        new Date(2026, 10, 13).toDateString(),
        new Date(2026, 11, 13).toDateString(),
        new Date(2027, 0, 13).toDateString()
      ]);
    });

    it('mantém a compra na fatura do próprio mês quando ela vem antes do fechamento', () => {
      preencherDespesa({
        quantidadeParcelas: 1,
        cartaoId: 'c1',
        dataCompra: new Date(2026, 7, 5)
      });

      expect(component.datasVencimento[0].toDateString()).toBe(new Date(2026, 7, 13).toDateString());
    });

    it('joga o vencimento para o mês seguinte ao fechamento quando o cartão vence antes de fechar', () => {
      component.cartoes = [{ ...CARTAO, billingDay: 28, dueDay: 5 }];
      preencherDespesa({
        quantidadeParcelas: 1,
        cartaoId: 'c1',
        dataCompra: new Date(2026, 2, 3)
      });

      // Fatura de março fecha dia 28 e só é paga em 05/04.
      expect(component.datasVencimento[0].toDateString()).toBe(new Date(2026, 3, 5).toDateString());
    });

    it('encolhe o dia de vencimento nos meses que não o alcançam', () => {
      component.cartoes = [{ ...CARTAO, dueDay: 31 }];
      preencherDespesa({
        quantidadeParcelas: 3,
        cartaoId: 'c1',
        dataCompra: new Date(2026, 11, 8)
      });

      expect(component.datasVencimento.map((data) => data.getDate())).toEqual([31, 28, 31]);
    });

    it('envia a data da compra no lugar do dia de vencimento e da data de início', () => {
      compraService.cadastrarDespesaFixa.and.returnValue(of({} as any));
      preencherDespesa({ cartaoId: 'c1', dataCompra: new Date(2026, 7, 8) });

      component.cadastrarTransacao();

      const payload = compraService.cadastrarDespesaFixa.calls.mostRecent().args[0];
      expect(payload.purchaseDate).toBe('2026-08-08');
      expect(payload.creditCardId).toBe('c1');
      expect(payload.dueDay).toBeUndefined();
      expect(payload.startDate).toBeUndefined();
    });

    it('sem cartão continua enviando dia de vencimento e data de início', () => {
      compraService.cadastrarDespesaFixa.and.returnValue(of({} as any));
      preencherDespesa({ diaVencimento: 10, dataInicio: new Date(2026, 7, 1) });

      component.cadastrarTransacao();

      const payload = compraService.cadastrarDespesaFixa.calls.mostRecent().args[0];
      expect(payload.dueDay).toBe(10);
      expect(payload.startDate).toBe('2026-08-01');
      expect(payload.creditCardId).toBeNull();
      expect(payload.purchaseDate).toBeUndefined();
    });
  });

  describe('edição de despesa fixa com cartão', () => {
    beforeEach(async () => {
      await montar({
        tipo: 'despesa-fixa',
        despesaFixa: {
          id: 'd1', title: 'Geladeira', category: 'CASA', valorTotal: 464.9,
          quantidadeParcelas: 5, diaVencimento: 13, dataInicio: '2026-09-13',
          creditCardId: 'c1', responsibleId: 'u1', payers: ['u1'], remainingPayers: []
        }
      });
      component.cartoes = [{ id: 'c1', name: 'Nubank', brand: null, lastDigits: null, billingDay: 6, dueDay: 13 }];
      (component as any).usuariosFamilia = [{ id: 'u1', name: 'Eu' }];
      component.pagadores = ['u1'];
    });

    it('não exige a data da compra e preserva o cronograma já salvo', () => {
      compraService.atualizarDespesaFixa.and.returnValue(of({} as any));
      expect(component.usaDatasDoCartao).toBeTrue();
      expect(component.formTransacao.get('dataCompra')?.value).toBeNull();
      expect(component.formTransacao.get('dataCompra')?.hasValidator(Validators.required)).toBeFalse();
      expect(component.datasVencimento[0].toDateString()).toBe(new Date(2026, 8, 13).toDateString());

      component.cadastrarTransacao();

      const payload = compraService.atualizarDespesaFixa.calls.mostRecent().args[1];
      expect(payload.purchaseDate).toBeUndefined();
      expect(payload.dueDay).toBe(13);
      expect(payload.startDate).toBe('2026-09-13');
      expect(payload.creditCardId).toBe('c1');
    });

    it('recalcula as datas quando a nova data da compra é informada', () => {
      compraService.atualizarDespesaFixa.and.returnValue(of({} as any));
      component.formTransacao.patchValue({ dataCompra: new Date(2026, 9, 2) });

      // Comprou dia 2, antes do fechamento no dia 6: fatura de outubro.
      expect(component.datasVencimento[0].toDateString()).toBe(new Date(2026, 9, 13).toDateString());

      component.cadastrarTransacao();

      const payload = compraService.atualizarDespesaFixa.calls.mostRecent().args[1];
      expect(payload.purchaseDate).toBe('2026-10-02');
      expect(payload.dueDay).toBeUndefined();
    });
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
