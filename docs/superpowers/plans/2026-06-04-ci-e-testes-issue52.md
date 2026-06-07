# CI + Suíte de Testes Verde (issue #52) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar `npm test` 100% verde na `master` aproveitando os testes da PR #52 e adicionar um CI (GitHub Actions) que roda build + testes em todo PR para a `master`.

**Architecture:** Trabalho numa branch `52-ci-e-testes` criada da `master` atual. Primeiro consertam-se os 5 specs que falham hoje (faltam providers de `HttpClient`/router/dialog), depois portam-se/adaptam-se os testes valiosos da #52 às APIs atuais, e por fim adiciona-se um launcher Chrome headless de CI + workflow do GitHub Actions.

**Tech Stack:** Angular 19 (standalone), Karma + Jasmine, ChromeHeadless, GitHub Actions, Node 22.

**Baseline (estado atual da branch):** `npx ng test --watch=false --browsers=ChromeHeadless` → 5 FAILED / restante SUCCESS. As 5 falhas: `AppComponent should render title`, `CompraService should be created`, `HomeComponent should create`, `LogoutComponent should create`, `TransacaoService should be created`.

**Comando de teste usado em todo o plano (local):**
`export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless`

---

## Task 1: Consertar specs de serviço (CompraService + TransacaoService)

Ambos falham com `NullInjectorError: No provider for HttpClient`. Os serviços injetam `HttpClient`; basta prover no `TestBed`.

**Files:**
- Modify: `src/app/shared/services/compra/compra.service.spec.ts`
- Modify: `src/app/shared/services/transacao/transacao.service.spec.ts`

- [ ] **Step 1: Reescrever `compra.service.spec.ts`**

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CompraService } from './compra.service';

