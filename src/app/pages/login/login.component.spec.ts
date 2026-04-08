import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { UserService } from '../../core/auth/user/user.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['logar', 'addToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cria o componente', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Validação do formulário
  // -------------------------------------------------------------------------
  describe('validação do formulário', () => {
    it('formulário inicia inválido (campos vazios)', () => {
      expect(component.loginForm.invalid).toBeTrue();
    });

    it('campo email inválido para texto sem @', () => {
      component.loginForm.get('email')!.setValue('nao-e-email');
      expect(component.loginForm.get('email')!.invalid).toBeTrue();
    });

    it('campo email válido para formato correto', () => {
      component.loginForm.get('email')!.setValue('user@email.com');
      expect(component.loginForm.get('email')!.valid).toBeTrue();
    });

    it('campo password é obrigatório', () => {
      component.loginForm.get('password')!.setValue('');
      expect(component.loginForm.get('password')!.invalid).toBeTrue();
    });

    it('formulário válido quando email e senha preenchidos corretamente', () => {
      component.loginForm.get('email')!.setValue('user@email.com');
      component.loginForm.get('password')!.setValue('Senha@123');
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // login()
  // -------------------------------------------------------------------------
  describe('login()', () => {
    it('não chama userService quando formulário é inválido', () => {
      component.loginForm.get('email')!.setValue('');
      component.loginForm.get('password')!.setValue('');

      component.login();

      expect(userServiceSpy.logar).not.toHaveBeenCalled();
    });

    it('salva token e navega para /home em caso de sucesso', () => {
      userServiceSpy.logar.and.returnValue(of('token.jwt.retornado'));

      component.loginForm.get('email')!.setValue('user@email.com');
      component.loginForm.get('password')!.setValue('Senha@123');
      component.login();

      expect(userServiceSpy.addToken).toHaveBeenCalledWith('token.jwt.retornado');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('exibe alert em caso de erro HTTP', () => {
      spyOn(window, 'alert');
      userServiceSpy.logar.and.returnValue(throwError(() => ({ status: 401 })));

      component.loginForm.get('email')!.setValue('user@email.com');
      component.loginForm.get('password')!.setValue('senhaErrada');
      component.login();

      expect(window.alert).toHaveBeenCalledWith('Usuário ou senha incorreto!');
    });
  });

  // -------------------------------------------------------------------------
  // clickEventPassword
  // -------------------------------------------------------------------------
  describe('clickEventPassword()', () => {
    it('alterna visibilidade da senha ao clicar', () => {
      const estadoInicial = component.hide1();
      const event = new MouseEvent('click');
      component.clickEventPassword(event);
      expect(component.hide1()).toBe(!estadoInicial);
    });
  });
});
