# Padrão de página unificado (telas internas) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar as 7 telas internas (Compras, Despesas, Gráficos, Resumo financeiro, Família, Recados, Meu perfil) visualmente uniformes entre si, com identidade verde sóbria, via classes utilitárias globais.

**Architecture:** Adicionar um conjunto de classes utilitárias globais em `src/styles.scss` (cabeçalho de página, painéis, cards de KPI, estados, tabela de dados) e refatorar cada tela para consumi-las, removendo o SCSS duplicado. Cor verde a partir dos tokens `--sh-color-primary*` já existentes. Nenhuma mudança em back-end, dados ou nos valores dos tokens globais.

> **Correção pós-Task 4 (design system pré-existente):** `src/styles.scss` já continha classes `.sh-page-title`, `.sh-page-subtitle`, `.sh-card`, `.sh-empty-state`, `.sh-status`, `.sh-status-error` (sem consumidores ainda). Reutilizamos essas classes existentes em vez de duplicá-las. Convenções canônicas: estado vazio = `.sh-empty-state`; estado de erro = `.sh-status-error` (não `.sh-status is-error`); loading = `.sh-status`. As classes **novas** que Task 1 realmente adiciona são só as estruturais: `.sh-page`, `.sh-page-header` (+`::after`), `.sh-page-actions`, `.sh-panel`, `.sh-stat-card`, `.sh-btn-primary`, `.sh-data-table`.

**Tech Stack:** Angular 19 (Standalone), Angular Material 19, SCSS, Jasmine/Karma.

## Global Constraints

- Não alterar a tela `Início` (`pages/home`), nem `login`/`cadastro`.
- Identidade **verde sóbrio**: usar `--sh-color-primary` (`#2f9e44`) e derivados; **não** usar o verde vibrante da home (`#35ce44`).
- Não alterar as variáveis de cor globais existentes; apenas **adicionar** classes utilitárias em `styles.scss`.
- Componentes sempre Standalone; TypeScript strict (sem `any` sem justificativa).
- Um só nível de título visual em todas as telas (via `.sh-page-title`).
- Após cada tarefa: o `.spec.ts` do componente alterado deve passar e `npm run build` deve compilar.
- Commits em Conventional Commits; branch atual `home-redesign-verde` (não commitar em `master`).

**Comando de teste padrão (todas as tarefas):**
`npm test -- --watch=false --browsers=ChromeHeadless`
`npm run build`

---

### Task 1: Classes utilitárias globais

**Files:**
- Modify: `src/styles.scss` (anexar ao final, após `.snack-warning`)

**Interfaces:**
- Produces (classes globais consumidas pelas demais tasks):
  `.sh-page`, `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`,
  `.sh-page-actions`, `.sh-panel`, `.sh-stat-card`, `.sh-empty`,
  `.sh-status` (+ `.is-error`), `.sh-btn-primary`, `.sh-data-table`.

- [ ] **Step 1: Anexar as classes ao final de `src/styles.scss`**

