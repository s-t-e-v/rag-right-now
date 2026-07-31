# Tester l'API sans frontend

Le frontend n'existe pas encore : ces commandes simulent le parcours complet (section 2 et 12
du plan) directement contre l'API. Elles servent aussi de spec vivante — chaque route doit
finir par répondre exactement à ça une fois codée.

```bash
export API=http://localhost:8787
npm run dev -w backend   # dans un autre terminal
```

---

## 0. Créer un document d'exemple à uploader

```bash
mkdir -p /tmp/rag-dojo-samples
cat > /tmp/rag-dojo-samples/cnn_notes.md << 'EOF'
# Réseaux de neurones convolutifs

## Pooling layers

Le max pooling sélectionne la valeur maximale dans chaque fenêtre du feature map.
Il sert à :
- réduire la dimension spatiale (downsampling) et donc le coût de calcul des couches suivantes ;
- apporter une robustesse aux petites translations (translation invariance) ;
- au prix d'une perte d'information potentielle (les valeurs non maximales sont ignorées).

L'average pooling, à l'inverse, moyenne les valeurs de la fenêtre : plus doux, il conserve plus
d'information mais lisse les activations fortes.
EOF
```

---

## 1. Créer un corpus

```bash
curl -s -X POST $API/api/corpora \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Préparation entretien ML",
    "description": "Notes CNN, MLOps et fiche de poste"
  }' | tee /tmp/rag-dojo-samples/corpus.json | jq

export CORPUS_ID=$(jq -r .id /tmp/rag-dojo-samples/corpus.json)
```

```bash
curl -s $API/api/corpora | jq
```

---

## 2. Uploader un document dans le corpus

`POST /api/corpora/:id/documents` est déjà implémentée (routes/corpora.ts) : elle reçoit le
fichier en `multipart/form-data` (champ `file`) et le stocke tel quel dans R2 — l'extraction/
chunking/embedding viennent ensuite, à l'étape 3.

```bash
curl -s -X POST $API/api/corpora/$CORPUS_ID/documents \
  -F "file=@/tmp/rag-dojo-samples/cnn_notes.md;type=text/markdown" \
  -F "topic=computer-vision" \
  | tee /tmp/rag-dojo-samples/document.json | jq

export DOCUMENT_ID=$(jq -r .id /tmp/rag-dojo-samples/document.json)
export R2_KEY=$(jq -r .r2_key /tmp/rag-dojo-samples/document.json)
```

Réponse attendue :

```json
{
  "id": "doc_...",
  "corpus_id": "corpus_...",
  "filename": "cnn_notes.md",
  "source_type": "text/markdown",
  "size": 612,
  "topic": "computer-vision",
  "r2_key": "corpus_.../doc_...-cnn_notes.md",
  "status": "uploaded"
}
```

### Vérifier que le fichier a bien été reçu (le relire depuis R2)

```bash
curl -s "$API/api/documents/$DOCUMENT_ID/raw?key=$R2_KEY"
```

