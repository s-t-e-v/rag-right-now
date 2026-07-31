# Tester le LLM (Workers AI) en isolation

Avant de brancher `generateQuestion` / `evaluateAnswer`, il est utile de tester le modèle seul,
sans passer par toute la pipeline RAG.

## 1. Lister les modèles disponibles

```bash
npx wrangler ai models list
```

Repérer un modèle instruct pour l'évaluation JSON, ex. `@cf/meta/llama-3.1-8b-instruct`
ou `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (plus gros, plus lent).

## 2. Appeler un modèle directement en CLI (sans écrire de code)

```bash
npx wrangler ai run @cf/meta/llama-3.1-8b-instruct \
  --prompt "Réponds uniquement en JSON: {\"score\": 0.5}"
```

C'est le moyen le plus rapide pour vérifier qu'un prompt produit bien du JSON exploitable,
avant de l'intégrer dans `services/llm/prompts.ts`.

## 3. Appeler via l'API REST Cloudflare (curl, hors wrangler)

Utile pour tester depuis n'importe quel outil (Postman, script) sans le CLI.

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/run/@cf/meta/llama-3.1-8b-instruct \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Explique le max pooling en une phrase."}]}'
```

`$CF_ACCOUNT_ID` et `$CF_API_TOKEN` (permission "Workers AI - Read/Edit") sont dispo dans le
dashboard Cloudflare > My Profile > API Tokens.

## 4. Tester via le Worker en dev (le vrai chemin utilisé par l'app)

⚠️ Le binding `AI` n'a pas d'émulation locale : `wrangler dev` fait un appel réseau réel vers
Cloudflare même en local, donc il faut être authentifié (`npx wrangler login`).

Ajouter temporairement une route de debug (à retirer avant prod, ou garder derrière un flag) :

```ts
// backend/src/routes/debug.ts
app.get("/api/debug/ai", async (c) => {
  const result = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [{ role: "user", content: "Explique le max pooling en une phrase." }],
  });
  return c.json(result);
});
```

Puis :

```bash
npm run dev -w backend
curl http://localhost:8787/api/debug/ai
```

## 5. Vérifier le format JSON structuré (response_format)

Certains modèles Workers AI supportent `response_format: { type: "json_schema", json_schema }`
pour forcer une sortie qui matche le schéma d'évaluation (cf. `shared/types/schemas.ts`).
À valider avec le modèle choisi avant de l'utiliser dans `evaluateAnswer.ts` :

```bash
npx wrangler ai run @cf/meta/llama-3.1-8b-instruct \
  --prompt "..." \
  --json '{"response_format": {"type": "json_object"}}'
```

## 6. Options : LLM en local

Utile en dev pour itérer sans consommer le quota Workers AI, ou pour travailler hors ligne.
Le plan (section 9) le prévoit explicitement comme alternative en développement. Trois options,
du plus simple au plus intégré :

### Option A — Ollama (serveur local, le plus simple à installer)

```bash
# https://ollama.com/download
ollama pull llama3.1:8b
ollama serve   # http://localhost:11434 (démarré automatiquement sur mac/win)
```

Test en CLI :

```bash
ollama run llama3.1:8b "Réponds uniquement en JSON: {\"score\": 0.5}"
```

Test via l'API HTTP :

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "messages": [{ "role": "user", "content": "Explique le max pooling en une phrase." }],
  "stream": false,
  "format": "json"
}'
```

`"format": "json"` force une sortie JSON valide, l'équivalent du `response_format` Workers AI.

### Option B — LM Studio (serveur local, API compatible OpenAI)

Alternative à Ollama avec une interface graphique pour choisir/télécharger des modèles (GGUF) et
un serveur local qui expose une API **compatible OpenAI** — pratique si on utilise déjà un SDK
OpenAI-like côté TypeScript (ex. `openai` npm package, ou le Vercel AI SDK).

```bash
# https://lmstudio.ai/ - télécharger un modèle depuis l'app, puis "Start Server" (onglet Developer)
# expose http://localhost:1234/v1 (API OpenAI-compatible)
```

Test via curl (même shape que l'API OpenAI) :

```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "local-model",
    "messages": [{ "role": "user", "content": "Explique le max pooling en une phrase." }],
    "response_format": { "type": "json_object" }
  }'
