# Deploy Cloudflare

## Pré-requisitos

- Conta Cloudflare
- `npx wrangler login`
- Node ≥ 22.12

## Configuração inicial (uma vez)

### 1. Criar base D1 (se ainda não existir)

```bash
npm run db:create
```

A saída inclui o `database_id` UUID. **Obrigatório** em `wrangler.jsonc` — o placeholder `00000000-0000-0000-0000-000000000001` faz o deploy falhar com erro `10181`.

```jsonc
"d1_databases": [{
  "binding": "DB",
  "database_name": "womni-rugs-db",
  "database_id": "cb26b01c-bd39-4581-91d7-5d7957b87c0e"
}]
```

Listar bases existentes: `npx wrangler d1 list`

> **Nota:** Não reutilizar a base D1 `womni` se tiver outro schema (ex. tabelas `employee`). Usar `womni-rugs-db` dedicada a esta loja.

### 2. Migrações remotas

```bash
npm run db:migrate:remote
```

Confirma tabelas + 12 produtos em produção.

### 3. Deploy

```bash
npm run deploy
# = astro build && wrangler deploy
```

Worker name: `womni-rugs` (de `wrangler.jsonc`).

## Desenvolvimento local

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Astro + **platformProxy** (D1 local) |
| `npm run db:migrate:local` | Schema/seed em `.wrangler/state/` |
| `npm run preview` | `wrangler dev` pós-build (mais próximo produção) |

**Erro comum:** `D1 binding "DB" não encontrado` → correr `db:migrate:local` e usar `npm run dev` (não apenas preview estático sem adapter).

## Artefactos de build

```
dist/
  client/     # Assets estáticos
  server/     # Worker SSR + API
```

`wrangler.jsonc` → `assets.directory: "./dist"`.

## Bindings automáticos (adapter)

Sessions Astro estão **desativadas** (`session.driver: null`). O binding KV `SESSION` no `wrangler.jsonc` só referencia o namespace já criado pelo Pages, para evitar erro `10014`.

## Variáveis e secrets

- Não há secrets obrigatórios para D1 (binding por wrangler)
- `.dev.vars` gitignored — usar para overrides locais se necessário
- Não commitar `database_id` de produção em repos públicos sem política clara

## CI/CD (sugestão)

```yaml
# Exemplo GitHub Actions
- run: npm ci
- run: npm run build
- run: npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
- run: npx wrangler d1 migrations apply womni-rugs-db --remote
```

Migrações antes ou depois do deploy conforme política de schema.

## Domínio custom

Cloudflare Dashboard → Workers → `womni-rugs` → Triggers → Custom Domain.

## Imagens em produção

`imageService: 'compile'` pré-optimiza imagens no build para rotas estáticas/pré-render. Rotas SSR usam passthrough/runtime conforme adapter.

Para R2 + CDN próprio: configurar binding R2 e atualizar `src/data/images.ts` — fora do scope atual.

## Rollback

- Workers: versões anteriores no dashboard (Deployments)
- D1: sem rollback automático de migrações — planear migrações `000N` reversíveis

## Troubleshooting

| Problema | Solução |
|----------|---------|
| **KV `10014` namespace already exists** | Adapter tentava criar KV `SESSION`. Usar `session.driver: null` em `astro.config.mjs`. Se o namespace já existir no Pages, definir `id` em `kv_namespaces` no `wrangler.jsonc`. |
| **D1 `10181` database not found** | `database_id` em `wrangler.jsonc` deve ser o UUID real (`npx wrangler d1 list`), não o placeholder. |
| 500 em páginas SSR | Verificar binding `DB` e migrações remotas |
| API retorna `error` D1 | `db:migrate:remote`; confirmar `database_id` |
| Build falha import D1 | Tipos em `env.d.ts`; `getDatabase` path |
| Imagens 404 no build | URLs em `images.ts` devem responder 200 |
| `hybrid` config error | Remover `output: 'hybrid'` (Astro 6) |
| Seed desatualizado | `db:generate-seed` + migrate |

## Comandos úteis

```bash
npx wrangler d1 list
npx wrangler d1 execute womni-rugs-db --remote --command "SELECT COUNT(*) FROM products"
npx wrangler tail womni-rugs          # logs live
npm run cf-typegen                   # gerar tipos Wrangler
```

## Checklist pré-deploy

- [ ] `database_id` real em `wrangler.jsonc`
- [ ] `db:migrate:remote` aplicado
- [ ] `npm run build` local OK
- [ ] Testar `/api/products` e `/c/rugs` em preview
- [ ] Seed/regeneração se produtos mudaram
