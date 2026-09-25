import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { DialogCategoriasComponent } from './dialog-categorias.component';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { NotificationService } from '../../services/notification/notification.service';
import { Categoria } from '../../../core/models/categoria/categoria';

describe('DialogCategoriasComponent', () => {
  const pets: Categoria = { id: 'pets', name: 'Pets', systemDefault: false, custom: true };
  let fixture: ComponentFixture<DialogCategoriasComponent>;
  let component: DialogCategoriasComponent;
  let service: jasmine.SpyObj<TransacaoService>;
  let ref: jasmine.SpyObj<MatDialogRef<DialogCategoriasComponent>>;
  beforeEach(async () => {
    service = jasmine.createSpyObj('TransacaoService', ['criarCategoria', 'atualizarCategoria', 'excluirCategoria']);
    ref = jasmine.createSpyObj('MatDialogRef', ['close']);
    await TestBed.configureTestingModule({
      imports: [DialogCategoriasComponent],
      providers: [
        { provide: TransacaoService, useValue: service },
        { provide: MatDialogRef, useValue: ref },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success']) },
        { provide: MAT_DIALOG_DATA, useValue: [pets, { id: 'food', name: 'FOOD', systemDefault: true, custom: false }] }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DialogCategoriasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('não oferece edição ou exclusão dos padrões', () => {
    expect(component.categorias()).toEqual([pets]);
    expect(fixture.nativeElement.textContent).not.toContain('FOOD');
  });

  it('o envio do formulário cria e seleciona a categoria', () => {
    service.criarCategoria.and.returnValue(of(pets));
    component.nome.setValue('Pets');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(service.criarCategoria).toHaveBeenCalledWith('Pets');
    expect(ref.close).toHaveBeenCalledWith(pets);
  });

  it('valida nomes vazios e limite de 100 caracteres', () => {
    for (const name of ['   ', 'x'.repeat(101)]) {
      component.nome.setValue(name);
      component.salvar();
    }
    expect(service.criarCategoria).not.toHaveBeenCalled();
  });

  it('cria, devolve o DTO para seleção e bloqueia envios repetidos', () => {
    const response = new Subject<Categoria>();
    service.criarCategoria.and.returnValue(response);
    component.nome.setValue('  Pets  ');
    component.salvar();
    component.salvar();
    expect(service.criarCategoria).toHaveBeenCalledOnceWith('Pets');
    expect(ref.disableClose).toBeTrue();
    response.next(pets);
    response.complete();
    expect(ref.close).toHaveBeenCalledWith(pets);
    expect(component.salvando()).toBeFalse();
  });

  it('mostra duplicidade sem fechar o diálogo ou perder o nome', () => {
    service.criarCategoria.and.returnValue(throwError(() => ({ status: 409 })));
    component.nome.setValue('Pets');
    component.salvar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('Já existe');
    expect(component.nome.value).toBe('Pets');
    expect(ref.close).not.toHaveBeenCalled();
  });

  it('renomeia pelo ID e mantém o diálogo aberto em caso de acesso recusado', () => {
    service.atualizarCategoria.and.returnValue(throwError(() => ({ status: 404, error: { message: 'Categoria indisponível.' } })));
    component.editar(pets);
    component.nome.setValue('Veterinário');
    component.salvar();
    expect(service.atualizarCategoria).toHaveBeenCalledWith('pets', 'Veterinário');
    expect(component.erro()).toBe('Categoria indisponível.');
    expect(ref.close).not.toHaveBeenCalled();
  });

  it('desativa somente após confirmação e remove a opção local', () => {
    service.excluirCategoria.and.returnValue(of(undefined));
    fixture.nativeElement.querySelector('[aria-label="Desativar Pets"]').click();
    fixture.detectChanges();
    expect(service.excluirCategoria).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('manterão seu histórico');
    component.confirmarExclusao();
    expect(service.excluirCategoria).toHaveBeenCalledWith('pets');
    expect(component.categorias()).toEqual([]);
  });
});
