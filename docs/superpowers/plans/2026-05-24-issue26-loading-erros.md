# Issue #26 — Estados de loading e mensagens de erro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar feedback HTTP no SplitHome — `NotificationService` centralizado, `loading` signals por componente, interceptor que captura erros técnicos (offline/timeout/5xx), elimina `alert()`.

**Architecture:** Novo `NotificationService` wrapper sobre `MatSnackBar` com 4 métodos tipados (success/error/info/warning) e `panelClass` global. `http-interceptor` estendido mapeia status 0/408/500-503/504 para mensagens amigáveis via `NotificationService`. Componentes adotam `loading = signal(false)` + `finalize(() => loading.set(false))`, botões `[disabled]="loading()"`, spinner Material no template.

**Tech Stack:** Angular 19.2 (standalone), TypeScript 5.7 strict, Angular Material 19 (`MatSnackBar`, `MatProgressSpinner`, `MatProgressBar`), RxJS 7.8, Jasmine/Karma.

**Spec:** `docs/superpowers/specs/2026-05-23-issue26-loading-erros-design.md`

---

## File Structure

**Novos:**
- `src/app/shared/services/notification/notification.service.ts`
- `src/app/shared/services/notification/notification.service.spec.ts`
- `src/app/core/auth/user/http-interceptor.service.spec.ts`

**Modificados:**
- `src/styles.scss` (4 panelClass globais)
- `src/app/core/auth/user/http-interceptor.service.ts`
- `src/app/pages/login/login.component.ts` + `.html` + `.spec.ts`
- `src/app/pages/cadastro/cadastro.component.ts` + `.html` + `.spec.ts`
- `src/app/pages/estatisticas/estatisticas.component.ts` + (spec novo se faltar)
- `src/app/shared/components/meu-perfil/meu-perfil.component.ts` + `.spec.ts`
- `src/app/shared/components/form-transacao/form-transacao.component.ts` + `.spec.ts`
- `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.ts` + `.spec.ts`
- `src/app/shared/components/compras/compras.component.ts` + `.spec.ts`
- `src/app/shared/components/despesas/despesas.component.ts` + `.spec.ts`

---

## Task 1: Global panelClass styles

**Files:**
- Modify: `src/styles.scss`

- [ ] **Step 1: Adicionar classes globais ao styles.scss**

Append ao final de `src/styles.scss`:

```scss
.snack-success {
  --mdc-snackbar-container-color: #2e7d32;
  --mdc-snackbar-supporting-text-color: #ffffff;
  --mat-snack-bar-button-color: #ffffff;
}

.snack-error {
  --mdc-snackbar-container-color: #c62828;
  --mdc-snackbar-supporting-text-color: #ffffff;
  --mat-snack-bar-button-color: #ffffff;
}

.snack-info {
  --mdc-snackbar-container-color: #1565c0;
  --mdc-snackbar-supporting-text-color: #ffffff;
  --mat-snack-bar-button-color: #ffffff;
}

.snack-warning {
  --mdc-snackbar-container-color: #ef6c00;
  --mdc-snackbar-supporting-text-color: #ffffff;
  --mat-snack-bar-button-color: #ffffff;
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build succeeds, no SCSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles.scss
git commit -m "style: adiciona panelClass globais para snackbars"
```

---

## Task 2: NotificationService

**Files:**
- Create: `src/app/shared/services/notification/notification.service.ts`
- Test: `src/app/shared/services/notification/notification.service.spec.ts`

- [ ] **Step 1: Escrever spec falhando**

Create `src/app/shared/services/notification/notification.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });
    service = TestBed.inject(NotificationService);
  });

  it('success() abre snackbar com panelClass snack-success e 4s', () => {
    service.success('Salvo!');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Salvo!', 'Fechar', {
      duration: 4000,
      panelClass: ['snack-success'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });

  it('error() abre snackbar com panelClass snack-error e 6s', () => {
    service.error('Falhou');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Falhou', 'Fechar', {
      duration: 6000,
      panelClass: ['snack-error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });

  it('info() abre snackbar com panelClass snack-info e 4s', () => {
    service.info('FYI');
    expect(snackBarSpy.open).toHaveBeenCalledWith('FYI', 'Fechar', {
      duration: 4000,
      panelClass: ['snack-info'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });

  it('warning() abre snackbar com panelClass snack-warning e 6s', () => {
    service.warning('Cuidado');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Cuidado', 'Fechar', {
      duration: 6000,
      panelClass: ['snack-warning'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/notification.service.spec.ts'`
Expected: FAIL — `Cannot find module './notification.service'`

- [ ] **Step 3: Implementar service**

Create `src/app/shared/services/notification/notification.service.ts`:

```ts
import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'snack-success', 4000);
  }

  error(message: string): void {
    this.show(message, 'snack-error', 6000);
  }

  info(message: string): void {
    this.show(message, 'snack-info', 4000);
  }

  warning(message: string): void {
    this.show(message, 'snack-warning', 6000);
  }

  private show(message: string, panelClass: string, duration: number): void {
    const config: MatSnackBarConfig = {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    };
    this.snackBar.open(message, 'Fechar', config);
  }
}
```

- [ ] **Step 4: Rodar test, confirmar pass**

Run: `npm test -- --watch=false --include='**/notification.service.spec.ts'`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/services/notification/
git commit -m "feat: adiciona NotificationService centralizado para feedback"
```

---

## Task 3: Estender http-interceptor

**Files:**
- Modify: `src/app/core/auth/user/http-interceptor.service.ts`
- Create: `src/app/core/auth/user/http-interceptor.service.spec.ts`

- [ ] **Step 1: Escrever spec falhando**

Create `src/app/core/auth/user/http-interceptor.service.spec.ts`:

```ts
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { meuhttpInterceptor } from './http-interceptor.service';
import { UserService } from './user.service';

