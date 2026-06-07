# Design — Suíte de testes verde + CI (issue #52)

Data: 2026-06-04
Branch: `52-ci-e-testes`
Substitui a PR #52 (`automated-tests-generation`), que está ~70 commits atrás da `master` e não compila contra o código atual.

## Objetivo

1. Deixar `npm test` 100% verde na `master`, aproveitando os testes de qualidade
   já escritos na PR #52.
2. Adicionar um CI (GitHub Actions) que roda `build` + testes em todo Pull Request
   direcionado à `master`, servindo como gate antes do merge.

## Contexto / estado atual

- **Nenhum** workflow de CI existe (`.github/workflows/` só tem `ISSUE_TEMPLATE`).
- `npm test` na `master` hoje: **11 passam / 12 falham**. As 12 falhas são specs
  autogerados que injetam serviços com `HttpClient` sem prover o
  `provideHttpClient()` no `TestBed` → `NullInjectorError: No provider for HttpClient`.
- A PR #52 incrementa 6 specs (~937 linhas) com testes bons (cobrem lógica, bugs e
  riscos de segurança documentados), mas foi escrita contra versões antigas do código:
  - `compras.component.ts` perdeu, após refatorações (incl. PR #68), os métodos
    `formatCategoria`, `calculaValorUnitario`, `formatNomesPagadores`,
    `formatNomesPagadoresRestantes`, `mudarStatusDaCompra`. Sobrevivem
    `tratamentoLista`, `verificaUserRemainingPayers`, `verificarPagamento`.
  - `cadastro.component.ts` foi reescrito pela PR #68: não usa mais a propriedade
    `mensagemErro`; agora reporta erro via `NotificationService.error(...)`. O bug
    do typo `this,this.mensagemErro` que a #52 documentava **já não existe**.
  - `user.service` e os guards (`home.guard`, `login.guard`) estão estáveis →
    portáveis quase diretos.

## Parte A — Suíte de testes verde

Trabalho feito na branch `52-ci-e-testes` (a partir da `master` atual), não por merge
da branch antiga da #52.

1. **Portar da #52 o que mapeia limpo:**
   - `core/auth/user/user.service.spec.ts` — ciclo de token no localStorage,
     `jwtDecode`/`getUser`, e chamadas HTTP (`logar`, `cadastrar`, `getUserById`,
     `getAllUsers`) via `HttpTestingController`. Inclui as notas de risco de segurança.
   - `core/auth/guards/home.guard.spec.ts` e `login.guard.spec.ts`.
   - `core/models/user/user.spec.ts`.
2. **Adaptar o que mudou de API:**
   - `pages/cadastro/cadastro.component.spec.ts` — substituir asserts sobre
     `mensagemErro` por um spy em `NotificationService` (`error`/`success`); manter os
     testes de validação do `cadastroForm` e do `passwordMatchValidator`.
   - `shared/components/compras/compras.component.spec.ts` — manter apenas testes de
     métodos que ainda existem (`tratamentoLista`, `verificaUserRemainingPayers`,
     `verificarPagamento`); **descartar** os testes de métodos removidos. Prover
     `HttpClient`/`MatDialog`/`Router`/`ActivatedRoute` conforme o componente exigir.
3. **Consertar os specs boilerplate que falham hoje** adicionando ao `TestBed` de cada
   um os providers ausentes — primariamente `provideHttpClient()` +
   `provideHttpClientTesting()`, e onde aplicável `MatDialog`, `Router`,
   `ActivatedRoute`, `MatSnackBar`. Alvos conhecidos (NullInjector hoje):
   `AppComponent`, `HomeComponent`, `LogoutComponent`, `CompraService`,
   `TransacaoService`, e os demais da lista de 12.
4. **Bugs reais:** se um teste adaptado expor um bug de aplicação, corrigir o código
   com a mudança mínima e registrar no PR. O typo de `cadastro` já está resolvido na
   `master` — isso será apenas anotado, sem mudança de código.
5. **Critério de pronto (verificável):**
   - `npx ng test --watch=false --browsers=ChromeHeadless` → **0 falhas**.
   - `npx ng build` → sucesso (warning de budget é tolerado).

## Parte B — CI (GitHub Actions)

1. **Suporte a Chrome headless em CI:** adicionar `karma.conf.js` com um custom launcher
   `ChromeHeadlessCI` estendendo `ChromeHeadless` com flags
   `--no-sandbox --headless --disable-gpu --disable-dev-shm-usage`, e referenciá-lo em
   `angular.json` (`projects.*.architect.test.options.karmaConfig`).
2. **Scripts npm:** adicionar
   `"test:ci": "ng test --watch=false --browsers=ChromeHeadlessCI"`.
3. **Workflow `.github/workflows/ci.yml`:**
   - Gatilhos: `pull_request` com `branches: [master]` e `push` em `master` (baseline).
   - Job em `ubuntu-latest` (Chrome já vem instalado):
     `actions/checkout@v4` → `actions/setup-node@v4` (node 22, `cache: npm`) →
     `npm ci` → `npm run build` → `npm run test:ci`.
4. **Branch protection:** tornar o check obrigatório para merge é configuração do
   repositório no GitHub (Settings → Branches), não definível por arquivo. Será
   documentado no PR para o dono (`Wendel-Sampaio`) habilitar.

## Entrega

- Branch `52-ci-e-testes` → PR com `Closes #52`. Sem push direto na `master`
  (conforme `CLAUDE.md`). A PR #52 original fica obsoleta.

## Fora de escopo

- Cobertura ampla de funcionalidades novas ainda sem testes (estatísticas, plan,
  resumo financeiro, etc.) além do mínimo necessário para a suíte ficar verde.
- Mudar de framework de teste (segue Karma/Jasmine padrão do Angular).
- Lint no CI (pode ser adicionado depois).
