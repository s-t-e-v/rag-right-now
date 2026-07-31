# RAG Dojo

Plateforme d'entraînement technique qui génère des entretiens personnalisés à partir de documents fournis par l'utilisateur. Voir [steven.md](steven.md) pour le plan détaillé.

## Structure

```text
frontend/   React + Vite + Tailwind (Cloudflare Pages)
backend/    Hono + Cloudflare Workers (API, RAG pipeline)
shared/     Schémas Zod partagés entre frontend et backend
docs/       Benchmark de questions, notes d'architecture
```

## Démarrage (à faire une fois les deps posées)

```bash
npm install
npm run dev -w backend    # wrangler dev
npm run dev -w frontend   # vite dev
```

## Ressources Cloudflare à créer

```bash
wrangler d1 create rag_dojo_db
wrangler r2 bucket create rag-dojo-documents
wrangler vectorize create rag-dojo-chunks --dimensions=768 --metric=cosine
wrangler kv namespace create CACHE
```

Puis reporter les ids dans [backend/wrangler.toml](backend/wrangler.toml).