Doit renvoyer le contenu exact du fichier uploadé (route de debug `GET /:id/raw`, pas dans la
liste section 8 — pratique pour valider le multipart avant de coder l'indexation).

### Cas d'erreur à tester aussi

```bash
# sans champ "file" -> 400
curl -s -X POST $API/api/corpora/$CORPUS_ID/documents -F "topic=oops" | jq

# gros fichier / mauvais type -> vérifier que R2 accepte quand même (pas de validation de type encore)
curl -s -X POST $API/api/corpora/$CORPUS_ID/documents \
  -F "file=@/tmp/rag-dojo-samples/attention_is_all_you_need.pdf;type=application/pdf" | jq
```

---

## 3. Indexer le document (extraction -> chunking -> embeddings -> Vectorize)

```bash
curl -s -X POST $API/api/documents/$DOCUMENT_ID/index | jq
```

Sortie attendue : statut `indexed` + nombre de chunks créés. Vérifier ensuite la recherche
sémantique isolément avant de brancher le pipeline d'entretien :

```bash
curl -s -X POST $API/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "pourquoi utiliser le max pooling", "top_k": 5}' | jq
```

(route de debug optionnelle, pas dans la liste section 8 — utile pour valider `services/retrieval/search.ts`
avant de coder toute la route `/answer`.)

---

## 4. Créer une session d'entretien

```bash
curl -s -X POST $API/api/interviews \
  -H "Content-Type: application/json" \
  -d '{
    "corpus_id": "'"$CORPUS_ID"'",
    "mode": "senior",
    "topics": ["computer-vision"],
    "question_count": 5
  }' | tee /tmp/rag-dojo-samples/session.json | jq

export SESSION_ID=$(jq -r .id /tmp/rag-dojo-samples/session.json)
```

---

## 5. Démarrer la session (première question générée)

```bash
curl -s -X POST $API/api/interviews/$SESSION_ID/start | tee /tmp/rag-dojo-samples/question.json | jq
```

Sortie attendue (cf. section 4 étape 1) :

```json
{
  "question": "Pourquoi utilise-t-on le max pooling dans un CNN ?",
  "topic": "CNN",
  "skill": "pooling",
  "difficulty": 2,
  "expected_concepts": ["downsampling", "translation invariance", "computational cost", "information loss"],
  "source_chunk_ids": ["chunk_..."]
}
```

---

## 6. Répondre — mauvaise réponse volontaire (pour tester la correction sourcée)

```bash
curl -s -X POST $API/api/interviews/$SESSION_ID/answer \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "Le max pooling sert surtout à réduire la taille de l'\''image et à garder les pixels les plus importants."
  }' | tee /tmp/rag-dojo-samples/evaluation_1.json | jq
```

Sortie attendue (cf. section 4 étape 4) : `score`, `verdict`, `correct_points`, `missing_points`,
`incorrect_points`, `feedback`, `next_question`, `skill_updates`, `citations`. Vérifier en
particulier que `citations[].chunk_id` correspond bien à un chunk du document uploadé.

---

## 7. Répondre à la relance (`next_question` de l'étape précédente)

```bash
curl -s -X POST $API/api/interviews/$SESSION_ID/answer \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "Un average pooling est préférable quand on veut conserver plus d'\''information globale, par exemple en fin de réseau avant une couche de classification."
  }' | tee /tmp/rag-dojo-samples/evaluation_2.json | jq
```

---

## 8. Terminer la session

```bash
curl -s -X POST $API/api/interviews/$SESSION_ID/finish | jq
```

---

## 9. Récupérer le rapport final

```bash
curl -s $API/api/interviews/$SESSION_ID/report | jq
```

Sortie attendue (cf. section 7 "Page de résultats") : score global, score par compétence,
erreurs récurrentes, questions les plus difficiles, sources recommandées, plan de révision.

---

## 10. Vérifier la mémoire de progression (skills)

```bash
curl -s $API/api/users/user_1/skills | jq
```

Doit refléter les `skill_updates` cumulés des tours précédents (ex. `pooling` mis à jour deux fois).

---

## Script bout-en-bout (copier-coller direct)

```bash
#!/usr/bin/env bash
set -euo pipefail
API=http://localhost:8787
TMP=/tmp/rag-dojo-samples
mkdir -p "$TMP"

cat > "$TMP/cnn_notes.md" << 'EOF'
# Pooling layers
Le max pooling sélectionne la valeur maximale dans chaque fenêtre du feature map...
EOF

CORPUS_ID=$(curl -s -X POST $API/api/corpora -H "Content-Type: application/json" \
  -d '{"name":"Préparation entretien ML"}' | jq -r .id)
echo "corpus: $CORPUS_ID"

DOCUMENT_ID=$(curl -s -X POST $API/api/corpora/$CORPUS_ID/documents \
  -F "file=@$TMP/cnn_notes.md;type=text/markdown" | jq -r .id)
echo "document: $DOCUMENT_ID"

curl -s -X POST $API/api/documents/$DOCUMENT_ID/index | jq .status

SESSION_ID=$(curl -s -X POST $API/api/interviews -H "Content-Type: application/json" \
  -d '{"corpus_id":"'"$CORPUS_ID"'","mode":"senior","question_count":3}' | jq -r .id)
echo "session: $SESSION_ID"

curl -s -X POST $API/api/interviews/$SESSION_ID/start | jq

curl -s -X POST $API/api/interviews/$SESSION_ID/answer -H "Content-Type: application/json" \
  -d '{"answer":"Le max pooling réduit la taille de l'\''image."}' | jq

curl -s -X POST $API/api/interviews/$SESSION_ID/finish | jq
curl -s $API/api/interviews/$SESSION_ID/report | jq
```

Sauvegarder ce bloc dans `backend/scripts/e2e-test.sh` (chmod +x) pour le relancer à chaque
étape du MVP (jour 3 à jour 6) sans réécrire les commandes à la main.

---

## 11. Scénario "fiche de poste + CV" (le cas d'usage central)

C'est le scénario le plus important à valider : générer des questions **à partir d'une offre
d'emploi**, personnalisées par rapport au CV du candidat — pour repérer les écarts entre ce que
le poste demande et ce que le candidat maîtrise réellement.

```bash
cat > "$TMP/fiche_poste.md" << 'EOF'
# Offre : Ingénieur ML / RAG

Nous recherchons un ingénieur pour construire des systèmes de recherche augmentée (RAG) en
production.

## Compétences requises
- Conception de pipelines RAG (chunking, embeddings, retrieval, reranking)
- Bases de données vectorielles (Qdrant, Pinecone, Vectorize ou équivalent)
- TypeScript et architectures serverless (Cloudflare Workers ou AWS Lambda)
- Docker et CI/CD
- Bonnes pratiques d'évaluation de systèmes LLM (métriques de retrieval, faithfulness)
EOF

cat > "$TMP/cv.md" << 'EOF'
# CV — Diego

## Expérience
- 2 ans en développement backend TypeScript / Node.js
- Projets personnels avec Docker et déploiement Cloudflare Pages
- Aucune expérience professionnelle avec des bases vectorielles ou des pipelines RAG
- Notions de CI/CD (GitHub Actions basique)
EOF
```

```bash
JOB_CORPUS_ID=$(curl -s -X POST $API/api/corpora -H "Content-Type: application/json" \
  -d '{"name":"Entretien - Ingénieur ML/RAG","description":"Fiche de poste + CV"}' | jq -r .id)

curl -s -X POST $API/api/corpora/$JOB_CORPUS_ID/documents \
  -F "file=@$TMP/fiche_poste.md;type=text/markdown" -F "topic=job-posting" | jq -r .id \
  | xargs -I{} curl -s -X POST $API/api/documents/{}/index | jq .status

curl -s -X POST $API/api/corpora/$JOB_CORPUS_ID/documents \
  -F "file=@$TMP/cv.md;type=text/markdown" -F "topic=cv" | jq -r .id \
  | xargs -I{} curl -s -X POST $API/api/documents/{}/index | jq .status
```

```bash
SESSION_ID=$(curl -s -X POST $API/api/interviews -H "Content-Type: application/json" \
  -d '{"corpus_id":"'"$JOB_CORPUS_ID"'","mode":"recruteur","question_count":5}' | jq -r .id)

curl -s -X POST $API/api/interviews/$SESSION_ID/start | jq
```

Ce qu'il faut vérifier ici précisément :

- la question générée cible une compétence **listée dans la fiche de poste** (ex. "reranking",
  "bases vectorielles") — pas un thème générique ;
- `source_chunk_ids` doit pointer vers la fiche de poste et/ou le CV, pas un autre corpus ;
- une réponse vague côté candidat doit produire un `feedback` qui compare implicitement aux
  attentes du poste (mode `recruteur`, cf. section 2 du plan).
- si `expected_concepts` reprend des termes absents du CV, c'est le signe que le retrieval capte
  bien l'écart poste/candidat — l'essence même du produit.

---

## 12. Scénario "documentation technique"

```bash
cat > "$TMP/docker_notes.md" << 'EOF'
# Docker — notes techniques

## Multi-stage builds
Un build multi-stage permet de séparer l'étape de compilation de l'image finale, réduisant
la taille de l'image en production en n'y copiant que les artefacts nécessaires (ex. le binaire
compilé), sans les outils de build.

## Différence COPY vs ADD
COPY copie des fichiers locaux tels quels. ADD fait la même chose mais sait aussi extraire des
archives et récupérer des URLs distantes — à éviter par défaut car son comportement est moins
prévisible que COPY.
EOF

DOC_CORPUS_ID=$(curl -s -X POST $API/api/corpora -H "Content-Type: application/json" \
  -d '{"name":"Révision Docker"}' | jq -r .id)

curl -s -X POST $API/api/corpora/$DOC_CORPUS_ID/documents \
  -F "file=@$TMP/docker_notes.md;type=text/markdown" | jq -r .id \
  | xargs -I{} curl -s -X POST $API/api/documents/{}/index | jq
```

Bon scénario pour tester le mode `pédagogique` (indices progressifs, explication des erreurs) :

```bash
SESSION_ID=$(curl -s -X POST $API/api/interviews -H "Content-Type: application/json" \
  -d '{"corpus_id":"'"$DOC_CORPUS_ID"'","mode":"pedagogique","question_count":3}' | jq -r .id)
curl -s -X POST $API/api/interviews/$SESSION_ID/start | jq
```

---

## 13. Scénario "dépôt GitHub"

L'API ne prévoit pas encore de route dédiée `/api/corpora/:id/import-github` (V1 se limite à
PDF/Markdown/texte, cf. section 3.A). En attendant cette route, on peut simuler l'ingestion d'un
repo en récupérant quelques fichiers clés via l'API GitHub publique et en les uploadant un par un
comme des documents normaux :