```scss

/* ===== Padrão de página compartilhado — telas internas ===== */
.sh-page {
  display: flex;
  flex-direction: column;
  gap: var(--sh-space-6);
  margin: 0 auto;
  max-width: 1200px;
  padding: var(--sh-space-6);
  width: 100%;
}

.sh-page-header {
  align-items: flex-end;
  border-bottom: 1px solid var(--sh-color-border);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sh-space-4);
  justify-content: space-between;
  padding-bottom: var(--sh-space-4);
  position: relative;
}

.sh-page-header::after {
  background: var(--sh-color-primary);
  border-radius: 3px;
  bottom: -1px;
  content: "";
  height: 3px;
  left: 0;
  position: absolute;
  width: 64px;
}

.sh-page-title {
  color: var(--sh-color-text);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.sh-page-subtitle {
  color: var(--sh-color-text-muted);
  font-size: 0.95rem;
  margin: 4px 0 0;
}

.sh-page-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sh-space-3);
}

.sh-panel {
  background: var(--sh-color-surface);
  border: 1px solid var(--sh-color-border);
  border-radius: var(--sh-radius-lg);
  box-shadow: var(--sh-shadow-sm);
  padding: var(--sh-space-6);
}

.sh-stat-card {
  background: var(--sh-color-surface);
  border: 1px solid var(--sh-color-border);
  border-radius: var(--sh-radius-lg);
  box-shadow: var(--sh-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--sh-space-5);

  > span,
  > small {
    color: var(--sh-color-text-muted);
    font-size: 0.85rem;
  }

  > strong {
    color: var(--sh-color-text);
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.sh-empty {
  color: var(--sh-color-text-subtle);
  padding: var(--sh-space-8) var(--sh-space-4);
  text-align: center;
}

.sh-status {
  color: var(--sh-color-text-muted);
  padding: var(--sh-space-6) 0;
  text-align: center;

  &.is-error {
    color: var(--sh-color-danger);
  }
}

.sh-btn-primary {
  align-items: center;
  background: var(--sh-color-primary);
  border: none;
  border-radius: var(--sh-radius-md);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  font-weight: 600;
  gap: 6px;
  padding: 10px 18px;

  &:hover:not(:disabled) {
    background: var(--sh-color-primary-strong);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

.sh-data-table {
  background: var(--sh-color-surface);
  border: 1px solid var(--sh-color-border);
  border-radius: var(--sh-radius-lg);
  box-shadow: var(--sh-shadow-sm);
  overflow-x: auto;

  table {
    width: 100%;
  }

  .mat-mdc-header-row {
    background: var(--sh-color-surface-alt);
  }

  .mat-mdc-header-cell {
    color: var(--sh-color-text-muted);
    font-weight: 600;
  }

  .mat-mdc-row:hover {
    background: var(--sh-color-bg-strong);
  }

  .payed-style {
    background: var(--sh-color-primary-soft);
  }
}
```

- [ ] **Step 2: Build para validar SCSS**

Run: `npm run build`
Expected: build conclui sem erro de SCSS.

- [ ] **Step 3: Commit**

```bash
git add src/styles.scss
git commit -m "feat: add classes utilitárias de página compartilhada"
```

---

### Task 2: Compras

**Files:**
- Modify: `src/app/shared/components/compras/compras.component.html`
- Modify: `src/app/shared/components/compras/compras.component.scss`
- Test: `src/app/shared/components/compras/compras.component.spec.ts`

**Interfaces:**
- Consumes: `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-page-actions`, `.sh-btn-primary`, `.sh-data-table` (Task 1).

- [ ] **Step 1: Substituir o `.card-body` pelo cabeçalho padrão no HTML**

Trocar o bloco inicial:

```html
<div class="card-body">
    <mat-card-title class="titulo-menu-compras">Compras</mat-card-title>
    <button mat-button class="cadastrar-compra" mat-button (click)="abrirFormCompra()"><mat-icon>add_circle</mat-icon>Nova compra</button>
</div>
```

por:

```html
<header class="sh-page-header">
    <div>
        <h1 class="sh-page-title">Compras</h1>
        <p class="sh-page-subtitle">Gerencie as compras compartilhadas da casa.</p>
    </div>
    <div class="sh-page-actions">
        <button class="sh-btn-primary" type="button" (click)="abrirFormCompra()">
            <mat-icon>add_circle</mat-icon>Nova compra
        </button>
    </div>
</header>
```

- [ ] **Step 2: Envolver o container da tabela com `sh-data-table`**

Localizar `<div class="table" *ngIf="compras$ | async as compras">` e adicionar a classe: `<div class="table sh-data-table" *ngIf="compras$ | async as compras">`.

- [ ] **Step 3: Limpar o SCSS do cabeçalho antigo**

Em `compras.component.scss`, remover as regras `.card-body`, `.titulo-menu-compras` e `.cadastrar-compra` (agora cobertas pelas classes globais). Manter as regras de filtros, `payment-button`, `edit-buttom`, `remove-buttom`, `payed-style-last-*` e loading. Se `.column-name`/header já era estilizado localmente, mantê-lo — a classe global só adiciona fundo/cor de header.

