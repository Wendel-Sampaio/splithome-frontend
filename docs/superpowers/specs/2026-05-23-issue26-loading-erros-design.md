# Issue #26 — Estados de loading e mensagens de erro consistentes

**Data:** 2026-05-23
**Issue:** [#26 — feat: adicionar estados de loading e mensagens de erro consistentes](https://github.com/orgs/splithome/issues/26)
**Branch:** `26-feat/estados-loading-mensagens-erros`

## Contexto

Problemas atuais:

- Nenhuma chamada HTTP tem indicador de loading (spinner / botão desabilitado).
- Usuário pode clicar múltiplas vezes e disparar requests duplicados.
- `alert()` usado em `login.component.ts:60` em vez de `MatSnackBar`.
- Erros de rede (offline, timeout) não são tratados nem comunicados ao usuário.
- Uso inconsistente de feedback: alguns lugares usam snackbar, outros alert, outros são silenciosos.

## Objetivos

1. Centralizar feedback via novo `NotificationService` (success/error/info/warning).
2. Adicionar `loading` signal por componente, desabilitar botões e mostrar spinner.
3. Estender `http-interceptor` para tratar erros técnicos (0, 408, 500-503, 504).
4. Definir contrato claro: componente trata erros de negócio; interceptor trata erros técnicos.
5. Refatorar 14 componentes que fazem HTTP para o novo padrão.

## Arquitetura

### NotificationService (novo)

`src/app/shared/services/notification/notification.service.ts`

- Wrapper sobre `MatSnackBar`.
- Métodos: `success(msg)`, `error(msg)`, `info(msg)`, `warning(msg)`.
- Config padrão: posição `bottom center`, `panelClass` por tipo.
- Duração: sucesso/info 4s, erro/warning 6s.
- `providedIn: 'root'`.

`panelClass` global em `src/styles.scss`:

- `snack-success` (verde)
- `snack-error` (vermelho)
- `snack-info` (azul)
- `snack-warning` (amarelo)

### http-interceptor (modificar)

`src/app/core/auth/user/http-interceptor.service.ts`

Substituir `MatSnackBar` direto por `NotificationService`. Estender `catchError`:

| Status | Ação |
|---|---|
| 0 | `notify.error('Sem conexão. Verifique sua internet.')` |
| 401 | mantém logout + redirect (silencioso) |
| 403 | `notify.error('Acesso negado')` |
| 408 | `notify.error('Tempo esgotado. Tente novamente.')` |
| 500-503 | `notify.error('Erro no servidor. Tente novamente em instantes.')` |
| 504 | `notify.error('Tempo esgotado. Tente novamente.')` |
| outros | propaga sem notificar |

Sempre `throwError(() => err)` no final para componente ainda poder reagir.

### Loading por componente — padrão signal

```ts
protected loading = signal(false);

acao() {
  this.loading.set(true);
  this.service.fazer(payload)
    .pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: () => this.notify.success('Salvo!'),
      error: (err) => {
        if (err.status === 422) this.notify.error(err.error.message);
      }
    });
}
```

Template:

```html
<button mat-raised-button type="submit" [disabled]="loading() || form.invalid">
  <mat-spinner *ngIf="loading()" diameter="20"></mat-spinner>
  <span *ngIf="!loading()">Salvar</span>
</button>
```

Para listas/dados:

```html
<mat-spinner *ngIf="loading()"></mat-spinner>
<div *ngIf="!loading()"><!-- conteúdo --></div>
```

Para dialogs: `<mat-progress-bar mode="indeterminate">` no topo.

## Componentes alterados

| Componente | Mudanças |
|---|---|
| `pages/login/login.component.ts` | remove `alert()`, `loading` signal, `NotificationService.error` |
| `pages/cadastro/cadastro.component.ts` | `loading` signal, success/error via `NotificationService` |
| `pages/home/home.component.ts` | `loading` signal em fetches |
| `pages/estatisticas/estatisticas.component.ts` | `loading` signal em gráficos |
| `shared/components/form-transacao/form-transacao.component.ts` | substitui `_snackBar` por `NotificationService`, `loading` signal |
| `shared/components/compras/compras.component.ts` | `loading` signal em lista, notificações em ações |
| `shared/components/despesas/despesas.component.ts` | mesmo padrão |
| `shared/components/dialog-pagamento/dialog-pagamento.component.ts` | `loading` signal, `NotificationService` |
| `shared/components/meu-perfil/meu-perfil.component.ts` | substitui `_snackBar` por `NotificationService`, `loading` signal |

Componentes sem HTTP direto (sem mudança lógica): `logout.component`, `confirm-delete.component`, `upgrade.component`.
Services sem mudança: `compra.service`, `transacao.service`, `estatisticas.service`, `user.service`, `plan.service` (só repassam observables).

**Total componentes alterados:** 9 (4 pages + 5 shared).

## Contrato de erros

| Status | Quem trata | Tipo |
|---|---|---|
| 0 | interceptor | técnico |
| 400 | componente | negócio |
| 401 | interceptor | sessão |
| 403 | interceptor | autorização |
| 404 | componente | negócio |
| 408 | interceptor | técnico |
| 422 | componente | validação |
| 500-503 | interceptor | técnico |
| 504 | interceptor | técnico |

**Regra:** componente notifica erros de **negócio**; interceptor notifica erros **técnicos/infra**.

## Convenção de mensagens (PT-BR)

- Sucesso: curtas, ação no passado. "Salvo!", "Atualizado!", "Excluído!".
- Erro de negócio: específico do contexto. Ex: "Email já cadastrado", "Senha incorreta".
- Erro técnico: definido no interceptor (ver tabela).

## Testes

### Novos

- `notification.service.spec.ts`: 4 testes, um por método. Mock `MatSnackBar`, verifica `panelClass` e mensagem.

### Atualizados

- `http-interceptor.service.spec.ts`:
  - 0 → `notify.error('Sem conexão. Verifique sua internet.')`
  - 408 → `notify.error('Tempo esgotado. Tente novamente.')`
  - 500 → `notify.error('Erro no servidor. Tente novamente em instantes.')`
  - 504 → `notify.error('Tempo esgotado. Tente novamente.')`
  - 401 → `removerToken` + `router.navigate(['/login'])`, sem notify
  - 403 → `notify.error('Acesso negado')`
  - 400/404/422 → nenhum notify
- Specs dos 9 componentes alterados:
  - `loading()` vira `true` ao submit, `false` após `next`/`error`
  - botão fica `[disabled]` durante request
  - asserts trocam `alert`/`_snackBar` por `notify.success`/`notify.error`

**Comando:** `npm test` deve passar.

## Não-objetivos (out of scope)

- Retry automático de requests falhos.
- Cache de respostas HTTP.
- Refatorar services para Signals/State management global.
- Internacionalização das mensagens (PT-BR only).
- Telemetria de erros (Sentry, etc).

## Estrutura final de arquivos

```
src/app/shared/services/notification/
├── notification.service.ts        (novo)
└── notification.service.spec.ts   (novo)

src/app/core/auth/user/
├── http-interceptor.service.ts        (modificado)
└── http-interceptor.service.spec.ts   (modificado)

src/styles.scss                    (modificado: 4 panelClass globais)

+ 9 componentes alterados (ver tabela)
+ 9 specs atualizados
```
