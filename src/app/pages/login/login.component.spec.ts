import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['logar', 'addToken']);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify },
        { provide: Router, useValue: router }
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
});