describe('meuhttpInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notify: jasmine.SpyObj<NotificationService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    notify = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error', 'info', 'warning']);
    userService = jasmine.createSpyObj<UserService>('UserService', ['getToken', 'removerToken']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/home' });
    userService.getToken.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([meuhttpInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notify },
        { provide: UserService, useValue: userService },
        { provide: Router, useValue: router }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('status 0 notifica erro de rede', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').error(new ProgressEvent('error'), { status: 0, statusText: '' });
    expect(notify.error).toHaveBeenCalledWith('Sem conexão. Verifique sua internet.');
  });

  it('status 408 notifica timeout', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 408, statusText: 'Timeout' });
    expect(notify.error).toHaveBeenCalledWith('Tempo esgotado. Tente novamente.');
  });

  it('status 504 notifica timeout', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 504, statusText: 'Gateway Timeout' });
    expect(notify.error).toHaveBeenCalledWith('Tempo esgotado. Tente novamente.');
  });

  it('status 500 notifica erro servidor', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 500, statusText: 'Server Error' });
    expect(notify.error).toHaveBeenCalledWith('Erro no servidor. Tente novamente em instantes.');
  });

  it('status 503 notifica erro servidor', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 503, statusText: 'Unavailable' });
    expect(notify.error).toHaveBeenCalledWith('Erro no servidor. Tente novamente em instantes.');
  });

  it('status 401 remove token e navega para /login sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 401, statusText: 'Unauthorized' });
    expect(userService.removerToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('status 403 notifica acesso negado', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 403, statusText: 'Forbidden' });
    expect(notify.error).toHaveBeenCalledWith('Acesso negado');
  });

  it('status 400 propaga sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 400, statusText: 'Bad Request' });
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('status 404 propaga sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 404, statusText: 'Not Found' });
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('status 422 propaga sem notificar', () => {
    http.get('/x').subscribe({ next: () => {}, error: () => {} });
    httpMock.expectOne('/x').flush('', { status: 422, statusText: 'Unprocessable' });
    expect(notify.error).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar test, confirmar que vários falham**

Run: `npm test -- --watch=false --include='**/http-interceptor.service.spec.ts'`
Expected: FAIL — interceptor atual só trata 401/403 e usa MatSnackBar direto.

- [ ] **Step 3: Reescrever interceptor**

Replace `src/app/core/auth/user/http-interceptor.service.ts`:

```ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { UserService } from './user.service';

export const meuhttpInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const userService = inject(UserService);
  const notify = inject(NotificationService);

  const token = userService.getToken();
  const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };

  if (token && !router.url.includes('/login') && !router.url.includes('/cadastro')) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  request = request.clone({ setHeaders: headers });

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const status = err.status;
        if (status === 0) {
          notify.error('Sem conexão. Verifique sua internet.');
        } else if (status === 401) {
          userService.removerToken();
          router.navigate(['/login']);
        } else if (status === 403) {
          notify.error('Acesso negado');
        } else if (status === 408 || status === 504) {
          notify.error('Tempo esgotado. Tente novamente.');
        } else if (status >= 500 && status <= 503) {
          notify.error('Erro no servidor. Tente novamente em instantes.');
        }
      }

      return throwError(() => err);
    })
  );
};
```

- [ ] **Step 4: Rodar test, confirmar pass**

Run: `npm test -- --watch=false --include='**/http-interceptor.service.spec.ts'`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/user/http-interceptor.service.ts src/app/core/auth/user/http-interceptor.service.spec.ts
git commit -m "feat: interceptor trata erros de rede via NotificationService"
```

---

## Task 4: login.component — remove alert, adiciona loading

**Files:**
- Modify: `src/app/pages/login/login.component.ts`
- Modify: `src/app/pages/login/login.component.html`
- Modify: `src/app/pages/login/login.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/pages/login/login.component.spec.ts` (verificar existente primeiro). Conteúdo:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
      imports: [LoginComponent, ReactiveFormsModule, NoopAnimationsModule],
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
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/login.component.spec.ts'`
Expected: FAIL — `component.loading` não existe.

- [ ] **Step 3: Atualizar component.ts**

Replace `src/app/pages/login/login.component.ts`:

```ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { Login } from '../../core/auth/user/login';
import { UserService } from '../../core/auth/user/user.service';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    MatCardModule,
    MatIcon,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  router = inject(Router);
  userService = inject(UserService);
  hide1 = signal(true);
  loading = signal(false);
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  login() {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    const login: Login = new Login(email, password);
    this.loading.set(true);

    this.userService.logar(login).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: token => {
        this.userService.addToken(token);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.notify.error('Usuário ou senha incorreto!');
      }
    });
  }
}
```

- [ ] **Step 4: Atualizar template — desabilita botão e mostra spinner**

Replace botão em `src/app/pages/login/login.component.html` (linha 38):

```html
<button mat-raised-button id="register-button" (click)="login()"
        [disabled]="loading() || loginForm.invalid">
  <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
  <span *ngIf="!loading()">Entrar</span>
</button>
```

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/login.component.spec.ts'`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/login/
git commit -m "refactor(login): remove alert, adiciona loading signal e NotificationService"
```

---

## Task 5: cadastro.component

**Files:**
- Modify: `src/app/pages/cadastro/cadastro.component.ts`
- Modify: `src/app/pages/cadastro/cadastro.component.html`
- Modify: `src/app/pages/cadastro/cadastro.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/pages/cadastro/cadastro.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
      imports: [CadastroComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
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
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/cadastro.component.spec.ts'`
Expected: FAIL — `component.loading` não existe, `mensagemErro` ainda usado.

- [ ] **Step 3: Atualizar component.ts**

Replace `src/app/pages/cadastro/cadastro.component.ts`:

```ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { UserService } from '../../core/auth/user/user.service';
import { Register } from '../../core/auth/user/register';
import { NotificationService } from '../../shared/services/notification/notification.service';
import { CommonModule } from '@angular/common';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CommonModule,
  ],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.scss']
})
export class CadastroComponent {
  cadastroForm: FormGroup;
  router = inject(Router);
  userService = inject(UserService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  hide1 = signal(true);
  hide2 = signal(true);
  loading = signal(false);

  constructor(private fb: FormBuilder) {
    this.cadastroForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/[!@#$%^&*(),.?":{}|<>]/)]],
      repeatPassword: ['', [Validators.required], [this.passwordMatchValidator.bind(this)]],
    });
  }

  passwordMatchValidator(control: AbstractControl): Promise<ValidationErrors | null> {
    return new Promise((resolve) => {
      const password = this.cadastroForm.get('password')?.value;
      const repeatPassword = control.value;
      resolve(password !== repeatPassword ? { passwordMismatch: true } : null);
    });
  }

  clickEventPassword(event: MouseEvent) {
    this.hide1.set(!this.hide1());
    event.stopPropagation();
  }

  clickEventRepeatPassword(event: MouseEvent) {
    this.hide2.set(!this.hide2());
    event.stopPropagation();
  }

  registrar() {
    if (this.cadastroForm.invalid) {
      return;
    }

    const { name, email, password } = this.cadastroForm.value;
    const register: Register = new Register(name, email, password);
    this.loading.set(true);

    this.userService.cadastrar(register).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Cadastro realizado com sucesso!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        if (error?.status === 409 || error?.status === 404) {
          const parsed = typeof error.error === 'string' ? JSON.parse(error.error) : error.error;
          this.notify.error(parsed?.message ?? 'Não foi possível concluir o cadastro.');
        } else {
          this.notify.error('Não foi possível concluir o cadastro.');
        }
      }
    });
  }
}
```

- [ ] **Step 4: Atualizar template — remover bloco mensagemErro, ajustar botão**

Em `src/app/pages/cadastro/cadastro.component.html`:

Remover bloco (linhas 75-77):
```html
<div class="message-error" *ngIf="mensagemErro">
  {{ mensagemErro }}
</div>
```

Substituir botão (linhas 80-84):
```html
<mat-card-actions>
  <button mat-raised-button id="register-button" (click)="registrar()"
          [disabled]="loading() || cadastroForm.invalid">
    <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
    <span *ngIf="!loading()">Cadastrar</span>
  </button>
</mat-card-actions>
```

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/cadastro.component.spec.ts'`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/cadastro/
git commit -m "refactor(cadastro): loading signal, NotificationService, remove mensagemErro"
```

---

## Task 6: meu-perfil.component

**Files:**
- Modify: `src/app/shared/components/meu-perfil/meu-perfil.component.ts`
- Modify: `src/app/shared/components/meu-perfil/meu-perfil.component.html` (botão salvar)
- Modify: `src/app/shared/components/meu-perfil/meu-perfil.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/shared/components/meu-perfil/meu-perfil.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MeuPerfilComponent } from './meu-perfil.component';
import { UserService } from '../../../core/auth/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';
import { User } from '../../../core/models/user/user';

describe('MeuPerfilComponent', () => {
  let component: MeuPerfilComponent;
  let fixture: ComponentFixture<MeuPerfilComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let notify: jasmine.SpyObj<NotificationService>;

  const fakeUser: User = {
    id: '1', name: 'A', email: 'a@b.com', phoneNumber: '', pixKey: '',
    familyCode: 'F1', plan: 'FREE', profilePhoto: ''
  };

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService',
      ['getUser', 'getUserById', 'atualizarUsuario', 'getProfilePhoto', 'saveProfilePhoto']);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    userService.getUser.and.returnValue(fakeUser);
    userService.getUserById.and.returnValue(of(fakeUser));
    userService.getProfilePhoto.and.returnValue('photo-url');
    userService.atualizarUsuario.and.returnValue(of('ok'));

    await TestBed.configureTestingModule({
      imports: [MeuPerfilComponent, FormsModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MeuPerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('atualizarUsuario com isEditable=true notifica sucesso', () => {
    component.isEditable = true;
    component.atualizarUsuario();
    expect(userService.atualizarUsuario).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Usuário atualizado com sucesso!');
    expect(component.loading()).toBe(false);
  });

  it('erro de atualização notifica erro de negócio', () => {
    component.isEditable = true;
    userService.atualizarUsuario.and.returnValue(throwError(() => ({ status: 400 })));
    component.atualizarUsuario();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível atualizar o perfil.');
    expect(component.loading()).toBe(false);
  });

  it('atualizarUsuario com isEditable=false não dispara request', () => {
    component.isEditable = false;
    component.atualizarUsuario();
    expect(userService.atualizarUsuario).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/meu-perfil.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Atualizar component.ts**

Replace `src/app/shared/components/meu-perfil/meu-perfil.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { User } from '../../../core/models/user/user';
import { UserService } from '../../../core/auth/user/user.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'meu-perfil',
  templateUrl: 'meu-perfil.component.html',
  styleUrl: 'meu-perfil.component.scss',
  imports: [
    MatCardModule, MatButtonModule, MatIcon, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, CommonModule, FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeuPerfilComponent implements OnInit {

  isEditable: boolean = false;
  readonly acceptProfilePhoto = 'image/png,image/jpeg,image/webp';
  loading = signal(false);
  @Output() profilePhotoUpdated = new EventEmitter<string>();
  private cdr = inject(ChangeDetectorRef);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  userData: User = {
    id: '', name: '', email: '', phoneNumber: '', pixKey: '',
    familyCode: '', plan: 'FREE', profilePhoto: ''
  };

  userService = inject(UserService);

  ngOnInit(): void {
    const loggedUser = this.userService.getUser();
    this.userData = {
      ...loggedUser,
      profilePhoto: this.userService.getProfilePhoto(loggedUser)
    };
    this.loadUserData();
  }

  toggleEditMode() {
    this.isEditable = !this.isEditable;
  }

  cancelEdit() {
    this.isEditable = false;
    this.loadUserData();
  }

  get profilePhotoUrl(): string {
    return this.userService.getProfilePhoto(this.userData);
  }

  onProfilePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notify.error('Selecione um arquivo de imagem.');
      input.value = '';
      return;
    }

    this.resizeProfilePhoto(file)
      .then((profilePhoto) => {
        const userId = this.userData.id || this.userService.getUser().id;
        this.userData = { ...this.userData, id: userId, profilePhoto };
        this.userService.saveProfilePhoto(userId, profilePhoto);
        this.profilePhotoUpdated.emit(profilePhoto);
        this.persistProfilePhoto();
        this.notify.success('Foto de perfil atualizada com sucesso!');
        this.cdr.markForCheck();
      })
      .catch(() => this.notify.error('Não foi possível carregar a foto selecionada.'))
      .finally(() => { input.value = ''; });
  }

  copyToClipboard() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.userData.familyCode)
        .then(() => this.notify.success('Código da família copiado com sucesso!'))
        .catch(() => this.notify.error('Não foi possível copiar o código.'));
    } else {
      this.notify.warning('Recurso de cópia não suportado neste navegador.');
    }
  }

  loadUserData() {
    const userId = this.userService.getUser().id;
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.userData = user;
      this.cdr.markForCheck();
    });
  }

  atualizarUsuario() {
    if (this.isEditable !== true) {
      return;
    }

    const userId = this.userService.getUser().id;
    this.loading.set(true);
    this.userService.atualizarUsuario(userId, this.userData).pipe(
      finalize(() => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Usuário atualizado com sucesso!');
        this.loadUserData();
      },
      error: () => {
        this.notify.error('Não foi possível atualizar o perfil.');
      }
    });
  }

  private persistProfilePhoto() {
    const userId = this.userData.id || this.userService.getUser().id;

    if (!userId) {
      return;
    }

    this.userService.atualizarUsuario(userId, {
      ...this.userData,
      id: userId
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private resizeProfilePhoto(file: File): Promise<string> {
    const maxSize = 320;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject();
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
          const width = Math.round(image.width * scale);
          const height = Math.round(image.height * scale);
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        image.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}
```

- [ ] **Step 4: Atualizar template — botão Salvar com spinner/disabled**

Em `src/app/shared/components/meu-perfil/meu-perfil.component.html`: encontrar botão que chama `atualizarUsuario()` e substituir por:

```html
<button mat-raised-button color="primary" (click)="atualizarUsuario()"
        [disabled]="loading() || !isEditable">
  <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
  <span *ngIf="!loading()">Salvar</span>
</button>
```

Se o botão atual já tem texto diferente (ex: "Atualizar"), preservar texto dentro do `<span>`.

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/meu-perfil.component.spec.ts'`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/meu-perfil/
git commit -m "refactor(meu-perfil): NotificationService, loading signal no submit"
```

---

## Task 7: form-transacao.component

**Files:**
- Modify: `src/app/shared/components/form-transacao/form-transacao.component.ts`
- Modify: `src/app/shared/components/form-transacao/form-transacao.component.html` (botão confirmação)
- Modify: `src/app/shared/components/form-transacao/form-transacao.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/shared/components/form-transacao/form-transacao.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { FormTransacaoComponent } from './form-transacao.component';
import { CompraService } from '../../services/compra/compra.service';
import { TransacaoService } from '../../services/transacao/transacao.service';
import { UserService } from '../../../core/auth/user/user.service';
import { PlanService } from '../../../core/plan/plan.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('FormTransacaoComponent', () => {
  let component: FormTransacaoComponent;
  let fixture: ComponentFixture<FormTransacaoComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FormTransacaoComponent>>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService',
      ['cadastrarCompra', 'cadastrarDespesa', 'atualizarCompra']);
    const transacaoService = jasmine.createSpyObj<TransacaoService>('TransacaoService', ['listarCategorias']);
    transacaoService.listarCategorias.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService',
      ['getUser', 'getAllUsers', 'getProfilePhoto']);
    userService.getUser.and.returnValue({
      id: 'u1', name: 'Eu', email: '', phoneNumber: '', pixKey: '',
      familyCode: 'F1', plan: 'PREMIUM', profilePhoto: ''
    } as any);
    userService.getAllUsers.and.returnValue(of([]));
    const planService = jasmine.createSpyObj<PlanService>('PlanService', ['isPremium']);
    planService.isPremium.and.returnValue(true);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<FormTransacaoComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [FormTransacaoComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: compraService },
        { provide: TransacaoService, useValue: transacaoService },
        { provide: UserService, useValue: userService },
        { provide: PlanService, useValue: planService },
        { provide: NotificationService, useValue: notify },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormTransacaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function preencher() {
    component.formTransacao.patchValue({
      titulo: 'X', categoria: 'C', valor: '10', dataPagamento: new Date()
    });
    component.pagadores = ['Eu'];
  }

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('sem pagador notifica warning e não dispara request', () => {
    component.pagadores = [];
    component.cadastrarTransacao();
    expect(notify.warning).toHaveBeenCalledWith('Selecione pelo menos um pagador.');
    expect(compraService.cadastrarCompra).not.toHaveBeenCalled();
  });

  it('sucesso de compra notifica success e fecha dialog', () => {
    compraService.cadastrarCompra.and.returnValue(of({} as any));
    preencher();
    component.cadastrarTransacao();
    expect(notify.success).toHaveBeenCalledWith('Compra cadastrada com sucesso!');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.loading()).toBe(false);
  });

  it('erro de compra notifica error e mantém dialog aberto', () => {
    compraService.cadastrarCompra.and.returnValue(throwError(() => ({ status: 500 })));
    preencher();
    component.cadastrarTransacao();
    expect(notify.error).toHaveBeenCalledWith('Erro ao cadastrar compra!');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.loading()).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/form-transacao.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Atualizar component.ts**

Em `src/app/shared/components/form-transacao/form-transacao.component.ts` aplicar:

Substituir `import { MatSnackBar } from '@angular/material/snack-bar';` por:
```ts
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { NotificationService } from '../../services/notification/notification.service';
```

No array de `imports` do `@Component`, substituir nada extra mas adicionar `MatProgressSpinnerModule`.

Substituir `private _snackBar = inject(MatSnackBar);` por:
```ts
private notify = inject(NotificationService);
loading = signal(false);
```

E adicionar `signal` ao import de `@angular/core`.

Substituir método `cadastrarTransacao()`:

```ts
cadastrarTransacao() {
  if (!this.pagadores.length) {
    this.notify.warning('Selecione pelo menos um pagador.');
    return;
  }

  const categoriaSelecionada = this.formTransacao.value.categoria;
  const usuarioLogado = this.userService.getUser();
  const familyId = usuarioLogado.familyId ?? usuarioLogado.familyCode;
  const pagadores = this.isPremium ? this.pagadores : [usuarioLogado.name];
  this.pagadoresRestantes = !this.isPremium
    ? []
    : this.isEdicaoCompra
    ? this.getPagadoresRestantesEdicao()
    : [...pagadores];

  const formData = {
    ...(this.isEdicaoCompra ? { id: this.data?.compra?.id } : {}),
    title: this.formTransacao.value.titulo,
    category: categoriaSelecionada,
    value: Number(this.formTransacao.value.valor),
    payers: pagadores,
    paymentDate: moment(this.formTransacao.value.dataPagamento).format('YYYY-MM-DDTHH:mm:ss'),
    remainingPayers: this.pagadoresRestantes,
    familyId,
    ...(this.isDespesa
      ? { responsibleId: this.responsavel }
      : {
        purchaserId: this.responsavel,
        purchaseDate: this.isEdicaoCompra && this.data?.compra?.purchaseDate
          ? moment(this.data.compra.purchaseDate).format('YYYY-MM-DDTHH:mm:ss')
          : moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
      })
  };

  const request = this.isEdicaoCompra
    ? this.compraService.atualizarCompra(formData)
    : this.isDespesa
    ? this.compraService.cadastrarDespesa(formData)
    : this.compraService.cadastrarCompra(formData);

  this.loading.set(true);
  request.pipe(
    finalize(() => this.loading.set(false)),
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: () => {
      this.notify.success(this.getMensagemSucesso());
      this.dialogRef?.close(true);
    },
    error: () => {
      this.notify.error(this.getMensagemErro());
    }
  });
}
```

Remover método `openSnackBar` (não usado mais).

- [ ] **Step 4: Atualizar template — botão de confirmação**

Em `src/app/shared/components/form-transacao/form-transacao.component.html`: localizar o botão que exibe `textoBotaoConfirmacao` e substituir por:

```html
<button mat-raised-button color="primary" (click)="cadastrarTransacao()"
        [disabled]="loading()">
  <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
  <span *ngIf="!loading()">{{ textoBotaoConfirmacao }}</span>
</button>
```

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/form-transacao.component.spec.ts'`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/form-transacao/
git commit -m "refactor(form-transacao): NotificationService, loading signal"
```

---

## Task 8: dialog-pagamento.component

**Files:**
- Modify: `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.ts`
- Modify: `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.html`
- Modify: `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DialogPagamentoComponent } from './dialog-pagamento.component';
import { UserService } from '../../../core/auth/user/user.service';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('DialogPagamentoComponent', () => {
  let component: DialogPagamentoComponent;
  let fixture: ComponentFixture<DialogPagamentoComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<DialogPagamentoComponent>>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService', ['atualizarCompra', 'atualizarDespesa']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u2', name: 'Outro' } as any));
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);
    dialogRef = jasmine.createSpyObj<MatDialogRef<DialogPagamentoComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DialogPagamentoComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UserService, useValue: userService },
        { provide: CompraService, useValue: compraService },
        { provide: NotificationService, useValue: notify },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {
          id: 'c1', remainingPayers: ['Eu'], purchaserId: 'u2', tipo: 'compra'
        }}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DialogPagamentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false', () => {
    expect(component.loading()).toBe(false);
  });

  it('pagamento de compra com sucesso notifica e fecha', () => {
    compraService.atualizarCompra.and.returnValue(of({} as any));
    component.efetuarPagamento();
    expect(compraService.atualizarCompra).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Pagamento registrado!');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.loading()).toBe(false);
  });

  it('erro de pagamento notifica erro', () => {
    compraService.atualizarCompra.and.returnValue(throwError(() => ({ status: 500 })));
    component.efetuarPagamento();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível registrar o pagamento.');
    expect(component.loading()).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/dialog-pagamento.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Atualizar component.ts**

Replace `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.ts`:

```ts
import { Component, DestroyRef, inject, Inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { UserService } from '../../../core/auth/user/user.service';
import { User } from '../../../core/models/user/user';
import { CompraService } from '../../services/compra/compra.service';
import { NotificationService } from '../../services/notification/notification.service';
import { CommonModule } from '@angular/common';

export interface ModeloPagamento {
  id: string;
  remainingPayers: string[];
}

@Component({
  selector: 'app-dialog-pagamento',
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, CommonModule],
  templateUrl: './dialog-pagamento.component.html',
  styleUrl: './dialog-pagamento.component.scss'
})
export class DialogPagamentoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogPagamentoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  userService = inject(UserService);
  compraService = inject(CompraService);
  private notify = inject(NotificationService);
  private destroyRef = inject(DestroyRef);
  loading = signal(false);
  user!: User;

  ngOnInit(): void {
    this.pegarComprador();
  }

  pegarComprador() {
    const userId = this.data.responsibleId ?? this.data.purchaserId;
    this.userService.getUserById(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => { this.user = user; }
    });
  }

  efetuarPagamento() {
    const nomePagador = this.userService.getUser().name;
    const index = this.data.remainingPayers.indexOf(nomePagador);
    if (index !== -1) {
      this.data.remainingPayers.splice(index, 1);
    }
    const modeloPagamento: ModeloPagamento = {
      id: this.data.id,
      remainingPayers: this.data.remainingPayers
    };
    const request = this.data.tipo === 'despesa'
      ? this.compraService.atualizarDespesa(modeloPagamento)
      : this.compraService.atualizarCompra(modeloPagamento);

    this.loading.set(true);
    request.pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Pagamento registrado!');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notify.error('Não foi possível registrar o pagamento.');
      }
    });
  }
}
```

- [ ] **Step 4: Atualizar template**

Em `src/app/shared/components/dialog-pagamento/dialog-pagamento.component.html`, localizar botão de confirmação de pagamento e substituir por:

```html
<button mat-raised-button color="primary" (click)="efetuarPagamento()"
        [disabled]="loading()">
  <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
  <span *ngIf="!loading()">Confirmar pagamento</span>
</button>
```

(Preservar texto exato do botão atual se diferente.)

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/dialog-pagamento.component.spec.ts'`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/dialog-pagamento/
git commit -m "refactor(dialog-pagamento): NotificationService, loading signal"
```

---

## Task 9: compras.component

**Files:**
- Modify: `src/app/shared/components/compras/compras.component.ts`
- Modify: `src/app/shared/components/compras/compras.component.html`
- Modify: `src/app/shared/components/compras/compras.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/shared/components/compras/compras.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ComprasComponent } from './compras.component';
import { CompraService } from '../../services/compra/compra.service';
import { UserService } from '../../../core/auth/user/user.service';
import { PlanService } from '../../../core/plan/plan.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('ComprasComponent', () => {
  let component: ComprasComponent;
  let fixture: ComponentFixture<ComprasComponent>;
  let compraService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    compraService = jasmine.createSpyObj<CompraService>('CompraService',
      ['listarCompras', 'atualizarCompra', 'deleteCompra']);
    compraService.listarCompras.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u1', name: 'Eu' } as any));
    const planService = jasmine.createSpyObj<PlanService>('PlanService', ['isPremium']);
    planService.isPremium.and.returnValue(true);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [ComprasComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: compraService },
        { provide: UserService, useValue: userService },
        { provide: PlanService, useValue: planService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComprasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loadingLista começa true e fica false após emissão', (done) => {
    component.compras$.subscribe(() => {
      expect(component.loadingLista()).toBe(false);
      done();
    });
  });

  it('erro ao carregar lista notifica erro', (done) => {
    compraService.listarCompras.and.returnValue(throwError(() => ({ status: 500 })));
    component.recarregarCompras();
    component.compras$.subscribe(() => {
      expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar as compras.');
      done();
    });
  });

  it('delete bem-sucedido notifica sucesso', () => {
    compraService.deleteCompra.and.returnValue(of('ok'));
    (component as any).confirmDeleteCompra('c1');
    expect(notify.success).toHaveBeenCalledWith('Compra excluída!');
  });

  it('delete com erro notifica erro de negócio', () => {
    compraService.deleteCompra.and.returnValue(throwError(() => ({ status: 400 })));
    (component as any).confirmDeleteCompra('c1');
    expect(notify.error).toHaveBeenCalledWith('Não foi possível excluir a compra.');
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/compras.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Atualizar component.ts**

Em `src/app/shared/components/compras/compras.component.ts`:

Adicionar imports:
```ts
import { signal } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { NotificationService } from '../../services/notification/notification.service';
```

Adicionar campo:
```ts
private notify = inject(NotificationService);
loadingLista = signal(true);
loadingAcao = signal(false);
```

Substituir definição de `compras$` (linhas 42-50):

```ts
readonly compras$ = this.recarregarComprasSubject.pipe(
  switchMap(() => {
    this.loadingLista.set(true);
    return this.compraService.listarCompras().pipe(
      switchMap(compras => this.tratamentoLista(compras)),
      tap(() => this.loadingLista.set(false)),
      catchError(() => {
        this.loadingLista.set(false);
        this.notify.error('Não foi possível carregar as compras.');
        return of([]);
      })
    );
  })
);
```

Substituir `efetuarPagamento` (parte do subscribe):

```ts
efetuarPagamento(element: any) {
  if (!this.verificaUserRemainingPayers(element)) {
    const userName = this.userService.getUser().name;
    element.remainingPayers.push(userName);
    element.isPaid = false;
    this.loadingAcao.set(true);
    this.compraService.atualizarCompra({
      id: element.id,
      remainingPayers: element.remainingPayers
    }).pipe(
      finalize(() => this.loadingAcao.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Pagamento registrado!');
        this.recarregarCompras();
      },
      error: () => {
        this.notify.error('Não foi possível registrar o pagamento.');
      }
    });
    return;
  }
  const dialogRef = this.dialog.open(DialogPagamentoComponent, { data: element });
  dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
    this.recarregarCompras();
  });
}
```

Substituir `confirmDeleteCompra`:

```ts
private confirmDeleteCompra(contaId: string): void {
  this.compraService.deleteCompra(contaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: () => {
      this.notify.success('Compra excluída!');
      this.recarregarCompras();
    },
    error: () => {
      this.notify.error('Não foi possível excluir a compra.');
    }
  });
}
```

- [ ] **Step 4: Atualizar template — spinner na lista**

Em `src/app/shared/components/compras/compras.component.html`, envolver tabela (ou trecho que mostra `compras$ | async`) para mostrar spinner durante carregamento. Adicionar no topo do bloco da tabela:

```html
<div class="loading-overlay" *ngIf="loadingLista()">
  <mat-spinner></mat-spinner>
</div>
```

Adicionar import necessário ao component:
```ts
imports: [
  MatTableModule, CommonModule, MatDialogModule, MatCardTitle,
  MatIconModule, MatButtonModule, MatProgressSpinnerModule,
  PagadoresPipe, CategoriaPipe
],
```
e `import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';`

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/compras.component.spec.ts'`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/compras/
git commit -m "refactor(compras): loading signals, NotificationService em ações"
```

---

## Task 10: despesas.component

**Files:**
- Modify: `src/app/shared/components/despesas/despesas.component.ts`
- Modify: `src/app/shared/components/despesas/despesas.component.html`
- Modify: `src/app/shared/components/despesas/despesas.component.spec.ts`

- [ ] **Step 1: Atualizar spec**

Replace `src/app/shared/components/despesas/despesas.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DespesasComponent } from './despesas.component';
import { CompraService } from '../../services/compra/compra.service';
import { UserService } from '../../../core/auth/user/user.service';
import { NotificationService } from '../../services/notification/notification.service';

describe('DespesasComponent', () => {
  let component: DespesasComponent;
  let fixture: ComponentFixture<DespesasComponent>;
  let despesaService: jasmine.SpyObj<CompraService>;
  let notify: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    despesaService = jasmine.createSpyObj<CompraService>('CompraService',
      ['listarDespesas', 'atualizarDespesa', 'deleteDespesa']);
    despesaService.listarDespesas.and.returnValue(of([]));
    const userService = jasmine.createSpyObj<UserService>('UserService', ['getUser', 'getUserById']);
    userService.getUser.and.returnValue({ id: 'u1', name: 'Eu' } as any);
    userService.getUserById.and.returnValue(of({ id: 'u1', name: 'Eu' } as any));
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [DespesasComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: CompraService, useValue: despesaService },
        { provide: UserService, useValue: userService },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DespesasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loadingLista começa true e fica false após emissão', (done) => {
    component.despesas$.subscribe(() => {
      expect(component.loadingLista()).toBe(false);
      done();
    });
  });

  it('erro ao carregar lista notifica erro', (done) => {
    despesaService.listarDespesas.and.returnValue(throwError(() => ({ status: 500 })));
    component.recarregarDespesas();
    component.despesas$.subscribe(() => {
      expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar as despesas.');
      done();
    });
  });

  it('delete bem-sucedido notifica sucesso', () => {
    despesaService.deleteDespesa.and.returnValue(of('ok'));
    (component as any).confirmDeleteDespesa('d1');
    expect(notify.success).toHaveBeenCalledWith('Despesa excluída!');
  });

  it('delete com erro notifica erro de negócio', () => {
    despesaService.deleteDespesa.and.returnValue(throwError(() => ({ status: 400 })));
    (component as any).confirmDeleteDespesa('d1');
    expect(notify.error).toHaveBeenCalledWith('Não foi possível excluir a despesa.');
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/despesas.component.spec.ts'`
Expected: FAIL.

- [ ] **Step 3: Atualizar component.ts**

Em `src/app/shared/components/despesas/despesas.component.ts`:

Adicionar imports/campos análogos a compras:
```ts
import { signal } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../services/notification/notification.service';
```

Adicionar `MatProgressSpinnerModule` ao array `imports` do `@Component`.

Adicionar campos no início da classe:
```ts
private notify = inject(NotificationService);
loadingLista = signal(true);
loadingAcao = signal(false);
```

Substituir definição de `despesas$`:

```ts
readonly despesas$ = this.recarregarDespesasSubject.pipe(
  switchMap(() => {
    this.loadingLista.set(true);
    return this.despesaService.listarDespesas().pipe(
      switchMap(despesas => this.tratamentoLista(despesas)),
      tap(() => this.loadingLista.set(false)),
      catchError(() => {
        this.loadingLista.set(false);
        this.notify.error('Não foi possível carregar as despesas.');
        return of([]);
      })
    );
  })
);
```

Substituir `efetuarPagamento`:

```ts
efetuarPagamento(element: Despesa): void {
  if (!this.verificaUserRemainingPayers(element)) {
    const userName = this.userService.getUser().name;
    element.remainingPayers.push(userName);
    element.isPaid = false;
    this.loadingAcao.set(true);
    this.despesaService.atualizarDespesa({
      id: element.id,
      remainingPayers: element.remainingPayers
    }).pipe(
      finalize(() => this.loadingAcao.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.notify.success('Pagamento registrado!');
        this.recarregarDespesas();
      },
      error: () => {
        this.notify.error('Não foi possível registrar o pagamento.');
      }
    });
    return;
  }

  const dialogRef = this.dialog.open(DialogPagamentoComponent, {
    data: { ...element, tipo: 'despesa' }
  });
  dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
    this.recarregarDespesas();
  });
}
```

Substituir `confirmDeleteDespesa`:

```ts
private confirmDeleteDespesa(contaId: string): void {
  this.despesaService.deleteDespesa(contaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: () => {
      this.notify.success('Despesa excluída!');
      this.recarregarDespesas();
    },
    error: () => {
      this.notify.error('Não foi possível excluir a despesa.');
    }
  });
}
```

- [ ] **Step 4: Atualizar template**

Em `src/app/shared/components/despesas/despesas.component.html`, adicionar acima da tabela:

```html
<div class="loading-overlay" *ngIf="loadingLista()">
  <mat-spinner></mat-spinner>
</div>
```

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/despesas.component.spec.ts'`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/despesas/
git commit -m "refactor(despesas): loading signals, NotificationService em ações"
```

---

## Task 11: estatisticas.component

**Files:**
- Modify: `src/app/pages/estatisticas/estatisticas.component.ts`
- Modify: `src/app/pages/estatisticas/estatisticas.component.html` (substituir `*ngIf="carregando"` por `loading()`, remover bloco `erro`)
- Create: `src/app/pages/estatisticas/estatisticas.component.spec.ts`

- [ ] **Step 1: Criar spec**

Create `src/app/pages/estatisticas/estatisticas.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EstatisticasComponent } from './estatisticas.component';
import { EstatisticasService } from '../../shared/services/estatisticas/estatisticas.service';
import { NotificationService } from '../../shared/services/notification/notification.service';

describe('EstatisticasComponent', () => {
  let component: EstatisticasComponent;
  let fixture: ComponentFixture<EstatisticasComponent>;
  let service: jasmine.SpyObj<EstatisticasService>;
  let notify: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EstatisticasService>('EstatisticasService', ['buscarResumo']);
    notify = jasmine.createSpyObj<NotificationService>('NotificationService',
      ['success', 'error', 'info', 'warning']);
    service.buscarResumo.and.returnValue(of({ totaisPorCategoria: [], totaisPorMes: [] } as any));

    await TestBed.configureTestingModule({
      imports: [EstatisticasComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: EstatisticasService, useValue: service },
        { provide: NotificationService, useValue: notify }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EstatisticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loading começa false após ngOnInit completar', () => {
    expect(component.loading()).toBe(false);
    expect(component.resumo).toBeTruthy();
  });

  it('erro ao carregar resumo notifica e zera resumo', () => {
    service.buscarResumo.and.returnValue(throwError(() => ({ status: 500 })));
    component.carregarResumo();
    expect(notify.error).toHaveBeenCalledWith('Não foi possível carregar as estatísticas.');
    expect(component.resumo).toBeNull();
    expect(component.loading()).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar test, confirmar falha**

Run: `npm test -- --watch=false --include='**/estatisticas.component.spec.ts'`
Expected: FAIL — `loading` e injeção `NotificationService` inexistentes.

- [ ] **Step 3: Atualizar component.ts**

Replace `src/app/pages/estatisticas/estatisticas.component.ts`:

```ts
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { CategoriaPipe } from '../../shared/pipes/categoria.pipe';
import {
  EstatisticaMensal,
  EstatisticasResumo,
  EstatisticasService
} from '../../shared/services/estatisticas/estatisticas.service';
import { NotificationService } from '../../shared/services/notification/notification.service';

@Component({
  selector: 'app-estatisticas',
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatDatepickerModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule,
    CategoriaPipe
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './estatisticas.component.html',
  styleUrl: './estatisticas.component.scss'
})
export class EstatisticasComponent implements OnInit {
  private readonly estatisticasService = inject(EstatisticasService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periodoForm = new FormGroup({
    dataInicio: new FormControl<Date | null>(null),
    dataFim: new FormControl<Date | null>(null)
  });
  readonly cores = ['#48A75A', '#2F80ED', '#F2994A', '#9B51E0', '#EB5757', '#56CCF2', '#F2C94C', '#27AE60'];

  resumo: EstatisticasResumo | null = null;
  loading = signal(false);

  ngOnInit(): void {
    this.carregarResumo();
  }

  get totalCategorias(): number {
    return this.resumo?.totaisPorCategoria.reduce((total, item) => total + item.total, 0) ?? 0;
  }

  get totaisPorMes(): EstatisticaMensal[] {
    return this.resumo?.totaisPorMes.slice(-6) ?? [];
  }

  get maiorTotalMensal(): number {
    return Math.max(...this.totaisPorMes.map(item => item.total), 0);
  }

  get pieGradient(): string {
    const categorias = this.resumo?.totaisPorCategoria ?? [];
    if (!categorias.length || this.totalCategorias <= 0) {
      return '#eef3ef';
    }
    let inicio = 0;
    const partes = categorias.map((item, index) => {
      const fim = inicio + (item.total / this.totalCategorias) * 360;
      const cor = this.getCor(index);
      const segmento = `${cor} ${inicio}deg ${fim}deg`;
      inicio = fim;
      return segmento;
    });
    return `conic-gradient(${partes.join(', ')})`;
  }

  carregarResumo(): void {
    const dataInicio = this.periodoForm.controls.dataInicio.value;
    const dataFim = this.periodoForm.controls.dataFim.value;
    this.loading.set(true);

    this.estatisticasService.buscarResumo({
      dataInicio: dataInicio ? this.formatarData(dataInicio) : undefined,
      dataFim: dataFim ? this.formatarData(dataFim) : undefined
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: resumo => {
        this.resumo = resumo;
      },
      error: () => {
        this.notify.error('Não foi possível carregar as estatísticas.');
        this.resumo = null;
      }
    });
  }

  limparFiltro(): void {
    this.periodoForm.reset();
    this.carregarResumo();
  }

  getCor(index: number): string {
    return this.cores[index % this.cores.length];
  }

  getAlturaBarra(total: number): number {
    if (this.maiorTotalMensal <= 0) {
      return 0;
    }
    return Math.max((total / this.maiorTotalMensal) * 100, 6);
  }

  formatarMes(mes: string): string {
    const [ano, numeroMes] = mes.split('-');
    const data = new Date(Number(ano), Number(numeroMes) - 1, 1);
    if (Number.isNaN(data.getTime())) {
      return mes;
    }
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', '');
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
```

- [ ] **Step 4: Atualizar template**

Em `src/app/pages/estatisticas/estatisticas.component.html`:
- Substituir todas ocorrências de `*ngIf="carregando"` por `*ngIf="loading()"` e `*ngIf="!carregando"` por `*ngIf="!loading()"`.
- Remover bloco que renderiza `{{ erro }}`.
- Onde houver indicador textual de carregamento, garantir uso de `<mat-spinner *ngIf="loading()"></mat-spinner>`.

Comando para encontrar:
```bash
grep -n "carregando\|erro" src/app/pages/estatisticas/estatisticas.component.html
```

- [ ] **Step 5: Rodar testes**

Run: `npm test -- --watch=false --include='**/estatisticas.component.spec.ts'`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/estatisticas/
git commit -m "refactor(estatisticas): loading signal, NotificationService em erro"
```

---

## Task 12: Smoke test e PR

**Files:** nenhum.

- [ ] **Step 1: Rodar suite completa**

Run: `npm test -- --watch=false`
Expected: 100% PASS.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 3: Smoke manual UI**

Run: `npm start` (em background ou outra aba).
Abrir `http://localhost:4200`. Validar manualmente:
- Login com senha errada → snackbar vermelho "Usuário ou senha incorreto!" (não alert).
- Login válido com servidor offline → snackbar "Sem conexão. Verifique sua internet.".
- Botão Entrar fica desabilitado com spinner durante request.
- Cadastro com email duplicado → snackbar com mensagem do backend.
- Cadastro válido → snackbar verde "Cadastro realizado com sucesso!" + navega para /login.
- Em /home, cadastrar compra → spinner no botão, snackbar verde ao salvar.
- Editar perfil + salvar → snackbar verde.
- Tabelas de compras/despesas → spinner enquanto carrega.

- [ ] **Step 4: Confirmar branch limpa e push**

```bash
git status
git push origin 26-feat/estados-loading-mensagens-erros
```

- [ ] **Step 5: Abrir PR**

```bash
gh pr create --title "feat: estados de loading e mensagens de erro consistentes (closes #26)" --body "$(cat <<'EOF'
## Summary
- Novo `NotificationService` centraliza feedback via `MatSnackBar` (success/error/info/warning).
- `http-interceptor` trata erros técnicos (offline, timeout, 5xx) com mensagens amigáveis.
- 8 componentes migrados: loading signal, botões desabilitados durante request, spinners em listas/forms, `alert()` removido.

Closes #26
EOF
)"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Cada item da spec mapeado:
  - NotificationService → Task 2
  - Estilos panelClass → Task 1
  - Interceptor estendido → Task 3
  - 8 componentes → Tasks 4-11
  - Convenção de mensagens → presente em cada task
  - Testes → embutidos em cada task (TDD)
- [x] **Placeholder scan:** sem TBD/TODO; código completo em cada step.
- [x] **Type consistency:** `loading` signal usado uniformemente; `loadingLista`/`loadingAcao` apenas onde há dois eixos (compras/despesas); `NotificationService` métodos sempre `success/error/info/warning`.
- [x] **Mensagens consistentes:** "Pagamento registrado!" idêntico em dialog-pagamento, compras, despesas; "Não foi possível…" padrão para erros de negócio.
