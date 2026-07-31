# Commandes - Backend

## Installation

```bash
npm install
```

(depuis la racine du monorepo, grâce aux workspaces ; ou `npm install` directement dans `backend/`)

## Développement local

```bash
npm run dev -w backend
# ou, depuis backend/
npm run dev
```

Lance `wrangler dev` sur http://localhost:8787 (émule Workers AI, D1, R2, Vectorize, KV en local).

## Tester une route rapidement

```bash
curl http://localhost:8787/api/corpora
curl -X POST http://localhost:8787/api/interviews/123/answer \
  -H "Content-Type: application/json" \
  -d '{"answer": "..."}'
```

## Ressources Cloudflare (à créer une seule fois)

```bash
npx wrangler login

npx wrangler d1 create rag_dojo_db
npx wrangler r2 bucket create rag-dojo-documents
npx wrangler vectorize create rag-dojo-chunks --dimensions=768 --metric=cosine
npx wrangler kv namespace create CACHE
```

Reporter les ids générés dans `wrangler.toml`.

## Base de données (D1)

```bash
# appliquer le schema.sql en local
npx wrangler d1 execute rag_dojo_db --local --file=src/db/schema.sql

# en prod
npx wrangler d1 execute rag_dojo_db --remote --file=src/db/schema.sql

# ouvrir une console SQL locale
npx wrangler d1 execute rag_dojo_db --local --command="SELECT * FROM users"
```

## Déploiement

```bash
npm run deploy -w backend
# ou
npx wrangler deploy
```

## Logs en prod

```bash
npx wrangler tail
```

## Tester le LLM (Workers AI) en isolation

Voir [testing-llm.md](testing-llm.md).
