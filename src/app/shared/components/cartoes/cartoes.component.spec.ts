import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Cartao } from '../../../core/models/cartao/cartao';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';
import { ModalService } from '../ui/modal';
import { CartoesComponent } from './cartoes.component';

describe('CartoesComponent', () => {
  let component: CartoesComponent;
  let fixture: ComponentFixture<CartoesComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let modal: jasmine.SpyObj<ModalService>;

  const fakeCartao: Cartao = {
    id: 'card-1',
    name: 'Cartão da casa',
    brand: 'VISA',
    lastDigits: '1234',
    billingDay: 5,
    dueDay: 12
  };

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService', [
      'listarCartoes',
      'cadastrarCartao',
      'atualizarCartao',
      'excluirCartao'
    ]);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'success',
      'error',
      'info',
      'warning'
    ]);
    modal = jasmine.createSpyObj<ModalService>('ModalService', ['open']);

    compraService.listarCartoes.and.returnValue(of([fakeCartao]));
    compraService.cadastrarCartao.and.returnValue(of(fakeCartao));
    compraService.atualizarCartao.and.returnValue(of(fakeCartao));
    compraService.excluirCartao.and.returnValue(of('ok'));
    modal.open.and.returnValue({ afterClosed: () => of(true) } as any);

    await TestBed.configureTestingModule({
      imports: [CartoesComponent],
      providers: [
        { provide: CompraService, useValue: compraService },
        { provide: NotificationService, useValue: notify },
        { provide: ModalService, useValue: modal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CartoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega cartões ao iniciar', () => {
    expect(compraService.listarCartoes).toHaveBeenCalled();
    expect(component.cartoes).toEqual([fakeCartao]);
    expect(component.totalCartoes).toBe(1);
  });

  it('preenche o formulário ao iniciar edição', () => {
    component.iniciarEdicao(fakeCartao);

    expect(component.editandoId).toBe(fakeCartao.id);
    expect(component.formCartao.value.name).toBe(fakeCartao.name);
    expect(component.formCartao.value.brand).toBe(fakeCartao.brand);
    expect(component.formCartao.value.lastDigits).toBe(fakeCartao.lastDigits);
  });

  it('cadastra cartão válido', () => {
    compraService.listarCartoes.calls.reset();
    component.formCartao.setValue({
      name: 'Cartão mercado',
      brand: 'MASTERCARD',
      lastDigits: '9876',
      billingDay: 6,
      dueDay: 15
    });

    component.salvar();

    expect(compraService.cadastrarCartao).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Cartão cadastrado!');
    expect(compraService.listarCartoes).toHaveBeenCalled();
  });

  it('atualiza cartão em edição', () => {
    compraService.listarCartoes.calls.reset();
    component.iniciarEdicao(fakeCartao);
    component.formCartao.patchValue({ name: 'Cartão atualizado' });

    component.salvar();

    expect(compraService.atualizarCartao).toHaveBeenCalledWith(fakeCartao.id, jasmine.objectContaining({
      name: 'Cartão atualizado'
    }));
  });

  it('notifica quando o formulário está inválido', () => {
    component.formCartao.patchValue({ name: '' });

    component.salvar();

    expect(notify.warning).toHaveBeenCalledWith('Preencha os campos obrigatórios.');
    expect(compraService.cadastrarCartao).not.toHaveBeenCalled();
  });

  it('notifica erro ao falhar carregamento', () => {
    compraService.listarCartoes.and.returnValue(throwError(() => new Error('erro')));

    component.recarregar();

    expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar os cartões.');
    expect(component.loading()).toBeFalse();
  });

  it('formata bandeira e final do cartão para exibição', () => {
    expect(component.brandLabel('MASTERCARD')).toBe('Mastercard');
    expect(component.brandInitial('MASTERCARD')).toBe('MA');
    expect(component.maskedDigits(fakeCartao)).toBe('**** 1234');
  });
});