- [ ] **Step 4: Rodar o spec do componente**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/compras.component.spec.ts'`
Expected: PASS. Se falhar por buscar o texto/seletor antigo (`.titulo-menu-compras` ou `.cadastrar-compra`), atualizar o spec para `.sh-page-title`/`.sh-btn-primary`.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/compras
git commit -m "style: padronizar cabeçalho e tabela da tela Compras"
```

---

### Task 3: Despesas

**Files:**
- Modify: `src/app/shared/components/despesas/despesas.component.html`
- Modify: `src/app/shared/components/despesas/despesas.component.scss`
- Test: `src/app/shared/components/despesas/despesas.component.spec.ts`

**Interfaces:**
- Consumes: `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-page-actions`, `.sh-btn-primary`, `.sh-data-table` (Task 1).

- [ ] **Step 1: Substituir o `.card-body` no HTML**

Trocar:

```html
<div class="card-body">
    <mat-card-title class="titulo-menu-despesas">Despesas</mat-card-title>
    <button mat-button class="importar-ofx" (click)="ofxInput.click()" [disabled]="loadingAcao()">
        <mat-icon>upload_file</mat-icon>Importar OFX
    </button>
    <input #ofxInput type="file" accept=".ofx" hidden (change)="importarOfx($event)">
    <button mat-button class="cadastrar-despesa" (click)="abrirFormDespesa()">
        <mat-icon>add_circle</mat-icon>Nova despesa
    </button>
</div>
```

por:

```html
<header class="sh-page-header">
    <div>
        <h1 class="sh-page-title">Despesas</h1>
        <p class="sh-page-subtitle">Acompanhe e divida as despesas da família.</p>
    </div>
    <div class="sh-page-actions">
        <input #ofxInput type="file" accept=".ofx" hidden (change)="importarOfx($event)">
        <button class="sh-btn-primary" type="button" (click)="ofxInput.click()" [disabled]="loadingAcao()">
            <mat-icon>upload_file</mat-icon>Importar OFX
        </button>
        <button class="sh-btn-primary" type="button" (click)="abrirFormDespesa()">
            <mat-icon>add_circle</mat-icon>Nova despesa
        </button>
    </div>
</header>
```

- [ ] **Step 2: Envolver a tabela com `sh-data-table`**

Trocar `<div class="table" *ngIf="despesas$ | async as despesas">` por `<div class="table sh-data-table" *ngIf="despesas$ | async as despesas">`.

- [ ] **Step 3: Limpar o SCSS antigo**

Remover `.card-body`, `.titulo-menu-despesas`, `.importar-ofx`, `.cadastrar-despesa`. Manter `payment-button`, `remove-buttom`, `payed-style-last-*`, loading.

- [ ] **Step 4: Rodar o spec**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/despesas.component.spec.ts'`
Expected: PASS (ajustar seletores antigos no spec se necessário).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/despesas
git commit -m "style: padronizar cabeçalho e tabela da tela Despesas"
```

---

### Task 4: Gráficos (Estatísticas)

**Files:**
- Modify: `src/app/pages/estatisticas/estatisticas.component.html`
- Modify: `src/app/pages/estatisticas/estatisticas.component.scss`
- Test: `src/app/pages/estatisticas/estatisticas.component.spec.ts`

**Interfaces:**
- Consumes: `.sh-page`, `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-page-actions`, `.sh-stat-card`, `.sh-panel`, `.sh-empty`, `.sh-status` (Task 1).

- [ ] **Step 1: Ajustar cabeçalho e classes no HTML**

- Trocar `<section class="estatisticas">` por `<section class="estatisticas sh-page">`.
- Trocar `<header class="estatisticas-header">` por `<header class="sh-page-header">`.
- Dentro do header, envolver o `<h2>`/`<p>` como título/subtítulo:

```html
<div>
  <h2 class="sh-page-title">Estat&iacute;sticas</h2>
  <p class="sh-page-subtitle">Resumo dos seus gastos por categoria e por m&ecirc;s.</p>
