# Arquitetura

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Astro 6.3 |
| Runtime produção | Cloudflare Workers |
| Base de dados | Cloudflare D1 (SQLite) |
| Imagens | Astro `<Image />` + `imageService: 'compile'` no adapter |
| Estilos | CSS vanilla + variáveis em `global.css` |
| Carrinho | Browser `localStorage` (sem API de checkout) |

## Diagrama de fluxo

```
Browser
   │
   ▼
Cloudflare Worker (Astro SSR)
   │
   ├── Páginas SSR ──► getDatabase() ──► D1 (products + product_translations)
   │                      │
   │                      └── localizeProduct() ◄── i18n/pt.ts (labels UI + merge copy)
   │
   ├── /cart (estático, prerender=true)
   │
   └── /api/products ──► D1 ──► JSON
```

## Modo de renderização (Astro 6)

- **Default:** `output: "static"` com adapter Cloudflare → modo **server** para rotas não pré-renderizadas
- **`export const prerender = false`** em páginas que precisam de D1 em runtime:
  - `src/pages/index.astro`
  - `src/pages/c/rugs/index.astro`
  - `src/pages/product/[slug].astro`
  - `src/pages/api/products/*`
- **`export const prerender = true`** em `src/pages/cart.astro` (sem dados de servidor)

Não usar `output: 'hybrid'` — removido no Astro 6.

## Duas fontes de produtos

| Fonte | Uso |
|-------|-----|
| **D1** (`products` + `product_translations`) | Produção, dev com `platformProxy`, API |
| **`src/data/products.ts`** | Fallback se `DB` indisponível; **fonte do seed** |

`getLocalizedProducts(locale)` em `src/i18n/index.ts` usa `env` de `cloudflare:workers` quando disponível.

## Adapter Cloudflare

`astro.config.mjs`:

```js
adapter: cloudflare({
  platformProxy: { enabled: true },  // D1 local em npm run dev
  imageService: 'compile',
})
```

- **`platformProxy`:** expõe `env.DB` (`import { env } from 'cloudflare:workers'`) em desenvolvimento
- **`wrangler.jsonc`:** binding `DB` → `womni-rugs-db`

## Tipos runtime

`src/env.d.ts` declara `interface Env { DB: D1Database }`.

Acesso (Astro 6): `import { env } from 'cloudflare:workers'` → `env.DB` via `src/lib/db/bindings.ts`.

**Não usar** `Astro.locals.runtime.env` — removido no Astro v6.

## Componentes

- **Layouts:** `BaseLayout` (TrustBar, Header, Footer, `lang`, meta)
- **Dados:** passados via props (`ProductCard` recebe `Product` já localizado)
- **Interatividade:** `<script>` inline nas páginas (filtros catálogo, carrinho, PDP thumbs) — sem framework JS

## Dependências principais

- `astro`, `@astrojs/cloudflare`, `wrangler`
- Dev: `tsx` (gerar seed), `@cloudflare/workers-types`