```bash
REPO="cloudflare/workers-sdk"

for path in "README.md" "packages/wrangler/README.md"; do
  filename=$(basename "$path")
  curl -s "https://raw.githubusercontent.com/$REPO/main/$path" -o "$TMP/$filename"

  curl -s -X POST $API/api/corpora/$CORPUS_ID/documents \
    -F "file=@$TMP/$filename;type=text/markdown" \
    -F "topic=github:$REPO" | jq -r .id \
    | xargs -I{} curl -s -X POST $API/api/documents/{}/index | jq .status
done
```

Note pour plus tard : une vraie route d'import GitHub ferait probablement `git archive` ou
l'API Contents de GitHub côté Worker, avec un filtrage par extension (`.md`, `.ts`, pas de
`node_modules`, etc.) avant de repasser par le même pipeline `chunking -> embed -> index`.

---

## 14. Scénario "article / PDF"

```bash
curl -s "https://arxiv.org/pdf/1706.03762" -o "$TMP/attention_is_all_you_need.pdf"

curl -s -X POST $API/api/corpora/$CORPUS_ID/documents \
  -F "file=@$TMP/attention_is_all_you_need.pdf;type=application/pdf" \
  -F "topic=nlp-transformers" | tee "$TMP/pdf_document.json" | jq

curl -s -X POST $API/api/documents/$(jq -r .id "$TMP/pdf_document.json")/index | jq
```