</div>
```

- Envolver o `<form class="periodo-form" ...>` num `<div class="sh-page-actions">…</div>` (o form fica dentro do slot de ações).
- Trocar `<article class="resumo-card">` por `<article class="resumo-card sh-stat-card">` (2 ocorrências).
- Trocar `<section class="grafico-card">` por `<section class="grafico-card sh-panel">` (2 ocorrências).
- Trocar `<div class="mensagem-status" *ngIf="loading()">` por `<div class="sh-status" *ngIf="loading()">`.
- Trocar `<p class="vazio">…</p>` por `<p class="sh-empty-state">…</p>` (2 ocorrências).

- [ ] **Step 2: Limpar SCSS redundante**

Em `estatisticas.component.scss` remover as regras `.estatisticas-header` (layout agora vem de `.sh-page-header`), `.resumo-card`, `.mensagem-status`, `.vazio` e o padding/gap externos duplicados de `.estatisticas`. Manter regras específicas: `.pizza`, `.pizza-layout`, `.legenda*`, `.barras`, `.barra*`, `.grafico-titulo`, `.periodo-form`, `.periodo-acoes`.

- [ ] **Step 3: Rodar o spec**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/estatisticas.component.spec.ts'`
Expected: PASS (ajustar seletores antigos se o spec os referenciar).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/pages/estatisticas
git commit -m "style: padronizar tela Gráficos com o layout de página compartilhado"
```

---

### Task 5: Resumo financeiro

**Files:**
- Modify: `src/app/pages/resumo-financeiro/resumo-financeiro.component.html`
- Modify: `src/app/pages/resumo-financeiro/resumo-financeiro.component.scss`
- (Sem `.spec.ts` — validar por build.)

**Interfaces:**
- Consumes: `.sh-page`, `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-page-actions`, `.sh-stat-card`, `.sh-panel`, `.sh-empty`, `.sh-status` (Task 1).

- [ ] **Step 1: Ajustar HTML**

- Trocar `<section class="resumo-financeiro">` por `<section class="resumo-financeiro sh-page">`.
- Trocar `<header class="resumo-header">` por `<header class="sh-page-header">`.
- Título/subtítulo:

```html
<div>
  <h2 class="sh-page-title">Resumo financeiro</h2>
  <p class="sh-page-subtitle">Veja quem deve para quem e a melhor sequ&ecirc;ncia para quitar os saldos.</p>
</div>
```

- Envolver o `<form class="periodo-form" ...>` em `<div class="sh-page-actions">…</div>`.
- Trocar `<article class="resumo-card">` por `<article class="resumo-card sh-stat-card">` (2 ocorrências).
- Trocar `<section class="bloco">` por `<section class="bloco sh-panel">` (3 ocorrências).
- Trocar `<div class="mensagem-status" *ngIf="carregando">` por `<div class="sh-status" *ngIf="carregando">`.
- Trocar `<div class="mensagem-status erro" *ngIf="erro">` por `<div class="sh-status-error" *ngIf="erro">`.
- Trocar `<p class="vazio">…</p>` por `<p class="sh-empty-state">…</p>` (3 ocorrências).

- [ ] **Step 2: Limpar SCSS redundante**

Remover `.resumo-header`, `.resumo-card`, `.mensagem-status`, `.vazio`, e paddings externos duplicados de `.resumo-financeiro`. Manter `.saldos-grid`, `.saldo-item` (+ variantes de saldo positivo/negativo), `.lista`, `.linha`, `.periodo-form`, `.periodo-acoes`, `.cards-resumo`.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/resumo-financeiro
git commit -m "style: padronizar tela Resumo financeiro com o layout compartilhado"
```

---

### Task 6: Família

**Files:**
- Modify: `src/app/pages/familia/familia.component.html`
- Modify: `src/app/pages/familia/familia.component.scss`
- (Sem `.spec.ts` — validar por build.)

**Interfaces:**
- Consumes: `.sh-page`, `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-page-actions`, `.sh-panel`, `.sh-status` (Task 1).

Observação: hoje a Família envolve tudo num único `mat-card`. Vamos trocar por
`.sh-page` + `.sh-page-header` (com o `Voltar` no slot de ações) e blocos internos
em `.sh-panel`, para ficar igual às demais.

- [ ] **Step 1: Reestruturar o topo do HTML**

Trocar:

```html
<section class="familia-page">
  <mat-card class="familia-card" appearance="outlined">
    <mat-card-content>
      <div class="top-actions">
        <button mat-stroked-button color="primary" type="button" (click)="voltarParaHome()">
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          Voltar para o início
        </button>
      </div>
```

por:

