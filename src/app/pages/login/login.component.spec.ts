import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { UserStateService } from '../../core/auth/user/user-state.service';
import { SocialUnavailableComponent } from '../../shared/components/social-unavailable/social-unavailable.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let userState: jasmine.SpyObj<UserStateService>;

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'logar',
      'addToken',
      'solicitarCodigoResetSenha',
      'confirmarResetSenha'
    ]);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    userState = jasmine.createSpyObj<UserStateService>('UserStateService', ['clearCache']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify },
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: dialog },
        { provide: UserStateService, useValue: userState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('submit válido seta loading true e chama userService.logar', () => {
    userService.logar.and.returnValue(of('jwt-token'));
    component.loginForm.setValue({ email: 'a@b.com', password: '123' });

    component.login();

    expect(userService.logar).toHaveBeenCalled();
    expect(userState.clearCache).toHaveBeenCalled();
    expect(userService.addToken).toHaveBeenCalledWith('jwt-token');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.loading()).toBe(false);
  });

  it('erro de login chama notify.error e reseta loading', () => {
    userService.logar.and.returnValue(throwError(() => ({ status: 401 })));
    component.loginForm.setValue({ email: 'a@b.com', password: '123' });

    component.login();

    expect(notify.error).toHaveBeenCalledWith('Usuário ou senha incorreto!');
    expect(component.loading()).toBe(false);
  });

  it('form inválido não dispara request', () => {
    component.loginForm.setValue({ email: '', password: '' });
    component.login();
    expect(userService.logar).not.toHaveBeenCalled();
  });

  it('solicita código de recuperação e avança etapa', () => {
    userService.solicitarCodigoResetSenha.and.returnValue(of('ok'));
    component.openPasswordReset();
    component.resetForm.patchValue({ email: 'a@b.com' });

    component.requestPasswordReset();

    expect(userService.solicitarCodigoResetSenha).toHaveBeenCalledWith('a@b.com');
    expect(component.resetCodeSent()).toBe(true);
    expect(notify.success).toHaveBeenCalledWith('Enviamos um código para o e-mail informado.');
  });

  it('confirma reset de senha e volta para login', () => {
    userService.confirmarResetSenha.and.returnValue(of('ok'));
    component.openPasswordReset();
    component.resetCodeSent.set(true);
    component.resetForm.setValue({
      email: 'a@b.com',
      code: '123456',
      newPassword: 'Senha@123',
      repeatPassword: 'Senha@123'
    });

    component.confirmPasswordReset();

    expect(userService.confirmarResetSenha).toHaveBeenCalledWith('a@b.com', '123456', 'Senha@123');
    expect(notify.success).toHaveBeenCalledWith('Senha alterada com sucesso. Faça login com a nova senha.');
    expect(component.resetMode()).toBe(false);
    expect(component.loginForm.get('email')?.value).toBe('a@b.com');
  });

  it('abre diálogo de indisponibilidade ao clicar no botão do Google', () => {
    component.openSocialUnavailable('google');

    expect(dialog.open).toHaveBeenCalledWith(
      SocialUnavailableComponent,
      jasmine.objectContaining({ data: { provider: 'google' } })
    );
  });

  it('abre diálogo de indisponibilidade ao clicar no botão do Facebook', () => {
    component.openSocialUnavailable('facebook');

    expect(dialog.open).toHaveBeenCalledWith(
      SocialUnavailableComponent,
      jasmine.objectContaining({ data: { provider: 'facebook' } })
    );
  });

  it('clicar nos botões sociais no template dispara o diálogo correto', () => {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.social-btn')
    );

    expect(buttons.length).toBe(2);
    buttons[0].click();
    buttons[1].click();

    expect(dialog.open).toHaveBeenCalledTimes(2);
    expect(dialog.open.calls.first().args[1]?.['data']).toEqual({ provider: 'google' });
    expect(dialog.open.calls.mostRecent().args[1]?.['data']).toEqual({ provider: 'facebook' });
  });
});
