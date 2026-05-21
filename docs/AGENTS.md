# Guia para assistentes de IA

Instruções para manter e evoluir **Womni Rugs** sem regressões.

## Resumo do projeto

- Loja de tapetes em **Astro 6.3** + **Cloudflare Workers** + **D1**
- UI em **português (`pt`)**; i18n preparado para mais idiomas
- Inspiração UX: RugVista (catálogo com filtros, PDP, carrinho client-side)
- Marca: **Womni Rugs**

## Antes de alterar código

1. Ler o doc relevante em `docs/` (tabela em [README.md](./README.md))
2. Preferir **diffs mínimos** — não refatorar sem pedido
3. Manter convenções existentes (CSS variables, chaves de produto em inglês, labels em PT via i18n)
4. Após mudanças em dados: `npm run db:generate-seed` → `npm run db:migrate:local`
5. Validar: `npm run build`

## Mapa de ficheiros críticos

```
astro.config.mjs          # Adapter Cloudflare, i18n, imagens
wrangler.jsonc            # Binding DB, deploy
migrations/               # Schema + seed D1 (não editar 0002 à mão — regenerar)
scripts/generate-seed.mjs # Gera 0002_seed.sql a partir de TS

src/
  env.d.ts                # Tipos Env.DB
  lib/db/bindings.ts      # getDatabase() via cloudflare:workers env
  lib/db/products.ts      # Queries D1
  i18n/pt.ts              # Todos os textos UI + products.{slug}
  i18n/index.ts           # useTranslations, getLocalizedProducts (D1 + fallback)
  data/products.ts        # Catálogo estático (fallback + fonte do seed)
  data/types.ts           # MaterialKey, RoomKey, ProductBase, Product
  data/navigation.ts      # Nav/footer (chaves i18n, não labels)
  pages/
    index.astro           # SSR, prerender=false
    c/rugs/index.astro    # SSR + filtros client-side
    product/[slug].astro  # SSR dinâmico (sem getStaticPaths)
    cart.astro            # prerender=true (estático)
    api/products/         # REST Worker endpoints
  layouts/BaseLayout.astro
  components/             # Header, Footer, ProductCard, FilterSidebar, …
  styles/global.css       # Design tokens
```

## Regras que não devem ser quebradas

| Regra | Motivo |
|-------|--------|
| Binding D1 = `DB` | `wrangler.jsonc` + `getDatabase()` |
| Filtros usam **chaves** (`living-room`, `wool`) | URLs e checkboxes estáveis entre idiomas |
| Textos visíveis via `useTranslations()` / `t.*` | Único locale ativo: `pt` |
| Cópia de produto em `pt.ts` **e** D1 `product_translations` | SSR lê D1; seed vem de `pt.ts` |
| Carrinho = `localStorage` key `womni-cart` | Sem backend de checkout |
| Não usar `output: 'hybrid'` | Removido no Astro 6; usar `prerender` por página |
| Cores de marca em `global.css` `:root` | Ver [design-system.md](./design-system.md) |

## Tarefas comuns — checklist

### Novo tapete

1. [products.md](./products.md) — passos completos
2. `npm run db:generate-seed && npm run db:migrate:local`

### Novo texto UI (botão, título, footer)

1. Adicionar chave em `src/i18n/types.ts` (`UiDictionary`)
2. Valor em `src/i18n/pt.ts`
3. Usar `t.novaChave` no componente/página

### Novo idioma (ex.: `en`)

1. [i18n.md](./i18n.md)
2. Migração SQL ou seed com `product_translations` para `locale='en'`

### Nova rota API

1. `src/pages/api/...` com `export const prerender = false`
2. `getDatabase(Astro.locals)` ou equivalente em `APIRoute`
3. Documentar em [pages-and-routing.md](./pages-and-routing.md)

### Alterar cores

1. Apenas `src/styles/global.css` e `public/favicon.svg` se necessário
2. [design-system.md](./design-system.md)

### Deploy produção

1. [cloudflare-deploy.md](./cloudflare-deploy.md)

## Comandos úteis

```bash
npm run dev                 # Dev + D1 local (platformProxy)
npm run build               # Build Cloudflare
npm run db:migrate:local    # Aplicar migrações localmente
npm run db:generate-seed    # Regenerar seed SQL
npm run deploy              # Build + wrangler deploy
```

## O que evitar

- Commitar `.wrangler/`, `.env`, `database_id` de produção sem necessidade
- Hardcodar strings em inglês na UI (usar `pt.ts`)
- Editar `migrations/0002_seed.sql` manualmente (regenerar)
- `getStaticPaths` em `[slug].astro` (produtos vêm da D1)
- Assumir USD — preços formatados em **EUR** (`pt-PT`)

## Estado atual (referência)

- **Locales ativos:** `pt` apenas
- **Páginas SSR:** `/`, `/c/rugs`, `/product/:slug`, `/api/products*`
- **Página estática:** `/cart`
- **Imagens:** picsum.photos (seed em `src/data/images.ts`), otimização compile no build