describe('CompraService', () => {
  let service: CompraService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CompraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

- [ ] **Step 2: Reescrever `transacao.service.spec.ts`** (mesmo padrão)

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TransacaoService } from './transacao.service';

describe('TransacaoService', () => {
  let service: TransacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TransacaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

- [ ] **Step 3: Rodar os dois specs**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/services/**/*.spec.ts'`
Expected: `CompraService` e `TransacaoService` PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/services/compra/compra.service.spec.ts src/app/shared/services/transacao/transacao.service.spec.ts
git commit -m "test: prover HttpClient nos specs de CompraService e TransacaoService"
```

---

## Task 2: Consertar `AppComponent` spec

`app.component.html` é só `<router-outlet />` — não existe `<h1>Hello, ...`. O teste `should render title` é scaffold inválido. Além disso `RouterOutlet` precisa de router no `TestBed`.

**Files:**
- Modify: `src/app/app.component.spec.ts`

- [ ] **Step 1: Reescrever o spec**

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have the 'splithome-front' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toEqual('splithome-front');
  });

  it('should render the router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/app.component.spec.ts'`
Expected: 3 PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/app.component.spec.ts
git commit -m "test: corrigir AppComponent spec (router-outlet em vez de h1 scaffold)"
```

---

## Task 3: Consertar `HomeComponent` spec

`HomeComponent` injeta `UserService` (HttpClient), `Router`, `PlanService`, `MatDialog`, e no construtor chama `getUser()` + assina `profilePhotoUpdates$`. Precisa de HttpClient, router, animações e dialog.

**Files:**
- Modify: `src/app/pages/home/home.component.spec.ts`

- [ ] **Step 1: Reescrever o spec**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar na view "inicio"', () => {
    expect(component.currentView).toBe('inicio');
  });

  it('abrirCompras() deve trocar a view e o título', () => {
    component.abrirCompras();
    expect(component.currentView).toBe('compras');
    expect(component.currentViewTitle).toBe('Compras');
  });
});
```

> NOTA p/ o executor: se `fixture.detectChanges()` falhar por algum serviço filho exigir provider extra, restrinja a renderização adicionando `schemas: [CUSTOM_ELEMENTS_NO_ERRORS]` NÃO — em vez disso prefira remover o `detectChanges()` do `beforeEach` e chamar apenas nos testes que precisam. Rode e ajuste conforme a mensagem real.

- [ ] **Step 2: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/pages/home/home.component.spec.ts'`
Expected: PASS (3 testes).

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/home/home.component.spec.ts
git commit -m "test: prover dependências no HomeComponent spec"
```

---

## Task 4: Consertar `LogoutComponent` spec

`LogoutComponent` injeta `MatDialogRef`, `Router` e `UserService` (HttpClient). `MatDialogRef` não é injetável sem um provider — usar um mock.

**Files:**
- Modify: `src/app/shared/components/logout/logout.component.spec.ts`

- [ ] **Step 1: Reescrever o spec**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { LogoutComponent } from './logout.component';
import { UserService } from '../../../core/auth/user/user.service';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  const dialogRefMock = { close: jasmine.createSpy('close') };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('logout() deve remover o token e navegar para /login', () => {
    const userService = TestBed.inject(UserService);
    const router = TestBed.inject(Router);
    const removerToken = spyOn(userService, 'removerToken');
    const navigate = spyOn(router, 'navigate');

    component.logout();

    expect(removerToken).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
```

- [ ] **Step 2: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/components/logout/logout.component.spec.ts'`
Expected: PASS (2 testes).

- [ ] **Step 3: Rodar a suíte inteira para confirmar 0 falhas no boilerplate**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: `TOTAL: 0 FAILED` (todos os 5 originais agora passam).

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/components/logout/logout.component.spec.ts
git commit -m "test: prover MatDialogRef/Router/HttpClient no LogoutComponent spec"
```

---

## Task 5: Portar/adaptar o spec de `UserService` (da #52)

A #52 traz testes ricos. Adaptar à API atual: `jwtDecode()` retorna `User | null` (não string), `getToken()` retorna `null` sem token, `Register` tem 3 args (sem familyCode), e `getUser()` mapeia o payload para campos de `User` (sem `sub`).

**Files:**
- Modify: `src/app/core/auth/user/user.service.spec.ts`

- [ ] **Step 1: Escrever o spec adaptado (substitui o conteúdo atual)**

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserService } from './user.service';
import { Login } from './login';
import { Register } from './register';

/**
 * Testes para UserService.
 *
 * Riscos de segurança documentados:
 * 1. XSS via localStorage: o token JWT fica em localStorage, legível por qualquer
 *    script da página. Mitigação: HttpOnly cookie.
 * 2. jwtDecode() lança exceção em token malformado e não é tratada nos guards.
 */
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('token no localStorage', () => {
    it('deve armazenar token', () => {
      service.addToken('meu.jwt.token');
      expect(localStorage.getItem('token')).toBe('meu.jwt.token');
    });

    it('deve recuperar token', () => {
      localStorage.setItem('token', 'token-existente');
      expect(service.getToken()).toBe('token-existente');
    });

    it('deve retornar null quando não há token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('deve remover token', () => {
      localStorage.setItem('token', 'token-a-remover');
      service.removerToken();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('token é legível via JavaScript — risco XSS documentado', () => {
      service.addToken('jwt.sensivel.aqui');
      expect(localStorage.getItem('token')).toBe('jwt.sensivel.aqui');
    });
  });

  describe('jwtDecode / getUser', () => {
    it('jwtDecode deve retornar null quando não há token', () => {
      expect(service.jwtDecode()).toBeNull();
    });

    it('deve decodificar um JWT e mapear os campos do User', () => {
      // payload: { "name":"João", "email":"joao@test.com", "id":"uuid-1", "familyCode":"ABCD1234", "exp":9999999999 }
      const jwtFake = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        'eyJuYW1lIjoiSm9cdTAwZTNvIiwiZW1haWwiOiJqb2FvQHRlc3QuY29tIiwiaWQiOiJ1dWlkLTEiLCJmYW1pbHlDb2RlIjoiQUJDRDEyMzQiLCJleHAiOjk5OTk5OTk5OTl9',
        'assinatura_nao_verificada'
      ].join('.');

      localStorage.setItem('token', jwtFake);
      const decoded = service.jwtDecode();

      expect(decoded).not.toBeNull();
      expect(decoded!.email).toBe('joao@test.com');
      expect(decoded!.id).toBe('uuid-1');
      expect(decoded!.familyCode).toBe('ABCD1234');
    });

    it('getUser deve retornar usuário default quando não há token', () => {
      const user = service.getUser();
      expect(user.id).toBe('');
      expect(user.plan).toBe('FREE');
    });

    it('jwtDecode deve lançar exceção para token malformado (sem tratamento)', () => {
      localStorage.setItem('token', 'token.nao.e.um.jwt.valido');
      expect(() => service.jwtDecode()).toThrow();
    });
  });

  describe('requisições HTTP', () => {
    it('logar deve fazer POST para /user/auth/login', () => {
      const login = new Login('joao@test.com', 'Senha@123');
      service.logar(login).subscribe();

      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('/user/auth/login'));
      expect(req.request.body).toEqual(login);
      req.flush('jwt.token.response');
    });

    it('cadastrar deve fazer POST para /user/auth/register', () => {
      const register = new Register('João', 'joao@test.com', 'Senha@123');
      service.cadastrar(register).subscribe();

      const req = httpMock.expectOne(r => r.method === 'POST' && r.url.includes('/user/auth/register'));
      expect(req.request.body).toEqual(register);
      req.flush('Usuário cadastrado com sucesso!');
    });

    it('getUserById deve fazer GET para /user/{id}', () => {
      service.getUserById('uuid-123').subscribe();
      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('/user/uuid-123'));
      req.flush({ id: 'uuid-123', name: 'João', email: 'joao@test.com', phoneNumber: '', pixKey: '', familyCode: 'ABC' });
    });

    it('getAllUsers deve fazer GET para /user/listall', () => {
      service.getAllUsers().subscribe();
      const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('/user/listall'));
      req.flush([]);
    });
  });
});
```

- [ ] **Step 2: Verificar o construtor de `Login`**

Run: `cat src/app/core/auth/user/login.ts`
Expected: confirmar que `new Login(email, password)` bate com a assinatura. Se a ordem/numero de args diferir, ajustar a chamada no teste.

- [ ] **Step 3: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/core/auth/user/user.service.spec.ts'`
Expected: todos PASS. Se o teste do JWT falhar no mapeamento, ajustar o payload base64 para conter os campos esperados.

- [ ] **Step 4: Commit**

```bash
git add src/app/core/auth/user/user.service.spec.ts
git commit -m "test: portar e adaptar testes de UserService da #52 (token, jwtDecode, HTTP)"
```

---

## Task 6: Specs dos guards (`homeGuard` + `loginGuard`)

Guards são `CanActivateFn`; testar via `TestBed.runInInjectionContext`. `getToken()` lê `localStorage`.

**Files:**
- Modify: `src/app/core/auth/guards/home.guard.spec.ts`
- Modify: `src/app/core/auth/guards/login.guard.spec.ts`

- [ ] **Step 1: Escrever `home.guard.spec.ts`**

```typescript
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { homeGuard } from './home.guard';

describe('homeGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  const run = () => TestBed.runInInjectionContext(
    () => homeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  it('deve permitir acesso quando NÃO há token', () => {
    expect(run()).toBeTrue();
  });

  it('deve bloquear e redirecionar para /home quando há token', () => {
    const navigate = spyOn(router, 'navigate');
    localStorage.setItem('token', 'qualquer.token');
    expect(run()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });
});
```

- [ ] **Step 2: Escrever `login.guard.spec.ts`**

```typescript
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { loginGuard } from './login.guard';

describe('loginGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  const run = () => TestBed.runInInjectionContext(
    () => loginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  it('deve bloquear e redirecionar para /login quando NÃO há token', () => {
    const navigate = spyOn(router, 'navigate');
    expect(run()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve permitir acesso quando há token', () => {
    localStorage.setItem('token', 'qualquer.token');
    expect(run()).toBeTrue();
  });
});
```

- [ ] **Step 3: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/core/auth/guards/*.spec.ts'`
Expected: 4 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/core/auth/guards/home.guard.spec.ts src/app/core/auth/guards/login.guard.spec.ts
git commit -m "test: cobrir homeGuard e loginGuard (token presente/ausente)"
```

---

## Task 7: Adaptar `CadastroComponent` spec

A #52 testava `mensagemErro`, que não existe mais. O componente atual usa `NotificationService` (`success`/`error`). Testar validação do form, `passwordMatchValidator` e `registrar`.

**Files:**
- Modify: `src/app/pages/cadastro/cadastro.component.spec.ts`

- [ ] **Step 1: Escrever o spec adaptado**

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
      imports: [CadastroComponent, NoopAnimationsModule],
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

    it('senha válida é aceita', () => {
      const c = component.cadastroForm.get('password');
      c?.setValue('Senha@123');
      expect(c?.errors).toBeNull();
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
      tick(); // resolve o async validator
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
```

- [ ] **Step 2: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/pages/cadastro/cadastro.component.spec.ts'`
Expected: todos PASS. Se algum teste de `registrar` falhar por timing do async validator, garantir o `tick()` após preencher o form antes de chamar `registrar()`.

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/cadastro/cadastro.component.spec.ts
git commit -m "test: adaptar CadastroComponent spec para NotificationService"
```

---

## Task 8: Reduzir `ComprasComponent` spec aos métodos sobreviventes

Métodos removidos (`formatCategoria`, `calculaValorUnitario`, `formatNomesPagadores`, `formatNomesPagadoresRestantes`, `mudarStatusDaCompra`) saem. Mantêm-se `verificaUserRemainingPayers`, `verificarPagamento`, `tratamentoLista`.

**Files:**
- Modify: `src/app/shared/components/compras/compras.component.spec.ts`

- [ ] **Step 1: Escrever o spec reduzido**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { firstValueFrom } from 'rxjs';

import { ComprasComponent } from './compras.component';
import { UserService } from '../../../core/auth/user/user.service';
import { Compra } from '../../../core/models/compra/compra';
import { User } from '../../../core/models/user/user';

function makeUser(over: Partial<User> = {}): User {
  return { id: 'u1', name: 'João', email: '', phoneNumber: '', pixKey: '', familyCode: '', plan: 'FREE', profilePhoto: '', ...over } as User;
}

function makeCompra(over: Partial<Compra> = {}): Compra {
  return Object.assign(new Compra(), {
    id: 'c1', title: 'Mercado', category: 'FOOD', value: 100, unitValue: 50,
    payers: ['João', 'Maria'], paymentDate: '', remainingPayers: ['Maria'],
    purchaserId: 'u1', purchaserName: 'João', purchaseDate: '', showPaymentButton: true, isPaid: false
  }, over);
}

describe('ComprasComponent', () => {
  let component: ComprasComponent;
  let fixture: ComponentFixture<ComprasComponent>;
  let userService: UserService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  describe('verificaUserRemainingPayers', () => {
    it('true quando o usuário está em remainingPayers', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ name: 'Maria' }));
      expect(component.verificaUserRemainingPayers(makeCompra({ remainingPayers: ['Maria'] }))).toBeTrue();
    });

    it('false quando o usuário não está em remainingPayers', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ name: 'João' }));
      expect(component.verificaUserRemainingPayers(makeCompra({ remainingPayers: ['Maria'] }))).toBeFalse();
    });
  });

  describe('verificarPagamento', () => {
    it('comprador com remainingPayers pendentes → isPaid vira false', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ id: 'u1' }));
      const compra = makeCompra({ purchaserId: 'u1', remainingPayers: ['Maria'], isPaid: true });
      expect(component.verificarPagamento(compra)).toBeFalse();
      expect(compra.isPaid).toBeFalse();
    });

    it('comprador sem remainingPayers → mantém isPaid', () => {
      spyOn(userService, 'getUser').and.returnValue(makeUser({ id: 'u1' }));
      const compra = makeCompra({ purchaserId: 'u1', remainingPayers: [], isPaid: true });
      expect(component.verificarPagamento(compra)).toBeTrue();
    });
  });

  describe('tratamentoLista', () => {
    it('lista vazia resolve para []', async () => {
      const resultado = await firstValueFrom(component.tratamentoLista([]));
      expect(resultado).toEqual([]);
    });
  });
});
```

- [ ] **Step 2: Rodar**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/shared/components/compras/compras.component.spec.ts'`
Expected: todos PASS. Se a criação do componente exigir provider extra (ler a mensagem de NullInjector), adicionar o provider correspondente.

- [ ] **Step 3: Rodar a suíte INTEIRA**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: `TOTAL: 0 FAILED`.

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/components/compras/compras.component.spec.ts
git commit -m "test: reduzir ComprasComponent spec aos métodos existentes"
```

---

## Task 9: Launcher Chrome headless para CI + script npm

**Files:**
- Create: `karma.conf.js`
- Modify: `angular.json` (referenciar `karmaConfig`)
- Modify: `package.json` (script `test:ci`)

- [ ] **Step 1: Criar `karma.conf.js`** (raiz do projeto)

```javascript
// Karma configuration — adiciona launcher headless para CI (sandbox off).
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    reporters: ['progress'],
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--headless']
      }
    },
    restartOnFileChange: true
  });
};
```

- [ ] **Step 2: Referenciar o karma.conf no `angular.json`**

No alvo `test` (em `projects.<nome>.architect.test.options`), adicionar a chave `karmaConfig`:

```json
"test": {
  "builder": "@angular-devkit/build-angular:karma",
  "options": {
    "karmaConfig": "karma.conf.js",
    "polyfills": ["zone.js", "zone.js/testing"],
    "tsConfig": "tsconfig.spec.json",
    "inlineStyleLanguage": "scss",
    "assets": ["src/assets"],
    "styles": [
      "@angular/material/prebuilt-themes/azure-blue.css",
      "src/styles.scss"
    ],
    "scripts": []
  }
}
```

- [ ] **Step 3: Adicionar script no `package.json`**

No bloco `"scripts"`, adicionar:

```json
"test:ci": "ng test --watch=false --browsers=ChromeHeadlessCI"
```

- [ ] **Step 4: Validar localmente o comando de CI**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npm run test:ci`
Expected: `TOTAL: 0 FAILED`. Se faltar o plugin `karma-jasmine-html-reporter` ou `karma-coverage`, removê-los da lista `plugins`/`reporters` (são opcionais) e rodar de novo.

- [ ] **Step 5: Commit**

```bash
git add karma.conf.js angular.json package.json
git commit -m "test: launcher ChromeHeadlessCI e script test:ci"
```

---

## Task 10: Workflow do GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Criar o workflow**

```yaml
name: CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test:ci
        env:
          CHROME_BIN: /usr/bin/google-chrome
```

- [ ] **Step 2: Validar a sintaxe YAML**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('yaml ok')"`
Expected: `yaml ok`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: build + testes em PRs para a master (GitHub Actions)"
```

---

## Task 11: Verificação final, PR e documentação do branch protection

**Files:** nenhum (entrega).

- [ ] **Step 1: Verificação completa**

Run: `export CHROME_BIN=/usr/bin/google-chrome && npx ng build && npm run test:ci`
Expected: build sucesso (warning de budget tolerado) e `TOTAL: 0 FAILED`.

- [ ] **Step 2: Push da branch**

```bash
git push -u origin 52-ci-e-testes
```

- [ ] **Step 3: Abrir PR com `Closes #52`**

```bash
gh pr create --base master --head 52-ci-e-testes \
  --title "test+ci: suíte verde e CI de testes em PRs (Closes #52)" \
  --body "Substitui a #52 (branch desatualizada). Deixa npm test 100% verde e adiciona CI (GitHub Actions) rodando build+testes em PRs para a master.

## O que mudou
- Specs boilerplate corrigidos (providers de HttpClient/Router/Dialog).
- Testes de UserService, guards, Cadastro e Compras portados/adaptados da #52 às APIs atuais.
- karma.conf.js com launcher ChromeHeadlessCI + script test:ci.
- .github/workflows/ci.yml (pull_request + push na master).

## Ação manual necessária
Para o CI virar gate obrigatório, o dono do repo deve habilitar em
Settings → Branches → branch protection rule para master → Require status checks → selecionar 'build-and-test'.

Closes #52"
```

- [ ] **Step 4: Confirmar o CI rodando no PR**

Run: `gh pr checks 52-ci-e-testes` (ou o número do PR criado)
Expected: o check `build-and-test` aparece como em execução/concluído.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** Parte A (suíte verde) → Tasks 1–8; Parte B (CI) → Tasks 9–10; entrega/branch protection → Task 11. Todos os itens do design têm task correspondente.
- **Bugs reais:** o typo de `cadastro` citado na #52 já está resolvido na master (Task 7 cobre o comportamento atual via NotificationService). Nenhum bug de app pendente identificado; se algum teste expor um, corrigir com mudança mínima no commit da task correspondente.
- **Consistência de tipos:** nomes de métodos batem com a base atual — `jwtDecode()→User|null`, `getToken()→string|null`, `Register(name,email,password)` (3 args), métodos sobreviventes de Compras confirmados por leitura do código.
- **Placeholders:** nenhum. Onde há incerteza de runtime (timing de async validator, providers extras na criação de componente), há instrução explícita de como ajustar a partir da mensagem de erro real.
