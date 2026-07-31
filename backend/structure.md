# Guide des dossiers — backend/src

Ce que chaque dossier fait, ce qui appelle quoi, et ce qu'il reste à coder dans chacun. À lire
avec [rag.md](rag.md) (concepts) et [test.md](test.md) (comment vérifier que ça marche).

```text
backend/src/
├── index.ts              <- point d'entrée, monte les routes, définit les Bindings
├── routes/                <- HTTP uniquement : parse la requête, appelle les services, renvoie du JSON
├── services/
│   ├── ingestion/          <- fichier brut -> texte -> chunks
│   ├── embeddings/         <- chunks -> vecteurs -> Vectorize
│   ├── retrieval/          <- requête -> chunks pertinents
│   ├── llm/                <- chunks + contexte -> question / évaluation générées par le LLM
│   └── progression/        <- met à jour les compétences du user en D1
├── db/                     <- schéma D1 et accès bruts
├── middleware/             <- CORS, auth
└── types/                  <- types internes (réexporte shared/types)
```

Règle de dépendance : **les routes appellent les services, jamais l'inverse**, et les services
d'un dossier peuvent appeler ceux d'un autre dossier de `services/` (ex. `llm/` appelle
`retrieval/`), mais jamais un fichier de `routes/`. Ça garde la logique testable indépendamment du
HTTP (cf. `testing-llm.md` qui teste `llm/` sans passer par une route).

---

## `routes/`

Rôle : traduire HTTP <-> appels de fonctions. Une route ne doit **pas** contenir de logique
métier (pas de chunking, pas de prompt) — juste parser le body/params, appeler le bon service, et
formatter la réponse JSON. Si une route commence à dépasser 30-40 lignes de logique, c'est un
signe qu'il faut extraire ça dans `services/`.

| Fichier | Statut | Reste à faire |
|---|---|---|
| `corpora.ts` | POST `/`, GET `/`, POST `/:id/documents` implémentés (basique, pas de D1) | Persister corpus/documents en D1 (`db/client.ts`) au lieu de renvoyer un id volatile |
| `documents.ts` | GET `/:id/raw` implémenté (debug) | POST `/:id/index` : appeler `ingestion/` puis `embeddings/` en séquence, mettre à jour le `status` du document en D1 |
| `interviews.ts` | vide | Toutes les routes : `POST /`, `GET /:id`, `POST /:id/start`, `POST /:id/answer` (la route centrale), `POST /:id/finish`, `GET /:id/report` |
| `users.ts` | vide | `GET /:id/skills` : lire `skill_progress` en D1 |

La route `/:id/answer` (`interviews.ts`) est la plus grosse : elle enchaîne
`retrieval/search.ts` → `retrieval/rerank.ts` → `llm/evaluateAnswer.ts` →
`progression/skills.ts`. En pratique, garder la route courte en délégant chaque étape à une
fonction, et assembler juste le résultat final ici.

---

## `services/ingestion/`

Rôle : transformer un fichier brut (récupéré depuis R2) en chunks prêts à être embeddés.

- **`extractText.ts`** : `ArrayBuffer` + type de fichier -> texte brut. Commencer par
  Markdown/texte (quasi un passthrough), le PDF viendra après (cf. `testing-llm.md`/plan section
  3.A — ne pas bloquer le reste du pipeline dessus).
- **`chunking.ts`** : texte -> liste de `Chunk` (300-500 tokens, overlap 50-80, pas de coupure au
  milieu d'un paragraphe). Pas de dépendance à Cloudflare ici — cette fonction doit être testable
  en pur TypeScript, sans `env`, ce qui facilite les tests unitaires sur le découpage.

Appelé uniquement depuis `routes/documents.ts` (`POST /:id/index`).

---

## `services/embeddings/`

Rôle : chunks -> vecteurs -> upsert dans Vectorize.

- **`embed.ts`** : reçoit `ai: Ai` et `vectorize: VectorizeIndex` (les bindings, passés depuis la
  route — ce dossier ne lit jamais `env` directement, pour rester testable/mockable) et une liste
  de `Chunk`. Appelle le modèle d'embedding (ex. `@cf/baai/bge-base-en-v1.5`), puis
  `vectorize.upsert()` avec les métadonnées utiles au filtrage plus tard (`document_id`,
  `corpus_id`, `chunk_id`, `page`, `topic`).

Point d'attention : batcher les appels si beaucoup de chunks (limite de taille de requête côté
Workers AI / Vectorize) plutôt qu'un upsert par chunk.

Appelé uniquement depuis `routes/documents.ts` (`POST /:id/index`), juste après le chunking.

---

## `services/retrieval/`

Rôle : au moment d'une question ou d'une évaluation, retrouver les chunks pertinents.

- **`search.ts`** : requête texte -> embedding de la requête (même modèle qu'à l'indexation !) ->
  `vectorize.query()` -> top-k chunks avec leur score. Doit accepter un filtre (`corpus_id` au
  minimum) pour ne jamais faire fuiter des chunks d'un autre corpus dans une session.
