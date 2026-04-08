import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CadastroComponent } from './cadastro.component';
import { UserService } from '../../core/auth/user/user.service';

/**
 * Testes para CadastroComponent.
 *
 * Bugs cobertos:
 * 1. Typo em registrar(): `this,this.mensagemErro = errorMessage` — o operador
 *    vírgula avalia `this` (descarta) e depois atribui `this.mensagemErro`.
 *    Funcionalmente a mensagem É atribuída, mas o código está incorreto
 *    (deveria ser `this.mensagemErro = errorMessage` sem o `this,` inicial).
 *    Testes verificam que mensagemErro é populada corretamente apesar do typo.
 *
 * 2. passwordMatchValidator: validador assíncrono retorna Promise —
 *    cobre senhas iguais, diferentes e caso de campo vazio.
 *
 * Riscos adicionais:
 * - Submissão com formulário inválido não deve chamar o serviço
 * - Erros HTTP 409 e 404 devem popular mensagemErro via JSON.parse
 * - Erro 500 deve popular mensagemErro com mensagem genérica
 */
describe('CadastroComponent', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['cadastrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CadastroComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Estado inicial do formulário
  // -------------------------------------------------------------------------

  describe('formulário', () => {

    it('deve iniciar com todos os campos inválidos (formulário vazio)', () => {
      expect(component.cadastroForm.valid).toBeFalse();
    });

    it('deve validar campo name como obrigatório', () => {
      const nameControl = component.cadastroForm.get('name');
      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBeTrue();
    });

    it('deve validar campo name com máximo de 20 caracteres', () => {
      const nameControl = component.cadastroForm.get('name');
      nameControl?.setValue('NomeMuitoLongoParaOCampo');
      expect(nameControl?.hasError('maxlength')).toBeTrue();
    });

    it('deve validar campo email com formato válido', () => {
      const emailControl = component.cadastroForm.get('email');
      emailControl?.setValue('email-invalido');
      expect(emailControl?.hasError('email')).toBeTrue();
    });

    it('deve aceitar email válido', () => {
      const emailControl = component.cadastroForm.get('email');
      emailControl?.setValue('usuario@dominio.com');
      expect(emailControl?.errors).toBeNull();
    });

    it('deve rejeitar senha com menos de 8 caracteres', () => {
      const passwordControl = component.cadastroForm.get('password');
      passwordControl?.setValue('Abc@1');
      expect(passwordControl?.hasError('minlength')).toBeTrue();
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const passwordControl = component.cadastroForm.get('password');
      passwordControl?.setValue('Senha12345');
      expect(passwordControl?.hasError('pattern')).toBeTrue();
    });

    it('deve aceitar senha válida com 8+ caracteres e caractere especial', () => {
      const passwordControl = component.cadastroForm.get('password');
      passwordControl?.setValue('Senha@123');
      expect(passwordControl?.errors).toBeNull();
    });

    it('deve validar familyCode com mínimo de 8 caracteres', () => {
      const codeControl = component.cadastroForm.get('familyCode');
      codeControl?.setValue('ABC');
      expect(codeControl?.hasError('minlength')).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // passwordMatchValidator
  // -------------------------------------------------------------------------

  describe('passwordMatchValidator', () => {

    it('deve resolver null quando senhas coincidem', async () => {
      component.cadastroForm.get('password')?.setValue('Senha@123');
      const resultado = await component.passwordMatchValidator(
        component.cadastroForm.get('repeatPassword')!
      );
      // Control com valor igual à senha
      const control = { value: 'Senha@123' } as any;
      const res = await component.passwordMatchValidator(control);
      expect(res).toBeNull();
    });

    it('deve resolver { passwordMismatch: true } quando senhas diferem', async () => {
      component.cadastroForm.get('password')?.setValue('Senha@123');
      const control = { value: 'SenhaErrada@1' } as any;
      const resultado = await component.passwordMatchValidator(control);
      expect(resultado).toEqual({ passwordMismatch: true });
    });

    it('deve detectar mismatch quando password está vazia', async () => {
      component.cadastroForm.get('password')?.setValue('');
      const control = { value: 'AlgumaCoisa@1' } as any;
      const resultado = await component.passwordMatchValidator(control);
      expect(resultado).toEqual({ passwordMismatch: true });
    });
  });

  // -------------------------------------------------------------------------
  // registrar()
  // -------------------------------------------------------------------------

  describe('registrar', () => {

    it('não deve chamar cadastrar quando formulário é inválido', () => {
      // Formulário vazio é inválido
      component.registrar();
      expect(userServiceSpy.cadastrar).not.toHaveBeenCalled();
    });

    it('deve navegar para /login após cadastro bem-sucedido', fakeAsync(() => {
      preencherFormularioValido();
      userServiceSpy.cadastrar.and.returnValue(of('ok'));

      component.registrar();
      tick();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.mensagemErro).toBeNull();
    }));

    /**
     * Testa o bug do typo: `this,this.mensagemErro = errorMessage`
     *
     * Apesar do typo (vírgula em vez de ponto no `this,`), a atribuição
     * acontece corretamente porque o operador vírgula avalia a segunda expressão.
     * O teste verifica que mensagemErro É atribuído mesmo com o código defeituoso.
     */
    it('deve atribuir mensagemErro com HTTP 409 — apesar do typo com vírgula', fakeAsync(() => {
      preencherFormularioValido();
      const errorBody = JSON.stringify({ message: 'Email já cadastrado.' });
      userServiceSpy.cadastrar.and.returnValue(
        throwError(() => ({ status: 409, error: errorBody }))
      );

      component.registrar();
      tick();

      expect(component.mensagemErro).toBe('Email já cadastrado.');
    }));

    it('deve atribuir mensagemErro com HTTP 404', fakeAsync(() => {
      preencherFormularioValido();
      const errorBody = JSON.stringify({ message: 'Família não encontrada.' });
      userServiceSpy.cadastrar.and.returnValue(
        throwError(() => ({ status: 404, error: errorBody }))
      );

      component.registrar();
      tick();

      expect(component.mensagemErro).toBe('Família não encontrada.');
    }));

    it('deve atribuir mensagem genérica para erro 500', fakeAsync(() => {
      preencherFormularioValido();
      userServiceSpy.cadastrar.and.returnValue(
        throwError(() => ({ status: 500, error: 'Internal Server Error' }))
      );

      component.registrar();
      tick();

      expect(component.mensagemErro).toBe('Tivemos um erro interno, lamentamos.');
    }));

    it('não deve navegar após erro', fakeAsync(() => {
      preencherFormularioValido();
      userServiceSpy.cadastrar.and.returnValue(
        throwError(() => ({ status: 409, error: JSON.stringify({ message: 'Erro' }) }))
      );

      component.registrar();
      tick();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
  });

  // -------------------------------------------------------------------------
  // toggles de visibilidade de senha
  // -------------------------------------------------------------------------

  describe('clickEventPassword', () => {

    it('deve alternar o estado hide1', () => {
      const estadoInicial = component.hide1();
      component.clickEventPassword({ stopPropagation: () => {} } as MouseEvent);
      expect(component.hide1()).toBe(!estadoInicial);
    });

    it('deve alternar o estado hide2', () => {
      const estadoInicial = component.hide2();
      component.clickEventRepeatPassword({ stopPropagation: () => {} } as MouseEvent);
      expect(component.hide2()).toBe(!estadoInicial);
    });
  });

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------

  function preencherFormularioValido() {
    component.cadastroForm.setValue({
      name: 'João Silva',
      email: 'joao@test.com',
      password: 'Senha@123',
      repeatPassword: 'Senha@123',
      familyCode: 'ABCD1234'
    });
  }
});
