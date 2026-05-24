import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CadastroComponent } from './cadastro.component';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';

describe('CadastroComponent', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['cadastrar']);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CadastroComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function preencherForm() {
    component.cadastroForm.patchValue({
      name: 'Joao',
      email: 'joao@x.com',
      password: 'Senha123!',
      repeatPassword: 'Senha123!'
    });
  }

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('cadastro bem-sucedido notifica sucesso e navega para /login', async () => {
    userService.cadastrar.and.returnValue(of({} as any));
    preencherForm();
    await fixture.whenStable();
    component.registrar();
    expect(userService.cadastrar).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Cadastro realizado com sucesso!');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.loading()).toBe(false);
  });

  it('erro 409 notifica mensagem do backend', async () => {
    userService.cadastrar.and.returnValue(throwError(() => ({
      status: 409,
      error: JSON.stringify({ message: 'Email já existe' })
    })));
    preencherForm();
    await fixture.whenStable();
    component.registrar();
    expect(notify.error).toHaveBeenCalledWith('Email já existe');
    expect(component.loading()).toBe(false);
  });

  it('erro genérico notifica mensagem padrão', async () => {
    userService.cadastrar.and.returnValue(throwError(() => ({ status: 500 })));
    preencherForm();
    await fixture.whenStable();
    component.registrar();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível concluir o cadastro.');
    expect(component.loading()).toBe(false);
  });

  it('form inválido não dispara request', () => {
    component.registrar();
    expect(userService.cadastrar).not.toHaveBeenCalled();
  });
});
