# Produtos (tapetes)

## Modelo de dados

**`ProductBase`** (D1 / `data/products.ts`) — sem textos longos:

- `slug`, `price`, `originalPrice?`, `image`, `images[]`
- `sizes[]`, `colors[]` (chaves)
- `material`, `style`, `room` (chaves)
- `rating`, `reviewCount`, `badge?`

**`Product`** (render) = `ProductBase` + `name`, `description`, `care` (de i18n/D1).

Tipos: `src/data/types.ts`  
Chaves válidas: ver `filterKeys` em `src/data/products.ts`.

## Adicionar um novo tapete

### 1. Entrada em `src/data/products.ts`

```ts
{
  slug: 'lisboa-wool-rug',        // kebab-case, único
  price: 199,
  originalPrice: 249,             // opcional (promoção)
  image: rugImages.neutral,       // ou URL em images.ts
  images: [rugImages.neutral],
  sizes: ['160x230', '200x300'],
  colors: ['beige', 'grey'],      // ColorKey
  material: 'wool',               // MaterialKey
  style: 'scandinavian',          // StyleKey
  room: 'living-room',            // RoomKey
  rating: 4.7,
  reviewCount: 120,
  badge: 'new',                   // opcional
},
```

### 2. Textos PT em `src/i18n/pt.ts`

```ts
products: {
  'lisboa-wool-rug': {
    name: 'Lisboa Tapete em Lã',
    description: '…',
    care: '…',
  },
},
```

### 3. Imagens (opcional)

Adicionar seed em `src/data/images.ts` → `rugImages.novoNome`.

### 4. Sincronizar D1

```bash
npm run db:generate-seed
npm run db:migrate:local
```

### 5. Verificar

- http://localhost:4321/product/lisboa-wool-rug
- http://localhost:4321/api/products/lisboa-wool-rug?locale=pt
- Aparece em `/c/rugs`

## Editar tapete existente

| Alterar | Ficheiro(s) |
|---------|-------------|
| Preço, tamanhos, chaves, imagens | `data/products.ts` → regenerar seed |
| Nome, descrição, cuidados PT | `i18n/pt.ts` → regenerar seed |
| Só UI (label material) | `i18n/pt.ts` → `materials.wool` (sem seed) |

## Remover tapete

1. Remover de `products.ts` e `pt.ts` → `products`
2. Regenerar seed (apaga e reinsere todos)
3. Ou SQL: `DELETE FROM product_translations WHERE slug = '…'; DELETE FROM products WHERE slug = '…';`

## Slugs e URLs

- PDP: `/product/{slug}`
- API: `/api/products/{slug}`
- Slug estável — não mudar após publicar sem redirect

## Filtros e catálogo

URLs usam **chaves**:

```
/c/rugs?room=living-room
/c/rugs?style=runner
/c/rugs?sale=true
/c/rugs?badge=bestseller
/c/rugs?sort=price-asc
```

Checkboxes em `FilterSidebar.astro` usam `value={key}`; labels via `t.rooms[key]`.

## Tamanhos exibidos

`sizeLabels` em `src/data/products.ts` (cm, formato PT).  
Não estão na D1 — alteração global no ficheiro TS.

## Imagens remotas

URLs em `src/data/images.ts` (picsum seeds).  
`astro.config.mjs`: `remotePatterns: [{ protocol: 'https' }]`.

Para imagens de produção: substituir por CDN/R2 e atualizar colunas `image` / `images`.

## Preços

- Armazenados como inteiros (euros)
- `formatPrice()` → `Intl` EUR `pt-PT`
- Envio grátis no carrinho: threshold **99 €** (`cart.astro` script)