```html
<section class="familia-page sh-page">
  <header class="sh-page-header">
    <div>
      <h1 class="sh-page-title">Família</h1>
      <p class="sh-page-subtitle">Crie ou gerencie sua família premium no SplitHome.</p>
    </div>
    <div class="sh-page-actions">
      <button mat-stroked-button color="primary" type="button" (click)="voltarParaHome()">
        <mat-icon aria-hidden="true">arrow_back</mat-icon>
        Voltar
      </button>
    </div>
  </header>

  <div class="familia-conteudo">
```

- [ ] **Step 2: Fechar a nova estrutura no fim do HTML**

Ao final do arquivo, trocar o fechamento:

```html
      @if (mensagemErro) {
        <p class="erro">{{ mensagemErro }}</p>
      }
    </mat-card-content>
  </mat-card>
</section>
```

por:

```html
      @if (mensagemErro) {
        <p class="sh-status-error">{{ mensagemErro }}</p>
      }
  </div>
</section>
```

(Removemos o `mat-card`/`mat-card-content` externos; o `<div class="familia-conteudo">` aberto no Step 1 é fechado aqui.)

- [ ] **Step 3: Ajustar blocos internos**

- Os dois blocos de conteúdo (`@if (!isPremiumWithFamily)` e `@else`) já usam `.header`, `.benefits`, `.actions`, `.join-box`, `.family-code`, `.members`. Envolver os agrupamentos visuais em `.sh-panel` onde faziam papel de card: adicionar `sh-panel` a `.family-code` e a `.members`.
- Remover os `<div class="header">` internos redundantes de título (já temos o cabeçalho de página); manter apenas o conteúdo (benefícios/código/membros). Se preferir manter o `h1` de nome da família no modo premium, rebaixá-lo para `<h2 class="sh-page-title">` dentro do `.members`/`.family-code`.
- Trocar `<p class="status">…</p>` por `<p class="sh-status">…</p>`.

- [ ] **Step 4: Limpar SCSS**

Remover `.familia-card`, `.top-actions`, `.status`, `.erro`, e estilos de `.header` que dupliquem o cabeçalho de página. Manter `.benefits`, `.benefit-item`, `.actions`, `.join-box`, `.family-code`, `.code-actions`, `.members`. Adicionar `.familia-conteudo { display: flex; flex-direction: column; gap: var(--sh-space-6); }`.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/familia
git commit -m "style: padronizar tela Família com o layout de página compartilhado"
```

---

### Task 7: Recados

**Files:**
- Modify: `src/app/pages/recados/recados.component.html`
- Modify: `src/app/pages/recados/recados.component.scss`
- Test: `src/app/pages/recados/recados.component.spec.ts`

**Interfaces:**
- Consumes: `.sh-page`, `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-page-actions`, `.sh-panel`, `.sh-empty` (Task 1).

- [ ] **Step 1: Ajustar cabeçalho no HTML**

- Trocar `<section class="recados-page">` por `<section class="recados-page sh-page">`.
- Trocar:

```html
<header class="recados-header">
  <div>
    <h1>Recados da família</h1>
    <p>Compartilhe avisos rápidos com todos da casa.</p>
  </div>

  <button mat-stroked-button type="button" (click)="voltarParaHome()">
    <mat-icon>arrow_back</mat-icon>
    Voltar
  </button>
</header>
```

por:

```html
<header class="sh-page-header">
  <div>
    <h1 class="sh-page-title">Recados</h1>
    <p class="sh-page-subtitle">Compartilhe avisos rápidos com todos da casa.</p>
  </div>
  <div class="sh-page-actions">
    <button mat-stroked-button color="primary" type="button" (click)="voltarParaHome()">
      <mat-icon>arrow_back</mat-icon>
      Voltar
    </button>
  </div>
