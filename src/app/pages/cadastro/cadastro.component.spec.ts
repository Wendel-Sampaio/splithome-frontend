import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CadastroComponent } from './cadastro.component';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';

describe('CadastroComponent', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notifySpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['cadastrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    notifySpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: NotificationService, useValue: notifySpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  describe('validação do formulário', () => {
    it('inicia inválido (vazio)', () => {
      expect(component.cadastroForm.valid).toBeFalse();
    });

    it('name é obrigatório', () => {
      const c = component.cadastroForm.get('name');
      c?.setValue('');
      expect(c?.hasError('required')).toBeTrue();
    });

    it('name tem máximo de 20 caracteres', () => {
      const c = component.cadastroForm.get('name');
      c?.setValue('NomeMuitoLongoParaOCampoX');
      expect(c?.hasError('maxlength')).toBeTrue();
    });

    it('informa o que falta quando o nome não atinge o padrão aceito', () => {
      const c = component.cadastroForm.get('name');
      c?.setValue('');
      c?.markAsTouched();

      expect(component.nameRequirementMessages()).toEqual(['Informe seu nome.']);
    });

    it('informa quantos caracteres remover quando o nome passa do limite', () => {
      const c = component.cadastroForm.get('name');
      c?.setValue('NomeMuitoLongoParaOCampoX');
      c?.markAsTouched();

      expect(component.nameRequirementMessages()).toEqual(['Use no máximo 20 caracteres (remova 5 caracteres).']);
    });

    it('exibe feedback de nome no template quando o campo está inválido e tocado', () => {
      const c = component.cadastroForm.get('name');
      c?.setValue('NomeMuitoLongoParaOCampoX');
      c?.markAsTouched();
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('#name-requirements');
      expect(feedback?.textContent).toContain('Use no máximo 20 caracteres');
      expect(feedback?.textContent).toContain('remova 5 caracteres');
    });

    it('email inválido é rejeitado', () => {
      const c = component.cadastroForm.get('email');
      c?.setValue('email-invalido');
      expect(c?.hasError('email')).toBeTrue();
    });

    it('senha sem caractere especial é rejeitada', () => {
      const c = component.cadastroForm.get('password');
      c?.setValue('Senha12345');
      expect(c?.hasError('pattern')).toBeTrue();
    });

    it('informa o que falta quando a senha não atinge o padrão mínimo', () => {
      const c = component.cadastroForm.get('password');
      c?.setValue('abc');
      c?.markAsTouched();

      expect(component.passwordRequirementMessages()).toEqual([
        'Use pelo menos 8 caracteres (faltam 5 caracteres).',
        'Inclua pelo menos um caractere especial: !@#$%^&*(),.?":{}|<>'
      ]);
    });

    it('senha válida é aceita', () => {
      const c = component.cadastroForm.get('password');
      c?.setValue('Senha@123');
      expect(c?.errors).toBeNull();
    });

    it('exibe feedback de senha no template quando o campo está inválido e tocado', () => {
      const c = component.cadastroForm.get('password');
      c?.setValue('abc');
      c?.markAsTouched();
      fixture.detectChanges();

      const feedback = fixture.nativeElement.querySelector('#password-requirements');
      expect(feedback?.textContent).toContain('Use pelo menos 8 caracteres');
      expect(feedback?.textContent).toContain('Inclua pelo menos um caractere especial');
    });
  });

  describe('passwordMatchValidator', () => {
    it('retorna erro quando as senhas diferem', async () => {
      component.cadastroForm.get('password')?.setValue('Senha@123');
      const result = await component.passwordMatchValidator({ value: 'Outra@123' } as any);
      expect(result).toEqual({ passwordMismatch: true });
    });

    it('retorna null quando as senhas são iguais', async () => {
      component.cadastroForm.get('password')?.setValue('Senha@123');
      const result = await component.passwordMatchValidator({ value: 'Senha@123' } as any);
      expect(result).toBeNull();
    });
  });

  describe('registrar', () => {
    const preencherFormValido = () => {
      component.cadastroForm.get('name')?.setValue('João');
      component.cadastroForm.get('email')?.setValue('joao@test.com');
      component.cadastroForm.get('password')?.setValue('Senha@123');
      component.cadastroForm.get('repeatPassword')?.setValue('Senha@123');
    };

    it('não chama o serviço com formulário inválido', () => {
      component.registrar();
      expect(userServiceSpy.cadastrar).not.toHaveBeenCalled();
    });

    it('sucesso: notifica e navega para /login', fakeAsync(() => {
      preencherFormValido();
      tick();
      fixture.detectChanges();
      userServiceSpy.cadastrar.and.returnValue(of('ok'));

      component.registrar();
      tick();

      expect(userServiceSpy.cadastrar).toHaveBeenCalled();
      expect(notifySpy.success).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('erro 409: notifica mensagem parseada do JSON', fakeAsync(() => {
      preencherFormValido();
      tick();
      fixture.detectChanges();
      userServiceSpy.cadastrar.and.returnValue(
        throwError(() => ({ status: 409, error: JSON.stringify({ message: 'E-mail já cadastrado' }) }))
      );

      component.registrar();
      tick();

      expect(notifySpy.error).toHaveBeenCalledWith('E-mail já cadastrado');
    }));

    it('erro 500: notifica mensagem genérica', fakeAsync(() => {
      preencherFormValido();
      tick();
      fixture.detectChanges();
      userServiceSpy.cadastrar.and.returnValue(throwError(() => ({ status: 500 })));

      component.registrar();
      tick();

      expect(notifySpy.error).toHaveBeenCalledWith('Não foi possível concluir o cadastro.');
    }));
  });
});
