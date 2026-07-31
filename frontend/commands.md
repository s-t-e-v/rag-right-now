# Commandes - Frontend

## Installation

```bash
npm install
```

(depuis la racine du monorepo, grâce aux workspaces ; ou `npm install` directement dans `frontend/`)

## Développement

```bash
npm run dev -w frontend
# ou, depuis frontend/
npm run dev
```

Lance Vite sur http://localhost:5173

## Build production

```bash
npm run build -w frontend
```

Génère le dossier `dist/` (à déployer sur Cloudflare Pages).

## Prévisualiser le build

```bash
npm run preview -w frontend
```

## Déploiement (Cloudflare Pages)

```bash
npx wrangler pages deploy dist --project-name=rag-dojo-frontend
```

## Notes

- Variable d'env `VITE_API_URL` pour pointer vers le backend (par défaut `/api`, à définir dans `frontend/.env.local`).
- Pour tester en local avec le backend : lancer `backend` (`wrangler dev`) en parallèle et configurer le proxy Vite ou `VITE_API_URL=http://localhost:8787`.
