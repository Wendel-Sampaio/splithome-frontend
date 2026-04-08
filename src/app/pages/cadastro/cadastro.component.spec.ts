import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CadastroComponent } from './cadastro.component';
import { UserService } from '../../core/auth/user/user.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('CadastroComponent', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['cadastrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CadastroComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cria o componente', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Validações do formulário
  // -------------------------------------------------------------------------
  describe('validação do formulário', () => {
    it('formulário inicia inválido', () => {
      expect(component.cadastroForm.invalid).toBeTrue();
    });

    it('senha com menos de 8 caracteres é inválida', () => {
      component.cadastroForm.get('password')!.setValue('Ab@1');
      expect(component.cadastroForm.get('password')!.invalid).toBeTrue();
    });

    it('senha sem caractere especial é inválida', () => {
      component.cadastroForm.get('password')!.setValue('SenhaSimples1');
      expect(component.cadastroForm.get('password')!.invalid).toBeTrue();
    });

    it('senha com 8+ caracteres e caractere especial é válida', () => {
      component.cadastroForm.get('password')!.setValue('Senh@123');
      expect(component.cadastroForm.get('password')!.valid).toBeTrue();
    });

    it('campo name com mais de 20 caracteres é inválido', () => {
      component.cadastroForm.get('name')!.setValue('NomeComMuitosCaracteresDemais');
      expect(component.cadastroForm.get('name')!.invalid).toBeTrue();
    });

    it('familyCode com menos de 8 caracteres é inválido', () => {
      component.cadastroForm.get('familyCode')!.setValue('ABC');
      expect(component.cadastroForm.get('familyCode')!.invalid).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // passwordMatchValidator
  // -------------------------------------------------------------------------
  describe('passwordMatchValidator()', () => {
    it('retorna null quando senhas coincidem', fakeAsync(() => {
      component.cadastroForm.get('password')!.setValue('Senha@123');

      const control = component.cadastroForm.get('repeatPassword')!;
      control.setValue('Senha@123');

      let resultado: any;
      component.passwordMatchValidator(control).then(r => resultado = r);
      tick();

      expect(resultado).toBeNull();
    }));

    it('retorna { passwordMismatch: true } quando senhas diferem', fakeAsync(() => {
      component.cadastroForm.get('password')!.setValue('Senha@123');

      const control = component.cadastroForm.get('repeatPassword')!;
      control.setValue('SenhaDiferente@456');

      let resultado: any;
      component.passwordMatchValidator(control).then(r => resultado = r);
      tick();

      expect(resultado).toEqual({ passwordMismatch: true });
    }));
  });

  // -------------------------------------------------------------------------
  // registrar()
  // -------------------------------------------------------------------------
  describe('registrar()', () => {
    const preencherFormularioValido = (component: CadastroComponent) => {
      component.cadastroForm.get('name')!.setValue('João');
      component.cadastroForm.get('email')!.setValue('joao@email.com');
      component.cadastroForm.get('password')!.setValue('Senha@123');
      component.cadastroForm.get('repeatPassword')!.setValue('Senha@123');
      component.cadastroForm.get('familyCode')!.setValue('FAM00001');
    };

    it('não chama userService quando formulário é inválido', () => {
      component.registrar();
      expect(userServiceSpy.cadastrar).not.toHaveBeenCalled();
    });

    it('navega para /login após cadastro bem-sucedido', () => {
      userServiceSpy.cadastrar.and.returnValue(of('Usuário cadastrado com sucesso!'));
      preencherFormularioValido(component);

      component.registrar();

      expect(userServiceSpy.cadastrar).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('seta mensagemErro para erro 409 (e-mail duplicado)', () => {
      const erroHttp = {
        status: 409,
        error: JSON.stringify({ message: 'Esse e-mail já existe!' })
      };
      userServiceSpy.cadastrar.and.returnValue(throwError(() => erroHttp));
      preencherFormularioValido(component);

      component.registrar();

      // BUG DOCUMENTADO (linha 90): "this,this.mensagemErro = errorMessage" usa vírgula
      // em vez de ponto — o operador vírgula avalia ambos os lados mas o resultado
      // é o lado direito. Na prática, `this` é avaliado (sem efeito) e depois
      // `this.mensagemErro = errorMessage` é executado. A atribuição funciona,
      // mas o código é semanticamente incorreto e deve ser corrigido para "this.mensagemErro = errorMessage".
      expect(component.mensagemErro).toBe('Esse e-mail já existe!');
    });

    it('seta mensagemErro para erro 404 (família não encontrada)', () => {
      const erroHttp = {
        status: 404,
        error: JSON.stringify({ message: 'Família não encontrada!' })
      };
      userServiceSpy.cadastrar.and.returnValue(throwError(() => erroHttp));
      preencherFormularioValido(component);

      component.registrar();

      expect(component.mensagemErro).toBe('Família não encontrada!');
    });

    it('seta mensagem de erro interno para status diferente de 409/404', () => {
      const erroHttp = { status: 500 };
      userServiceSpy.cadastrar.and.returnValue(throwError(() => erroHttp));
      preencherFormularioValido(component);

      component.registrar();

      expect(component.mensagemErro).toBe('Tivemos um erro interno, lamentamos.');
    });
  });
});
