# Base de dados (Cloudflare D1)

## Binding

| Nome | Ficheiro | Valor |
|------|----------|-------|
| Binding Worker | `wrangler.jsonc` | `DB` |
| Nome da base | `wrangler.jsonc` | `womni-rugs-db` |
| ID remoto | `wrangler.jsonc` | Substituir placeholder após `npm run db:create` |

## Schema

### `products` (dados locale-agnósticos)

| Coluna | Tipo | Notas |
|--------|------|-------|
| `slug` | TEXT PK | URL `/product/{slug}` |
| `price` | INTEGER | Euros, sem cêntimos na UI |
| `original_price` | INTEGER NULL | Promoção |
| `image` | TEXT | URL principal |
| `images` | TEXT | JSON array de URLs |
| `sizes` | TEXT | JSON array (`120x170`, …) |
| `colors` | TEXT | JSON array de `ColorKey` |
| `material` | TEXT | `MaterialKey` |
| `style` | TEXT | `StyleKey` |
| `room` | TEXT | `RoomKey` |
| `rating` | REAL | |
| `review_count` | INTEGER | |
| `badge` | TEXT NULL | `sale` \| `new` \| `bestseller` |

### `product_translations`

| Coluna | Tipo |
|--------|------|
| `slug` + `locale` | PK composta |
| `name`, `description`, `care` | TEXT |

Locale atual na seed: **`pt`**.

## Migrações

```
migrations/
  0001_schema.sql   # CREATE TABLE (não alterar após deploy — criar 0003_…)
  0002_seed.sql     # Gerado automaticamente
```

### Comandos

```bash
# Local (dev)
npm run db:migrate:local

# Produção
npm run db:migrate:remote

# Regenerar seed após mudar products.ts ou pt.ts products.*
npm run db:generate-seed
npm run db:migrate:local
```

### Criar base remota (uma vez)

```bash
npm run db:create
# Copiar database_id para wrangler.jsonc
```

## Gerar seed

`scripts/generate-seed.mjs`:

1. Lê `src/data/products.ts` (preços, chaves, imagens)
2. Lê `src/i18n/pt.ts` → `products.{slug}` (nome, descrição, cuidados)
3. Escreve `migrations/0002_seed.sql` (DELETE + INSERT)

**Não editar `0002_seed.sql` à mão** — regenerar.

## Camada de acesso

`src/lib/db/products.ts`:

| Função | Descrição |
|--------|-----------|
| `getDatabase()` | Obtém `env.DB` via `cloudflare:workers` |
| `hasDatabase()` | Verifica se D1 está disponível |
| `listProductRows(db, locale, filters?, sort?)` | Lista com JOIN translations |
| `getProductRow(db, slug, locale)` | Um produto |
| `listProductsBase` / `getProductBase` | Mapeia row → `ProductBase` |
| `parseProductFiltersFromUrl(url)` | Query → `ProductFilters` |
| `parseProductSort(url)` | `sort` param |

`src/lib/db/types.ts`: `rowToProductBase()`, tipos `ProductRow`, `ProductFilters`.

## Filtros SQL

- `room`, `material`, `style`: `IN (...)` com chaves
- `color`: `colors LIKE '%"beige"%'` (JSON array)
- `sale`: `original_price IS NOT NULL`
- `badge`: igualdade
- `q`: `name LIKE` (tradução) + material/style

Ordenação: `popular` (default), `price-asc`, `price-desc`, `new`, `rating`.

## Consulta manual (debug)

```bash
npx wrangler d1 execute womni-rugs-db --local --command "SELECT slug, price FROM products"
```

## Nova migração (schema)

1. Criar `migrations/0003_descricao.sql`
2. `npm run db:migrate:local` e `db:migrate:remote`
3. Atualizar tipos em `src/lib/db/types.ts` e queries se necessário
4. Documentar em [products.md](./products.md) se afetar catálogo

## Estado local

Dados em `.wrangler/state/v3/d1/` (gitignored).