- **`rerank.ts`** : top-k (~10) -> top final (~3-5). Pour le MVP, une heuristique (dédup, seuil de
  score, filtrage métadonnée) suffit ; un vrai reranker (cross-encoder) est une amélioration V2.

Appelés depuis `routes/interviews.ts` (`/start` pour générer une question, `/answer` pour
évaluer) — la requête de recherche est différente dans les deux cas (cf. `rag.md` section 3.1).

---

## `services/llm/`

Rôle : construire les prompts et appeler le modèle, avec sortie JSON structurée validée.

- **`prompts.ts`** : les templates de prompt système, un par mode d'entretien
  (pédagogique/recruteur/senior) et par tâche (génération de question / évaluation). Garder les
  prompts ici et nulle part ailleurs — évite d'avoir des bouts de prompt dispersés dans les
  routes.
- **`generateQuestion.ts`** : thème + niveau + chunks + historique -> appel LLM -> parse/valide
  avec Zod (`shared/types/schemas.ts`) -> objet `{ question, topic, skill, difficulty,
  expected_concepts, source_chunk_ids }`.
- **`evaluateAnswer.ts`** : question + réponse + `expected_concepts` + chunks -> **un seul** appel
  LLM -> objet complet `{ score, verdict, correct_points, missing_points, incorrect_points,
  feedback, next_question, skill_updates, citations }`. Valider que chaque `citations[].chunk_id`
  fait partie des chunks effectivement envoyés (cf. `rag.md` section 4.2) avant de renvoyer la
  réponse.

C'est le dossier à tester en isolation en premier (voir `testing-llm.md`) — pas besoin d'attendre
que les routes ou la DB soient prêtes pour itérer sur les prompts.

---

## `services/progression/`

Rôle : maintenir la mémoire de progression (`SkillProgress`) après chaque tour.

- **`skills.ts`** :
  - `applySkillUpdates()` : reçoit les `skill_updates` renvoyés par `evaluateAnswer`, met à jour
    (ou crée) les lignes `skill_progress` en D1 (moyenne pondérée par `attempts`, pas juste un
    écrasement).
  - `pickNextSkillFocus()` : lit `skill_progress`, renvoie les compétences les plus faibles pour
    que `generateQuestion` les priorise (section 5 du plan : "une compétence faible doit
    apparaître plus souvent").

Appelé depuis `routes/interviews.ts` juste après `evaluateAnswer` dans `/answer`, et avant
`generateQuestion` pour préparer le tour suivant.

---

## `db/`

Rôle : tout ce qui touche D1 directement.

- **`schema.sql`** : DDL des 7 tables (cf. plan section 6 : users, corpora, documents, chunks,
  interview_sessions, interview_turns, skill_progress). À écrire en premier (jour 1 du MVP) — tout
  le reste en dépend pour persister quoi que ce soit.
- **`client.ts`** : petites fonctions de requêtes préparées (pas d'ORM, pour aller vite — cf.
  `wrangler d1 execute` dans `commands.md`). Un fichier par table si ça grossit, mais commencer
  simple.

Les `services/` ne doivent pas écrire du SQL brut elles-mêmes tant que possible — passer par
`db/client.ts` pour garder les requêtes SQL à un seul endroit.

---

## `middleware/`

- **`cors.ts`** : autoriser le frontend (Cloudflare Pages en prod, `localhost:5173` en dev) à
  appeler l'API. À brancher dans `index.ts` avant les routes.
- **`auth.ts`** : probablement pas nécessaire pour le MVP démo (single user, `user_1` en dur) —
  ne pas sur-ingénierer avant d'en avoir besoin. Le laisser vide jusqu'à ce que le multi-user
  devienne un vrai besoin.

---

## `types/`

- **`models.ts`** : réexporte les schémas Zod de `shared/types/schemas.ts`. Ne pas dupliquer de
  types ici — le but de `shared/` est justement d'avoir une seule source de vérité entre backend
  et frontend pour les objets JSON échangés par l'API.

---

## Ordre de développement suggéré (aligné sur le MVP d'une semaine, plan section 11)

1. `db/schema.sql` (tables) → `routes/corpora.ts` branché sur D1 au lieu de l'id volatile actuel.
2. `services/ingestion/` (chunking d'abord, texte brut trivial) → `routes/documents.ts` `/index`.
3. `services/embeddings/` → vérifier avec une recherche manuelle dans Vectorize (`services/retrieval/search.ts`
   testé seul, sans LLM).
4. `services/llm/generateQuestion.ts` (testé isolément, cf. `testing-llm.md`) → `routes/interviews.ts`
   `/start`.
5. `services/llm/evaluateAnswer.ts` + `services/progression/skills.ts` → `routes/interviews.ts`
   `/answer` (la route centrale).
6. `routes/interviews.ts` `/finish` + `/report`, `routes/users.ts` `/skills`.
7. Benchmark + gestion d'erreurs + cache (jour 6 du plan).
