# Comprendre le RAG pour RAG Dojo

Ce fichier explique les concepts du RAG (Retrieval-Augmented Generation) appliqués à ce projet
spécifiquement, pour coder les services de `backend/src/services/` en sachant ce qu'on fait et
pourquoi, plutôt que de copier une recette générique.

---

## 1. Le RAG en une phrase

Un LLM ne connaît pas vos documents. Le RAG consiste à **aller chercher les passages pertinents
dans vos documents au moment de la requête**, et à les injecter dans le prompt envoyé au LLM,
pour qu'il réponde en se basant sur ces passages plutôt que sur sa mémoire générale (qui peut
être fausse, périmée, ou tout simplement ne rien savoir de vos notes de cours).

```text
Sans RAG :  Question -> LLM -> Réponse (basée sur ce que le modèle a appris à l'entraînement)
Avec RAG :  Question -> Recherche dans vos documents -> Passages pertinents
                      -> LLM (question + passages) -> Réponse sourcée
```

Deux familles d'opérations bien distinctes composent un système RAG :

- **Indexation** (une fois par document, à l'upload) : transformer un document en quelque chose
  de cherchable.
- **Retrieval + génération** (à chaque requête) : chercher les bons passages, puis les donner au
  LLM.

Dans RAG Dojo, le RAG sert **deux usages différents**, ce qui est plus original qu'un simple
chatbot documentaire — à bien garder en tête en codant :

1. **Générer une question** à partir des documents (le LLM invente une question pédagogique
   fondée sur un passage précis).
2. **Évaluer une réponse** en allant chercher les passages qui permettent de juger si le candidat
   a raison, quels points manquent, et de citer précisément la source (`chunk_id`).

---

## 2. Indexation : rendre un document cherchable

### 2.1 Extraction (`services/ingestion/extractText.ts`)

Premier problème concret : un PDF n'est pas du texte propre. Il faut en extraire le texte brut
(souvent avec des artefacts : numéros de page, en-têtes répétés, colonnes mal ordonnées). Pour la
V1 (Markdown/texte), ce problème n'existe quasiment pas — c'est pour ça que le plan recommande de
commencer par ces formats avant de s'attaquer au PDF.

### 2.2 Chunking (`services/ingestion/chunking.ts`)

Un document entier est trop long pour être injecté dans un prompt, et trop "large" pour qu'une
recherche vectorielle soit précise (un vecteur qui résume 10 pages ne ressemble à rien de précis).
On découpe donc en **chunks** — des morceaux de taille raisonnable, indexés indépendamment.

Pourquoi 300-500 tokens avec 50-80 tokens d'overlap (cf. section 3.B du plan) :

- **Trop petit** (une phrase) → le chunk perd le contexte ("il" fait référence à quoi ?), le LLM
  reçoit des bribes inutilisables.
- **Trop grand** (une page entière) → le vecteur d'embedding devient une moyenne floue de
  plusieurs idées, la recherche devient imprécise, et on gaspille du budget de tokens dans le
  prompt final avec du contenu non pertinent.
- **L'overlap** évite qu'une idée importante soit coupée exactement à la frontière entre deux
  chunks (un concept expliqué à cheval sur deux chunks doit apparaître entier dans au moins un
  des deux).
- **Ne pas couper au milieu d'un paragraphe** : découper au dernier saut de paragraphe/titre
  avant la limite de tokens plutôt qu'à un compte de tokens strict — un chunk doit rester une
  unité de sens.

Conserver les métadonnées (`page`, `section`) sur chaque chunk : c'est ce qui permettra plus tard
d'afficher une citation utile ("cf. p.12, section Pooling layers") plutôt qu'un ID opaque.

### 2.3 Embeddings (`services/embeddings/embed.ts`)

Un **embedding** est un vecteur (ex. 768 nombres) qui représente le *sens* d'un texte. Deux
textes proches en sens ont des vecteurs proches (mesuré par similarité cosinus). C'est ce qui
permet de chercher "par le sens" plutôt que par mot-clé exact — une question qui dit "pourquoi
réduire la dimension d'une image" doit pouvoir retrouver un chunk qui parle de "downsampling"
sans jamais utiliser le mot "dimension".

```text
"Le max pooling réduit la taille du feature map"
        │
        ▼  modèle d'embedding (ex. @cf/baai/bge-base-en-v1.5, dimension 768)
        ▼
[0.0123, -0.041, 0.187, ..., 0.056]   <- vecteur à 768 dimensions
```

Point important : le **même modèle d'embedding** doit être utilisé pour indexer les chunks et
pour encoder les requêtes de recherche plus tard — deux modèles différents produisent des espaces
vectoriels incompatibles (les distances n'auraient plus de sens).

### 2.4 Stockage vectoriel (Vectorize)

Le vecteur est stocké avec des métadonnées (`document_id`, `chunk_id`, `page`, `topic`...) dans
une base vectorielle. Elle sait répondre à : "donne-moi les k vecteurs les plus proches de ce
vecteur de requête" en temps quasi-constant, même sur des millions de vecteurs (via des index
approximatifs type HNSW — pas besoin de comparer un par un). Le filtrage par métadonnée (ex. ne
chercher que dans un `corpus_id` donné) se fait généralement au même moment que la recherche.

---

## 3. Retrieval : trouver les bons passages au moment de la requête

### 3.1 Construire la requête de recherche

Contrairement à un chatbot classique où la requête = la question de l'utilisateur, RAG Dojo a
**deux moments de retrieval différents avec des requêtes différentes** (cf. section 3.D du plan) :

- **Pour générer une question** : la requête vient du thème/skill choisi (ex. "pooling layers",
  "CNN"), pas d'une question posée par un humain.
- **Pour évaluer une réponse** : la requête doit combiner la question posée + la réponse du
  candidat (+ éventuellement le skill visé). C'est ce qui permet de retrouver les passages qui
  parlent spécifiquement de ce que le candidat a dit — y compris les passages qui *contredisent*
  une affirmation fausse, essentiels pour la correction.

```ts
// Exemple concret pour l'évaluation (services/retrieval/search.ts)
const query = `${question}\n\nRéponse du candidat : ${answer}`;
const results = await searchChunks(vectorize, query, { corpusId, topK: 10 });
```

### 3.2 Top-K puis reranking (`services/retrieval/rerank.ts`)

La recherche vectorielle sur un gros top-K (ex. 10) est rapide mais approximative : la similarité
cosinus capture le sens général, pas toujours la pertinence fine. Le reranking réduit ce top-10 à
un top-3/5 plus précis, avec une méthode plus coûteuse mais plus fine (souvent un cross-encoder :
un modèle qui regarde la paire [requête, chunk] ensemble, au lieu de comparer deux vecteurs
calculés indépendamment).

Pour le MVP, une heuristique simple suffit avant d'investir dans un vrai reranker :

- filtrer par métadonnée pertinente (même `document_id`/`topic` que la session) ;
- dédupliquer les chunks quasi-identiques (paragraphes répétés dans le doc source) ;
- privilégier les chunks dont le score de similarité dépasse un seuil plutôt que de toujours
  renvoyer exactement k résultats (mieux vaut 2 chunks pertinents que 5 dont 3 hors sujet).

### 3.3 Pourquoi limiter à 3-5 chunks et pas tout envoyer au LLM

- **Coût et latence** : plus de tokens en entrée = plus lent, plus cher.
- **"Lost in the middle"** : les LLM ont tendance à moins bien utiliser l'information placée au
  milieu d'un long contexte qu'au début/fin — noyer le bon passage dans 20 chunks le rend moins
  exploitable, pas plus.
- **Bruit** : des chunks non pertinents peuvent pousser le LLM à halluciner un lien qui n'existe
  pas, ou à citer une mauvaise source.

---

## 4. Génération augmentée : construire le prompt

### 4.1 Génération de question (`services/llm/generateQuestion.ts`)

Le prompt reçoit : thème, niveau, chunks récupérés, historique des questions déjà posées, erreurs
précédentes. Le rôle du RAG ici est d'**ancrer la question dans le contenu réel du document** —
sans ça, le LLM inventerait des questions génériques de son savoir général, ce qui viderait le
projet de son intérêt (section 12 du plan : "RAG Dojo ne se contente pas de retrouver une
réponse, il utilise les sources pour générer...").

Toujours faire porter `source_chunk_ids` dans la sortie structurée : c'est la traçabilité qui
permettra plus tard d'afficher "cette question vient de ce passage" et de vérifier que le système
ne dérive pas vers des questions hors-sujet.

### 4.2 Évaluation de réponse (`services/llm/evaluateAnswer.ts`)

C'est l'appel le plus important du projet. Le LLM reçoit la question, la réponse du candidat, les
`expected_concepts`, et les chunks récupérés — et doit produire **un seul objet JSON** qui note,
corrige, relance, et met à jour les compétences (cf. section 4 du plan). Un seul appel plutôt que
plusieurs, pour :

- rester dans le budget de latence/coût d'un tour d'entretien ;
- garder une cohérence entre le score et le feedback (deux appels séparés pourraient se
  contredire, ex. score élevé mais feedback qui liste plein de manques).

Point clé pour la fiabilité : **les citations doivent être vérifiables**. Le LLM ne doit pas
inventer un `chunk_id` — la fonction qui construit le prompt doit numéroter explicitement les
chunks fournis (ex. `[chunk_42] ...contenu...`) et demander au LLM de ne citer que ces IDs-là.
Après réception de la réponse, valider côté code que chaque `citations[].chunk_id` fait bien
partie des chunks effectivement envoyés — sinon, rejeter/retenter plutôt que d'afficher une fausse
source à l'utilisateur.

### 4.3 Sortie structurée (JSON strict)

Deux façons de forcer un LLM à répondre en JSON valide et parsable :

1. **Prompt engineering seul** : lui donner le schéma exact et des exemples, parser avec un
   `try/catch` + `zod.safeParse`, et retenter une fois si le parsing échoue.
2. **`response_format` structuré** (JSON schema / JSON mode) quand le modèle le supporte : le
   provider force la sortie à respecter le schéma, plus fiable que l'espoir que le modèle obéisse.

Toujours valider avec Zod côté serveur (`shared/types/schemas.ts`) avant de renvoyer la réponse au
frontend — ne jamais faire confiance à un JSON produit par un LLM sans validation.

---

## 5. Évaluer la qualité du RAG lui-même

Le plan (section 11, jour 6) prévoit un benchmark de 15-30 questions et des "tests du retrieval".
Deux couches à mesurer séparément, car une mauvaise réponse peut venir de l'une ou de l'autre :

### 5.1 Qualité du retrieval (indépendante du LLM)

- **Recall@k** : pour une question donnée dont on connaît le chunk source attendu, est-ce que ce
  chunk apparaît dans le top-k renvoyé par la recherche ? Si non, aucun prompt engineering ne
  sauvera l'évaluation — le LLM n'aura jamais vu la bonne information.
- **Precision@k** : parmi les k chunks renvoyés, combien sont réellement pertinents ? Beaucoup de
  bruit dilue le signal utile dans le prompt.

Se construit un petit jeu de test à la main : `{ query, expected_chunk_id }` sur quelques dizaines
de cas (cf. `docs/benchmark/questions.json`), à faire tourner contre `services/retrieval/search.ts`
directement, sans passer par le LLM — rapide et déterministe à vérifier.

### 5.2 Qualité de la génération (dépend du LLM, avec les bons chunks fournis)

- **Faithfulness** : le feedback généré est-il fidèle aux chunks fournis, ou invente-t-il des
  informations absentes des sources (hallucination) ?
- **Cohérence score/feedback** : un `score` de 0.9 avec 3 `missing_points` listés est un signe que
  le prompt d'évaluation doit être retravaillé.
- **Citations valides** : cf. 4.2 — vérifiable automatiquement (le `chunk_id` cité existe-t-il
  parmi les chunks envoyés ?), pas besoin d'un humain pour ce test précis.

---

## 6. Pièges courants (à surveiller pendant le dev)

- **Chunk trop gros ou coupé n'importe où** → citations qui pointent vers un paragraphe à moitié
  incompréhensible.
- **Query de recherche = juste la question** pour l'évaluation, en oubliant d'inclure la réponse
  du candidat → le retrieval rate les passages qui auraient permis de corriger une erreur précise.
- **Pas de filtrage par corpus/session** → un chunk d'un autre corpus (autre utilisateur, autre
  sujet) remonte dans les résultats et pollue une question ou une évaluation.
- **`chunk_id` halluciné** dans les citations → toujours valider côté serveur contre la liste des
  chunks réellement envoyés au prompt.
- **Un seul chunk pour tout** (pas de top-k, juste "le plus proche") → une réponse partiellement
  correcte a besoin de plusieurs angles (ex. downsampling + invariance + coût de calcul), pas un
  seul passage.
- **Re-générer les embeddings avec un modèle différent** sans réindexer tout Vectorize → les
  anciens vecteurs deviennent incomparables aux nouveaux, la recherche se dégrade silencieusement.

---

## 7. Où ça se branche dans le code

```text
Upload           -> routes/corpora.ts            (déjà implémenté : reçoit le fichier, stocke en R2)
Extraction       -> services/ingestion/extractText.ts
Chunking         -> services/ingestion/chunking.ts
Embeddings       -> services/embeddings/embed.ts
                    (déclenchés ensemble par routes/documents.ts -> POST /:id/index)

Recherche        -> services/retrieval/search.ts
Reranking        -> services/retrieval/rerank.ts
                    (utilisés par routes/interviews.ts -> POST /:id/start et /:id/answer)

Génération       -> services/llm/generateQuestion.ts + services/llm/prompts.ts
Évaluation       -> services/llm/evaluateAnswer.ts + services/llm/prompts.ts

Progression      -> services/progression/skills.ts
                    (appliqué après chaque evaluateAnswer, lit/écrit skill_progress en D1)
```

Voir aussi [testing-llm.md](testing-llm.md) pour tester la partie génération isolément, et
[test.md](test.md) pour des scénarios de bout en bout via curl.