```

Intérêt : si on code le client d'éval avec le SDK `openai` (`baseURL: "http://localhost:1234/v1"`),
le même code peut plus tard pointer vers n'importe quel autre provider OpenAI-compatible.

### Option C — node-llama-cpp (framework TypeScript, in-process, sans serveur)

Package TS/Node ([node-llama-cpp](https://node-llama-cpp.withcat.ai)) qui charge un modèle GGUF
directement dans le process Node — pas de serveur à lancer, utile pour un script de test rapide
ou des tests automatisés qui ne dépendent pas d'un process externe qui tourne.

```bash
npm install -D node-llama-cpp
# télécharger un modèle GGUF (ex. depuis Hugging Face) dans backend/models/
```

```ts
// backend/scripts/test-local-llm.ts (script de test, pas une route de l'app)
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const llama = await getLlama();
const model = await llama.loadModel({ modelPath: "./models/llama-3.1-8b-instruct.Q4_K_M.gguf" });
const context = await model.createContext();
const session = new LlamaChatSession({ contextSequence: context.getSequence() });

const response = await session.prompt("Explique le max pooling en une phrase.");
console.log(response);
```

```bash
npx tsx backend/scripts/test-local-llm.ts
```

⚠️ Ce package utilise des bindings natifs — il tourne très bien dans un script Node classique,
mais **pas** dans le runtime Workers (isolate V8, pas de Node natif). À réserver pour des tests
de prompt en dehors de `wrangler dev`, pas pour brancher directement dans les routes du Worker.

### Brancher les options locales dans le Worker en dev

`wrangler dev` tourne en local, donc un `fetch("http://localhost:11434/...")` (Ollama) ou
`fetch("http://localhost:1234/v1/...")` (LM Studio) depuis un Worker fonctionne directement — pas
de binding nécessaire, contrairement à `AI`. (node-llama-cpp, lui, reste hors du Worker, cf. ci-dessus.)
L'idée : une petite fonction `runLlm()` qui bascule de provider selon une variable d'env, pour ne
pas dupliquer la logique de prompt.

```ts
// backend/src/services/llm/client.ts (à créer si besoin)
// LLM_PROVIDER=ollama      -> fetch("http://localhost:11434/api/chat")
// LLM_PROVIDER=lm-studio   -> fetch("http://localhost:1234/v1/chat/completions")
// LLM_PROVIDER=workers-ai (défaut) -> c.env.AI.run(model, ...)
```

Ajouter `LLM_PROVIDER="ollama"` (ou `"lm-studio"`) dans `backend/.dev.vars` (fichier local,
gitignore) pour activer le mode local sans toucher au code entre les deux devs.

### Limites du mode local

- Format de sortie et qualité JSON différents de Workers AI : valider le parsing des deux côtés
  avant de considérer le prompt "final".
- Modèle 8B local nettement moins précis qu'un modèle Cloudflare plus gros — bien pour itérer vite,
  pas pour juger la qualité finale des évaluations.
- Pas toujours de `response_format: json_schema` structuré strict comme certains modèles hébergés ;
  se reposer sur `"format": "json"` / `response_format: json_object` + validation Zod côté serveur.

## Pièges connus

- Le premier appel à un modèle peut être lent (cold start du modèle sur l'infra Cloudflare).
- `wrangler dev --remote` force tous les bindings (D1, R2, Vectorize, AI) à taper les vraies
  ressources cloud plutôt que les émulations locales — pratique pour un test bout-en-bout fidèle,
  mais consomme le quota gratuit plus vite.
- Le tier gratuit Workers AI a des limites de requêtes/jour ; surveiller le dashboard si les
  appels échouent en boucle pendant les tests.