Bon test de robustesse pour `extractText.ts` : un vrai PDF avec mise en page multi-colonnes,
figures et références — plus exigeant que le Markdown propre des autres scénarios.

---

## 15. Tests GET — récapitulatif (lecture / vérification)

Toutes les routes `GET` de l'API (section 8 du plan) rassemblées ici, pour pouvoir les rejouer
d'un coup après un enchaînement POST plutôt que d'aller les rechercher dans chaque scénario.

### `GET /api/corpora` — lister les corpus

```bash
curl -s $API/api/corpora | jq
```

Vérifier que chaque corpus créé plus haut (`$CORPUS_ID`, `$JOB_CORPUS_ID`, `$DOC_CORPUS_ID`)
apparaît bien dans la liste.

### `GET /api/interviews/:id` — détail d'une session

```bash
curl -s $API/api/interviews/$SESSION_ID | jq
```

Sortie attendue (cf. section 6 "InterviewSession") : `id`, `user_id`, `corpus_id`, `mode`,
`status` (`active`/`finished`), `current_difficulty`. Utile pour vérifier que `status` passe bien
à `finished` après l'étape 8 (`/finish`), et que `current_difficulty` évolue entre les tours
(difficulté adaptative, section 5 du plan).

### `GET /api/interviews/:id/report` — rapport final

```bash
curl -s $API/api/interviews/$SESSION_ID/report | jq
```

Déjà vu à l'étape 9 — reste ici pour la vue d'ensemble. Ne devrait renvoyer un rapport complet
qu'après `/finish` ; vérifier le comportement (400 ? rapport partiel ?) si on l'appelle sur une
session encore `active`.

### `GET /api/users/:id/skills` — mémoire de progression

```bash
curl -s $API/api/users/user_1/skills | jq
```

Déjà vu à l'étape 10. À rejouer après **plusieurs** sessions (scénarios 11 à 14) pour vérifier
que les `skills` s'accumulent bien entre corpus différents et ne sont pas remis à zéro à chaque
nouvelle session.

### `GET /api/documents/:id/raw?key=<r2_key>` — relire un fichier uploadé (debug)

```bash
curl -s "$API/api/documents/$DOCUMENT_ID/raw?key=$R2_KEY"
```

Déjà vu à l'étape 2 — implémentée (`routes/documents.ts`), contrairement aux autres GET
ci-dessus qui restent à coder.

### Cas d'erreur GET à couvrir

```bash
# id inexistant -> doit renvoyer 404, pas 500 ni un objet vide silencieux
curl -s -o /dev/null -w "%{http_code}\n" $API/api/interviews/session_inexistant
curl -s -o /dev/null -w "%{http_code}\n" $API/api/users/user_inexistant/skills
```

---

## Notes

- Tant que les routes ne sont pas implémentées, ces appels retournent 404/500 — c'est normal,
  ils servent de contrat cible pendant le dev (TDD manuel).
- `jq` doit être installé (`brew install jq` / `apt install jq`) pour lire les réponses JSON.
- Pour tester avec un vrai PDF au lieu du Markdown, remplacer le `-F "file=@...pdf;type=application/pdf"`.
- Pour tester le LLM isolément avant de brancher `/answer`, voir [testing-llm.md](testing-llm.md).
