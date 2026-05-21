# Páginas e rotas

## Mapa de rotas

| Rota | Ficheiro | Render | Dados |
|------|----------|--------|-------|
| `/` | `pages/index.astro` | SSR | D1 → produtos localizados |
| `/c/rugs` | `pages/c/rugs/index.astro` | SSR | D1 + filtros client JS |
| `/product/:slug` | `pages/product/[slug].astro` | SSR | D1 por slug |
| `/cart` | `pages/cart.astro` | **Estático** | `localStorage` apenas |
| `/api/products` | `pages/api/products/index.ts` | SSR | D1 JSON |
| `/api/products/:slug` | `pages/api/products/[slug].ts` | SSR | D1 JSON |

## i18n (Astro)

Config: `astro.config.mjs`

- `defaultLocale: 'pt'`
- `prefixDefaultLocale: false` → URLs sem `/pt`

`Astro.currentLocale` disponível em páginas e componentes.

## Página inicial (`index.astro`)

- `prerender = false`
- `getLocalizedProducts(Astro.currentLocale)`
- Secções: hero, categorias (`categoryTiles` + `t.categoryTiles`), destaques, guia tamanhos, novidades

## Catálogo (`c/rugs/index.astro`)

### Servidor

- Lista completa de produtos localizados
- `productData` serializado para `<script define:vars>`

### Cliente (filtros)

Script inline filtra cards por:

- `room`, `material`, `style`, `color` (chaves)
- `sale`, `badge`, `q` (pesquisa no nome)
- `maxPrice` (range slider)
- Ordenação: `popular`, `price-asc`, `price-desc`, `new`, `rating`

URL params aplicados no load (`applyUrlToFilters`).

### Mobile

Botão `data-open-filters` abre sidebar fullscreen (`#filters.filters--open`).

## PDP (`product/[slug].astro`)

- **Sem** `getStaticPaths` — slug resolvido em runtime
- Redirect `/c/rugs` se slug inválido
- Form `data-add-to-cart` → `localStorage` `womni-cart`
- Galeria: thumbs trocam `src` da imagem principal (URLs diretas)

## Carrinho (`cart.astro`)

- `prerender = true` — HTML estático
- `renderCart()` lê/escreve `womni-cart`
- Item shape: `{ id, slug, name, price, image, size, color, qty }`
- `id` = `{slug}-{size}-{color}`

## API REST

### `GET /api/products`

Query params:

| Param | Exemplo |
|-------|---------|
| `locale` | `pt` |
| `room` | `living-room` |
| `material` | `wool` |
| `style` | `scandinavian` |
| `color` | `beige` |
| `sale` | `true` |
| `badge` | `bestseller` |
| `q` | pesquisa |
| `sort` | `price-asc` |
| `maxPrice` | `400` |

Resposta:

```json
{
  "locale": "pt",
  "count": 12,
  "products": [ /* Product[] localizado */ ]
}
```

### `GET /api/products/:slug`

Resposta: `{ "locale": "pt", "product": { … } }` ou 404.

Ambos: `Cache-Control: public, max-age=60`.

## Componentes partilhados

| Componente | Props / notas |
|------------|----------------|
| `BaseLayout` | `title`, `description?` |
| `ProductCard` | `product: Product` |
| `FilterSidebar` | usa `t` + `filterKeys` internamente |
| `Breadcrumbs` | `items: { label, href? }[]` |
| `Header` | cart count via `womni-cart` |
| `Footer` | links por chave i18n |

## Adicionar nova página

1. Criar `src/pages/....astro`
2. Se precisar D1: `export const prerender = false`
3. Se só HTML/CSS: `export const prerender = true` (opcional, default pode variar)
4. Usar `BaseLayout` + `useTranslations`
5. Documentar rota neste ficheiro

## Adicionar endpoint API

1. `src/pages/api/nome.ts` ou `api/nome/index.ts`
2. `export const prerender = false`
3. `export const GET: APIRoute = async ({ locals, url }) => { … }`
4. `getDatabase()` para D1 (`cloudflare:workers`)
