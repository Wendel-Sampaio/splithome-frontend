# Redesign da Home — estilo "app verde"

Data: 2026-07-03
Escopo: apenas `pages/home` (sem alterar tokens globais em `styles.scss`).

## Objetivo
Deixar a tela principal com a aparência da imagem de referência: sidebar verde
estreita só com ícones e topbar verde com saudação, sino de notificação e avatar.
A logo do SplitHome (`assets/logo-splithome.png`) substitui o placeholder das "3
setinhas" e, ao ser clicada, alterna recolher/expandir o menu lateral.

## Decisões (confirmadas com o usuário)
- Tema verde aplicado **somente na tela Home** (variáveis locais no SCSS do componente).
- **Todos** os itens de menu atuais são mantidos, cada um como ícone.
- Sino de notificação é **apenas visual** (indicador vermelho, sem back-end).
- Sidebar inicia **expandida**; a logo alterna expandir/recolher.

## Mudanças

### Sidebar (`.menu-lateral`)
- Fundo verde vibrante (`--home-green`, ~`#35ce44`).
- Topo: logo SplitHome clicável (`(click)="alternarMenu()"`), substitui o botão chevron,
  que é removido.
- Remove o bloco de foto de perfil + "Bem-vindo/nome/plano" (migra para a topbar).
- Itens de menu com ícones brancos; item selecionado com "tile" branco arredondado e
  ícone verde.
- "Sair" permanece como ícone no rodapé da sidebar.
- Estado recolhido = só ícones (igual à imagem); expandido = ícone + label branco.

### Topbar (`.topbar`)
- Fundo verde, texto branco.
- Esquerda: título da view (`currentViewTitle`).
- Direita: `Olá, {user.name}` + sino (`notifications`, bolinha vermelha, visual) +
  avatar circular (`profilePhotoUrl`).
- Remove o kicker "SplitHome".

### Conteúdo
- Mantém o dashboard/atalhos atuais; apenas o "frame" (sidebar + topbar) muda.

### TS / testes
- `alternarMenu()` reaproveitado (agora acionado pela logo).
- `user` e `profilePhotoUrl` já existentes alimentam saudação e avatar.
- Atualizar `home.component.spec.ts` se necessário para o novo template.

## Fora de escopo
- Lógica real de notificações.
- Alterar tema global / outras páginas.

---

# Iteração 2 — Overhaul do dashboard (2026-07-03)

Feedback do usuário sobre o primeiro resultado motivou um redesign mais amplo da
tela inicial. Escopo mantido apenas em `pages/home` + novo componente.

## Decisões (confirmadas)
- CTAs "Nova compra"/"Adicionar despesa" abrem o `FormTransacaoComponent` (dialog).
- Busca e contador de notificações são **placeholder visual** (sem back-end).
- Menu do avatar contém apenas **Meu perfil** e **Sair**.
- Implementar **todos** os itens do feedback.

## Novo componente: `DashboardInicioComponent`
`shared/components/dashboard-inicio/`. Carrega dados reais via `forkJoin`
(`estatisticas`, `resumo-financeiro`, `compra`) com `catchError` → estado vazio.
- **KPIs**: Em aberto (`totalOutstanding`), Despesas do mês (`totalMesAtual`),
  Compras (`totalElements`), Maior categoria (`maiorCategoria`).
- **Mini gráfico** de barras (CSS, sem lib) a partir de `totaisPorMes` (últimos 6).
- **Últimas atividades**: merge de compras + despesas, ordenado por data (top 6).
- **Banner** compacto com ilustração SVG e CTAs (abrem dialog).
- **Cards de atalho** clicáveis (emitem `abrirView`) com métrica rápida e hover.
- **Skeleton loading** e **estados vazios**.
- Emite `@Output() abrirView` para o `HomeComponent` trocar a view.

## Mudanças em `HomeComponent`
- **Sidebar**: verde escuro (gradiente) para diferenciar do conteúdo; itens
  **agrupados** (Principal/Financeiro/Família/Conta) com rótulos; item ativo em
  verde vibrante; **divisor + "Sair"** no rodapé.
- **Topbar**: fundo claro (verde só em destaques); **busca** (placeholder), **sino
  com badge** numérico (visual), **avatar → `mat-menu`** (Meu perfil, Sair).
- **Tipografia**: títulos com peso reduzido; textos secundários com mais contraste.
- **Cor secundária**: âmbar/azul/violeta para KPIs e status (tokens locais).
- **Responsivo**: KPIs/atalhos 4→2→1 colunas; gráfico/atividades empilham; busca
  some no mobile; menu recolhível pela logo.
- Conteúdo `inicio` passa a renderizar `<app-dashboard-inicio>`.
