# Design system

Referência visual para manter consistência (inspirado em retail escandinavo / RugVista).

## Tokens (`src/styles/global.css`)

### Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#faf9f7` | Fundo da **página** (não alterar sem pedido explícito) |
| `--color-surface` | `#ffffff` | Cards, header, secções claras |
| `--color-ink` | `#222d3c` | Texto principal, botões outline hover fill, footer bg |
| `--color-muted` | `#6b6b6b` | Texto secundário |
| `--color-border` | `#e8e6e3` | Divisores, inputs |
| `--color-accent` | `#232e3f` | Top bar, logo mark, CTAs accent, badges “new” |
| `--color-accent-hover` | `#1a2330` | Hover em `.btn--accent` e `.btn` default |
| `--color-sale` | `#b33a3a` | Badge promoção |
| `--color-star` | `#c9a227` | Estrelas rating |

**Regra:** alterações de marca → só `:root` em `global.css` + `public/favicon.svg` (`#232e3f`).

### Tipografia

| Token | Fonte |
|-------|-------|
| `--font-sans` | DM Sans |
| `--font-display` | Cormorant Garamond |

Carregadas em `BaseLayout.astro` (Google Fonts).

Títulos de secção / produtos: `font-family: var(--font-display)`.

Nav, botões, UI: sans, frequentemente `uppercase` + `letter-spacing`.

### Layout

| Token | Valor |
|-------|-------|
| `--max-width` | `90rem` |
| `--header-height` | `4.25rem` |
| `--radius` | `2px` (quase recto) |

Classe utilitária: `.container` → `width: min(100% - 2rem, var(--max-width))`.

## Componentes UI

### Botões (`.btn`)

| Classe | Estilo |
|--------|--------|
| `.btn` | Fundo `--color-ink`, texto branco |
| `.btn--outline` | Borda ink, hover preenche |
| `.btn--accent` | Fundo `--color-accent` |

### Badges

| Classe | Cor |
|--------|-----|
| `.badge--sale` | `--color-sale` |
| `.badge--new` | `--color-accent` (também bestseller no card) |

### Grids

- Listagem: 3 colunas desktop → 2 tablet → 1 mobile
- Homepage produtos: 4 → 2 → 1
- Categorias: 4 colunas

## Componentes Astro

Estilos **scoped** em cada `.astro` (`<style>` no ficheiro).  
Padrão: BEM-like (`product-card__title`, `header__logo`).

Ao criar componente novo:

1. Reutilizar variáveis CSS globais
2. Evitar cores hardcoded (exceto footer `#333` borders, newsletter dark inputs)
3. Manter `aspect-ratio: 4/5` em imagens de produto

## Imagens de produto

- Fundo placeholder: `#f0eeeb`
- Hover card: `scale(1.03)` na imagem
- Overlay categorias: gradiente escuro + texto branco

## Acessibilidade

- `.sr-only` para labels de formulário
- `aria-label` em ícones (header, estrelas, breadcrumb)
- Botão menu mobile: `aria-label` via `t.aria.*`

## Responsivo

Breakpoints usados:

- `1024px` — nav desktop → hamburger; grids 2 col
- `900px` — PDP single column
- `768px` — footer 2 col; cart layout
- `640px` — trust bar esconde 2 últimos itens
- `480px` — grids 1 col

## Não introduzir sem discussão

- Tailwind / CSS-in-JS
- Biblioteca de componentes externa
- Mudança de fontes sem atualizar `BaseLayout`