</header>
```

- [ ] **Step 2: Padronizar cards e vazio**

- Trocar `<mat-card class="novo-recado-card" appearance="outlined">` por `<mat-card class="novo-recado-card sh-panel" appearance="outlined">`.
- Trocar `<mat-card class="recado-item" appearance="outlined" *ngFor="let recado of recados">` por `<mat-card class="recado-item sh-panel" appearance="outlined" *ngFor="let recado of recados">`.
- Trocar `<div class="lista-vazia" *ngIf="!recados.length">` por `<div class="sh-empty-state" *ngIf="!recados.length">`.
- No título da lista, trocar `<h2>Últimos recados</h2>` por `<h2 class="sh-page-title">Últimos recados</h2>`.

- [ ] **Step 3: Limpar SCSS**

Remover `.recados-header`, `.lista-vazia`, e paddings externos duplicados de `.recados-page`. Manter `.recado-form`, `.field-full`, `.form-actions`, `.recado-conteudo`, `.recado-meta`, `.recados-lista`.

- [ ] **Step 4: Rodar o spec**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/recados.component.spec.ts'`
Expected: PASS (ajustar seletores/textos antigos se referenciados — ex.: "Recados da família").

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/pages/recados
git commit -m "style: padronizar tela Recados com o layout de página compartilhado"
```

---

### Task 8: Meu perfil

**Files:**
- Modify: `src/app/shared/components/meu-perfil/meu-perfil.component.html`
- Modify: `src/app/shared/components/meu-perfil/meu-perfil.component.scss`
- Test: `src/app/shared/components/meu-perfil/meu-perfil.component.spec.ts`

**Interfaces:**
- Consumes: `.sh-page`, `.sh-page-header`, `.sh-page-title`, `.sh-page-subtitle`, `.sh-panel` (Task 1).

- [ ] **Step 1: Adicionar cabeçalho de página e envolver o card**

Trocar o início:

```html
<mat-card id="meu-perfil-card" appearance="outlined">
    <mat-card-header>
        <mat-card-title id="title">Suas informações</mat-card-title>
    </mat-card-header>
    <mat-card-content>
```

por:

```html
<section class="meu-perfil-page sh-page">
    <header class="sh-page-header">
        <div>
            <h1 class="sh-page-title">Meu perfil</h1>
            <p class="sh-page-subtitle">Suas informações pessoais e dados de pagamento.</p>
        </div>
    </header>

    <mat-card id="meu-perfil-card" class="sh-panel" appearance="outlined">
        <mat-card-content>
```

- [ ] **Step 2: Fechar a nova `<section>` no fim do HTML**

Ao final do arquivo, após o `</mat-card>` existente, adicionar `</section>`. Ajustar a indentação do bloco intermediário conforme necessário (o conteúdo interno — inputs, foto, `#caixa-botao` — permanece igual).

- [ ] **Step 3: Limpar SCSS**

Em `meu-perfil.component.scss`, remover a regra `#meu-perfil-card` que definia borda/sombra/fundo (agora vem de `.sh-panel`) e `#title` (não há mais). Manter `#conteudo-card`, `#inputs-container`, `#foto-*`, `#caixa-botao`, `.family-code`, botões. Adicionar `.meu-perfil-page { … }` só se precisar de ajuste de largura do card.

- [ ] **Step 4: Rodar o spec**

Run: `npm test -- --watch=false --browsers=ChromeHeadless --include='**/meu-perfil.component.spec.ts'`
Expected: PASS (se o spec buscava `#title` com texto "Suas informações", ajustar para `.sh-page-title`/"Meu perfil").

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/shared/components/meu-perfil
git commit -m "style: padronizar tela Meu perfil com o layout de página compartilhado"
```

---

### Task 9: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Suíte completa de testes**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: todos os specs PASS.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: PASS, sem estouro de budget de CSS.

- [ ] **Step 3: Revisão visual manual**

`npm start`, abrir cada tela pelo menu lateral (Compras, Despesas, Gráficos, Resumo financeiro, Família, Recados, Meu perfil) e confirmar: cabeçalhos idênticos com filete verde, cards uniformes, botões primários verdes, estados vazio/erro consistentes. `Início` inalterada.

- [ ] **Step 4: Commit de ajustes (se houver)**

```bash
git add -A
git commit -m "style: ajustes finais de uniformização das telas internas"
```

## Notas
- `resumo-financeiro` e `familia` não possuem `.spec.ts`; não criamos novos specs (fora de escopo) — validação por build + revisão visual.
- Se algum spec existente quebrar por asserção em seletor/texto antigo, o ajuste do spec faz parte da mesma task.
