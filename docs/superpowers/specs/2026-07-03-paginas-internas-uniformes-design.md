# Padrão de página unificado — telas internas (verde sóbrio)

Data: 2026-07-03
Escopo: as 7 telas internas do app, **exceto** `Início` (home).

## Objetivo
Deixar as telas internas visualmente irmãs entre si e alinhadas à identidade
verde do app, hoje presente só na home. Cada tela tem estrutura de cabeçalho,
cards, tabelas e estados (vazio/carregando/erro) diferentes. O objetivo é
padronizar tudo com uma **fonte única de verdade** de classes utilitárias
globais, mantendo o SCSS de cada componente fino.

## Telas afetadas
- Compras — `src/app/shared/components/compras/`
- Despesas — `src/app/shared/components/despesas/`
- Gráficos (Estatísticas) — `src/app/pages/estatisticas/`
- Resumo financeiro — `src/app/pages/resumo-financeiro/`
- Família — `src/app/pages/familia/`
- Recados — `src/app/pages/recados/`
- Meu perfil — `src/app/shared/components/meu-perfil/`

Fora de escopo: `pages/home` (Início), `login`, `cadastro`.

## Decisões (confirmadas com o usuário)
- **Identidade: verde sóbrio.** Usar o verde primário que já existe no design
  system (`--sh-color-primary` = `#2f9e44`) em botões, ícones, títulos e um
  filete de accent. Fundos neutros/brancos e cards leves. **Não** usar o verde
  vibrante da home (`#35ce44`) nas telas internas.
- **Fonte única de verdade:** classes utilitárias globais em `src/styles.scss`
  (sem view-encapsulation), reutilizadas por todas as telas.
- **Não alterar** as variáveis de cor globais existentes; apenas adicionar
  classes utilitárias.
- Páginas roteadas (Família, Recados) mantêm o botão **Voltar**, porém dentro do
  slot de ações padronizado do cabeçalho.

## Sistema compartilhado (novas classes globais em `styles.scss`)

Prefixo `sh-` (mesmo dos tokens existentes).

- `.sh-page` — container: `max-width`, padding e `gap` verticais padronizados.
- `.sh-page-header` — cabeçalho flex: título à esquerda, `.sh-page-actions` à
  direita; borda inferior neutra + filete verde de 3px (`--sh-color-primary`).
- `.sh-page-title` — título único (mesmo tamanho/peso em todas as telas).
- `.sh-page-subtitle` — subtítulo curto, `--sh-color-text-muted`.
- `.sh-page-actions` — slot flex para botões de ação (inclui Voltar).
- `.sh-panel` — superfície/card: `--sh-color-surface`, `--sh-color-border`,
  `--sh-radius-lg`, `--sh-shadow-sm`, padding via `--sh-space-*`.
- `.sh-stat-card` — card de KPI (rótulo pequeno + valor forte); unifica
  `.resumo-card` de estatísticas e resumo financeiro.
- `.sh-empty` — estado vazio (texto centralizado, `--sh-color-text-subtle`).
- `.sh-status` — estado de carregando/erro (variante `.is-error` em vermelho
  `--sh-color-danger`).
- `.sh-btn-primary` (opcional) — botão de ação verde consistente, ou uso de
  `color="primary"` do Material já resolvido para verde onde aplicável.
- `.sh-data-table` — wrapper de tabela (Compras/Despesas): header neutro,
  divisórias suaves, linha "paga" com `--sh-color-primary-soft`, botões de ação.

## Estrutura de cabeçalho unificada (todas as telas)

```html
<header class="sh-page-header">
  <div>
    <h1 class="sh-page-title">Título</h1>
    <p class="sh-page-subtitle">Subtítulo curto.</p>
  </div>
  <div class="sh-page-actions">
    <!-- botões (ex.: Voltar, Nova compra, Filtrar) -->
  </div>
</header>
```

- Um só nível de título visual em todas (o elemento pode ser `h1`/`h2` conforme
  semântica, mas o estilo é o mesmo via `.sh-page-title`).

## Mudanças por tela

| Tela | Mudança principal |
|---|---|
| Compras | `.card-body` → `.sh-page-header`; ação `Nova compra` no slot; filtros mantidos; tabela via `.sh-data-table`; botões verdes. |
| Despesas | idem Compras; ações `Importar OFX` + `Nova despesa` no slot; tabela `.sh-data-table`. |
| Gráficos (Estatísticas) | `header`/`.resumo-card`/`.grafico-card` → classes compartilhadas; form de período no slot de ações; `.vazio` → `.sh-empty`. |
| Resumo financeiro | `header`/`.resumo-card`/`.bloco` → compartilhadas; `.mensagem-status`/`.vazio` → `.sh-status`/`.sh-empty`. |
| Família | envolver em `.sh-page` + `.sh-page-header`; `Voltar` no slot; blocos → `.sh-panel`; `.status`/`.erro` → `.sh-status`. |
| Recados | `header` → `.sh-page-header` com `Voltar` no slot; cards → `.sh-panel`; `.lista-vazia` → `.sh-empty`. |
| Meu perfil | adicionar `.sh-page-header` ("Meu perfil"); card → `.sh-panel`; manter form/foto. |

## Aplicação do verde (sóbrio)
- Botões primários (`Nova compra`, `Nova despesa`, `Filtrar`, `Publicar`,
  `Salvar`, `Criar família`, etc.): verde primário.
- Filete do cabeçalho, ícones de destaque e foco: verde primário.
- Tabelas: header **neutro**; linha "paga" com `--sh-color-primary-soft`.
- Sem faixas/headers totalmente verdes (isso seria a variante "vibrante",
  descartada).

## Testes
- Atualizar os `.spec.ts` das telas cujo template/seletor mudar
  (cabeçalhos, classes, textos de estado).
- Rodar `npm test` e garantir verde.

## Fora de escopo
- Home (Início), login, cadastro.
- Lógica de back-end / dados.
- Alterar variáveis de cor globais existentes (só adicionar utilitários).
- Retema global do Angular Material.
