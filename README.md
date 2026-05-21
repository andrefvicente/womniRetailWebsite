# Womni Rugs — Astro 6.3 retail store

Loja de tapetes em [Astro 6.3](https://astro.build/blog/astro-630/), preparada para **Cloudflare Workers** com base de dados **D1**, inspirada na UX da [RugVista](https://www.rugvista.com/c/rugs).

**Documentação para manutenção e assistentes IA:** [docs/](./docs/) — começar por [docs/AGENTS.md](./docs/AGENTS.md).

## Features

- **Home / catálogo / PDP** — dados lidos da D1 em runtime (SSR)
- **API Workers** — `GET /api/products`, `GET /api/products/:slug`
- **Carrinho** — estático + `localStorage`
- **i18n** — português (`pt`); pronto para mais locales em `src/i18n/`

## Stack

- Astro `^6.3.6` + `@astrojs/cloudflare`
- Cloudflare **D1** (SQLite na edge)
- **Wrangler** para dev/deploy
- TypeScript, CSS vanilla

## Desenvolvimento local

```bash
npm install

# 1. Criar e migrar a base D1 local
npm run db:migrate:local

# 2. Servidor com proxy D1 (platformProxy)
npm run dev
```

Abrir http://localhost:4321

### Regenerar seed a partir dos ficheiros TS

```bash
npm run db:generate-seed
npm run db:migrate:local
```

## API (Cloudflare Worker)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/products` | Lista produtos |
| `GET` | `/api/products/:slug` | Detalhe de um produto |

**Query params** (lista): `locale`, `room`, `material`, `style`, `color`, `sale`, `badge`, `q`, `sort`, `maxPrice`

Exemplos:

```bash
curl "http://localhost:4321/api/products?locale=pt&room=living-room"
curl "http://localhost:4321/api/products/stockholm-wool-flatweave?locale=pt"
```

## Deploy na Cloudflare

```bash
# 1. Criar base D1 na conta Cloudflare (uma vez)
npm run db:create
# Copiar o database_id para wrangler.jsonc → d1_databases[0].database_id

# 2. Aplicar migrações na base remota
npm run db:migrate:remote

# 3. Build + deploy do Worker
npm run deploy
```

Autenticação: `npx wrangler login`

### Ficheiros Cloudflare

| Ficheiro | Função |
|----------|--------|
| `wrangler.jsonc` | Worker, binding `DB`, assets |
| `migrations/0001_schema.sql` | Tabelas `products`, `product_translations` |
| `migrations/0002_seed.sql` | Dados iniciais (12 tapetes) |
| `src/lib/db/products.ts` | Queries D1 |
| `src/pages/api/products/` | Endpoints REST |

## Estrutura

Ver mapa completo em [docs/architecture.md](./docs/architecture.md).

```
docs/               # Guias de manutenção (AGENTS, D1, i18n, …)
src/
  lib/db/           # Acesso D1
  pages/api/        # API Workers
  i18n/             # Traduções UI (pt)
  data/             # Tipos, filtros, fallback estático
migrations/         # Schema + seed D1
wrangler.jsonc      # Config Cloudflare
```

## Adicionar outro idioma

1. `src/i18n/en.ts` + registar em `src/i18n/index.ts`
2. `locales: ['pt', 'en']` em `astro.config.mjs`
3. Inserir linhas em `product_translations` na D1 para cada `slug` + `locale`

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Astro dev + D1 local via platformProxy |
| `npm run build` | Build para Cloudflare |
| `npm run preview` | `wrangler dev` (produção local) |
| `npm run deploy` | Build + `wrangler deploy` |
| `npm run db:migrate:local` | Migrações D1 local |
| `npm run db:migrate:remote` | Migrações D1 remota |
# womniRetailWebsite
