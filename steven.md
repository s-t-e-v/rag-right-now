# 🚀 One-Week RAG Project Ideas

## Goal

Build a **portfolio-quality RAG project** in approximately **one week** (2–3 people) that:

- Demonstrates real engineering skills
- Looks impressive during interviews
- Can be deployed publicly
- Is fun to demo
- Goes beyond "Chat with PDF"

---

# Shared Technical Stack

## Frontend

- Next.js
- TailwindCSS
- Deployed on Cloudflare Pages

## Backend

- FastAPI
- Python

## Retrieval

- ChromaDB or Qdrant
- Sentence Transformers (BGE Small / MiniLM)

## LLM

- HuggingFace Inference API (free)
- Groq (free)
- OpenRouter (free models)

## Deployment

Frontend:
- Cloudflare Pages

Backend:
- Railway / Render

Vector Database:
- Qdrant Cloud (free tier)

---

# Option 1 — GitBrain

> **Ask any GitHub repository anything.**

## Concept

Paste a GitHub repository URL.

The system:

- clones the repository
- indexes the code
- indexes documentation
- chunks intelligently
- generates embeddings
- answers questions with citations

Example:

```
https://github.com/langchain-ai/langchain
```

Questions:

- Where is authentication implemented?
- Explain the architecture.
- Which files interact with PostgreSQL?
- How are API routes organized?

---

## Features

- GitHub repository ingestion
- Smart code chunking
- Semantic search
- Hybrid search (optional)
- Answer generation
- File citations
- Confidence score
- Repository statistics

Possible bonus:

- Repository architecture visualization
- Mermaid diagrams
- Dependency graph

---

## Why recruiters would like it

Instead of a toy chatbot, this looks like a real developer tool.

It demonstrates:

- RAG
- Backend engineering
- Code parsing
- Embeddings
- Search
- API design
- Deployment

---

## Difficulty

⭐⭐⭐☆☆

---

## WOW factor

⭐⭐⭐⭐⭐

---

# Option 2 — Research Assistant

> **Perplexity for scientific papers**

## Concept

Upload multiple PDFs.

Ask questions like:

- Compare these papers.
- Which paper achieved the best results?
- What are the limitations?
- Which papers disagree?

The answer always contains citations.

---

## Features

- PDF ingestion
- OCR (optional)
- Semantic search
- Citation-aware generation
- Clickable references
- Confidence score

Possible bonus:

- Topic clustering
- Timeline
- Paper summaries
- Related work suggestions

---

## Why recruiters would like it

Shows a mature implementation of RAG with citations.

Looks like a professional AI product.

---

## Difficulty

⭐⭐⭐☆☆

---

## WOW factor

⭐⭐⭐⭐☆

---

# Option 3 — Infrastructure RAG

> **Understand DevOps projects instantly**

## Concept

Index infrastructure repositories containing:

- Kubernetes
- Terraform
- Docker
- Helm
- Ansible
- CI/CD
- Markdown documentation

Ask questions such as:

- Where is Redis deployed?
- Which services expose port 443?
- Show every Kubernetes Secret.
- Explain the deployment architecture.

---

## Features

- Infrastructure-aware chunking
- Semantic search
- Configuration search
- Multi-file reasoning
- Architecture generation

Possible bonus:

- Mermaid architecture graph
- Kubernetes topology
- Dependency visualization

---

## Why recruiters would like it

Very few portfolio projects target DevOps documentation.

Shows knowledge of:

- Kubernetes
- Infrastructure
- Cloud
- RAG
- Search systems

---

## Difficulty

⭐⭐⭐⭐☆

---

## WOW factor

⭐⭐⭐⭐⭐

---

# Suggested Timeline

## Day 1

- Project setup
- Document ingestion
- Chunking
- Embeddings

---

## Day 2

- Vector database
- Search pipeline

---

## Day 3

- LLM integration
- Prompt engineering
- Citations

---

## Day 4

- Backend API
- Frontend UI

---

## Day 5

- Deployment

---

## Day 6

- Polish
- Testing
- Performance improvements

---

## Day 7

- README
- Demo video
- Documentation

---

# Nice Features (Independent of Project)

These features make the project feel professional:

- ✅ Streaming answers
- ✅ Source citations
- ✅ Confidence score
- ✅ Search latency
- ✅ Chunk inspector
- ✅ Retrieved context viewer
- ✅ Architecture visualization
- ✅ Hybrid search toggle
- ✅ Retrieval statistics

---

# Comparison

| Project | Difficulty | Portfolio | Originality | Demo Effect |
|----------|-----------|-----------|-------------|-------------|
| GitBrain | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Research Assistant | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ | ⭐⭐⭐☆☆ | ⭐⭐⭐⭐☆ |
| Infrastructure RAG | ⭐⭐⭐⭐☆ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

# Personal Recommendation

## 🥇 GitBrain

Best balance between:

- achievable in one week
- technically interesting
- impressive to recruiters
- reusable in future interviews

It demonstrates much more than simply using an LLM—it showcases a complete Retrieval-Augmented Generation pipeline applied to a real-world developer problem.

---

# Stretch Goals (if time allows)

- Hybrid Retrieval (BM25 + Embeddings)
- Re-ranking (Cross Encoder)
- Incremental indexing
- Repository map
- Explain retrieval decisions
- Benchmark page (Recall@K, latency, indexing time)
- User authentication
- History of indexed repositories
- Dark mode 🌙

# RAG Dojo

## 1. Objectif

Créer une plateforme d’entraînement technique qui génère des entretiens personnalisés à partir de documents fournis par l’utilisateur.

L’utilisateur peut importer :

- des notes de cours ;
- une documentation technique ;
- un dépôt GitHub ;
- une fiche de poste ;
- son CV ;
- des articles ou PDF.

Le système utilise ces sources pour :

1. générer des questions ;
2. analyser les réponses ;
3. fournir une correction sourcée ;
4. poser une question de relance ;
5. suivre les points forts et les lacunes.

---

## 2. Parcours utilisateur

```text
Création d’une session
        ↓
Sélection d’un corpus
        ↓
Choix du mode d’entretien
        ↓
Question générée
        ↓
Réponse du candidat
        ↓
Recherche des sources pertinentes
        ↓
Évaluation structurée
        ↓
Feedback + citations
        ↓
Question suivante adaptée
        ↓
Rapport final
```

### Modes d’entretien

#### Mode pédagogique

Le système :

- donne des indices ;
- explique les erreurs ;
- propose des ressources ;
- augmente progressivement la difficulté.

#### Mode recruteur

Le système :

- pose des questions courtes ;
- demande des exemples concrets ;
- évalue la clarté et la pertinence ;
- simule un entretien professionnel.

#### Mode senior exigeant

Le système :

- cherche les imprécisions ;
- pose des edge cases ;
- demande des compromis techniques ;
- challenge les choix d’architecture.

---

## 3. Architecture fonctionnelle

```text
Frontend
   │
   ▼
API / Cloudflare Worker
   │
   ├── Gestion des documents
   ├── Pipeline d’indexation
   ├── Moteur de retrieval
   ├── Gestion des sessions
   ├── Appels LLM
   └── Calcul de progression
```

### Composants principaux

#### A. Document ingestion

Responsabilités :

- upload des fichiers ;
- extraction du texte ;
- nettoyage ;
- détection du type de contenu ;
- ajout de métadonnées.

Métadonnées possibles :

```json
{
  "document_id": "doc_123",
  "filename": "cnn_notes.pdf",
  "source_type": "pdf",
  "topic": "computer-vision",
  "page": 12,
  "section": "Pooling layers"
}
```

Formats pour la V1 :

- PDF ;
- Markdown ;
- texte ;
- éventuellement dépôt GitHub ou ZIP.

Pour tenir en une semaine, commencer uniquement avec **PDF, Markdown et texte**.

#### B. Chunking

Chaque document est découpé en morceaux.

```json
{
  "chunk_id": "chunk_42",
  "content": "Max pooling selects the maximum value...",
  "document_id": "doc_123",
  "page": 12,
  "section": "Pooling layers",
  "token_count": 310
}
```

Configuration de départ :

- 300 à 500 tokens par chunk ;
- overlap de 50 à 80 tokens ;
- conservation des titres et sections ;
- pas de chunk coupé au milieu d’un paragraphe.

#### C. Embeddings et indexation

```text
Chunk texte
    ↓
Modèle d’embedding
    ↓
Vecteur
    ↓
Vector database
```

Stockage possible :

- Cloudflare Vectorize pour la démo ;
- Qdrant ou Chroma en local ;
- PostgreSQL avec pgvector pour une stack plus classique.

#### D. Retrieval

Lorsque le candidat répond, le système recherche les passages nécessaires pour l’évaluer.

```text
Question actuelle
+
Réponse du candidat
+
Compétence évaluée
        ↓
Recherche vectorielle
        ↓
Top 10 chunks
        ↓
Filtrage ou reranking
        ↓
Top 3 à 5 chunks
```

Le retrieval peut utiliser :

- la question posée ;
- la réponse du candidat ;
- le thème de la session ;
- le niveau de difficulté ;
- les erreurs précédentes.

---

## 4. Pipeline principal du RAG

### Étape 1 : génération de la question

Entrées :

- thème choisi ;
- niveau estimé ;
- passages récupérés ;
- historique des questions ;
- erreurs précédentes.

Sortie structurée :

```json
{
  "question": "Pourquoi utilise-t-on le max pooling dans un CNN ?",
  "topic": "CNN",
  "skill": "pooling",
  "difficulty": 2,
  "expected_concepts": [
    "downsampling",
    "translation invariance",
    "computational cost",
    "information loss"
  ],
  "source_chunk_ids": [
    "chunk_42",
    "chunk_87"
  ]
}
```

### Étape 2 : réponse du candidat

```text
Le max pooling sert surtout à réduire la taille de l’image
et à garder les pixels les plus importants.
```

### Étape 3 : retrieval pour l’évaluation

Le système cherche les passages liés à :

- max pooling ;
- réduction de dimension ;
- invariance ;
- perte d’information ;
- différences avec average pooling.

### Étape 4 : évaluation par le LLM

Le LLM reçoit :

- la question ;
- la réponse ;
- les concepts attendus ;
- les chunks récupérés ;
- la grille d’évaluation.

Il retourne un seul objet JSON.

```json
{
  "score": 0.65,
  "verdict": "partially_correct",
  "correct_points": [
    "La réduction de la dimension spatiale est correctement mentionnée."
  ],
  "missing_points": [
    "La réduction du coût de calcul.",
    "La robustesse aux petites translations.",
    "La perte potentielle d’information."
  ],
  "incorrect_points": [
    "Le max pooling ne sélectionne pas nécessairement les pixels les plus importants au sens sémantique."
  ],
  "feedback": "Ta réponse identifie correctement le downsampling...",
  "next_question": "Dans quels cas préférerais-tu un average pooling ?",
  "skill_updates": [
    {
      "skill": "pooling",
      "delta": 0.1
    }
  ],
  "citations": [
    {
      "chunk_id": "chunk_42",
      "reason": "Définition du max pooling"
    }
  ]
}
```

L’idée importante est de faire **un seul appel LLM** pour :

- noter ;
- corriger ;
- générer la relance ;
- mettre à jour les compétences.

---

## 5. Mémoire et adaptation

### Mémoire de session

Elle contient :

- les dernières questions ;
- les dernières réponses ;
- le sujet actuel ;
- les erreurs récentes ;
- le niveau de difficulté.

Elle sert à éviter les répétitions et à poser des relances cohérentes.

### Mémoire de progression

```json
{
  "user_id": "user_1",
  "skills": {
    "cnn": 0.72,
    "pooling": 0.48,
    "loss-functions": 0.81,
    "rag": 0.35,
    "docker": 0.68
  }
}
```

Une compétence faible doit apparaître plus souvent dans les prochaines sessions.

---

## 6. Modèle de données

### User

```json
{
  "id": "user_1",
  "name": "Diego",
  "created_at": "2026-07-31"
}
```

### Corpus

```json
{
  "id": "corpus_1",
  "name": "Préparation entretien ML",
  "description": "Notes CNN, MLOps et fiche de poste"
}
```

### Document

```json
{
  "id": "doc_1",
  "corpus_id": "corpus_1",
  "filename": "cnn_notes.pdf",
  "status": "indexed"
}
```

### Chunk

```json
{
  "id": "chunk_1",
  "document_id": "doc_1",
  "content": "...",
  "page": 4,
  "embedding_id": "vector_1"
}
```

### InterviewSession

```json
{
  "id": "session_1",
  "user_id": "user_1",
  "corpus_id": "corpus_1",
  "mode": "senior",
  "status": "active",
  "current_difficulty": 3
}
```

### InterviewTurn

```json
{
  "id": "turn_1",
  "session_id": "session_1",
  "question": "...",
  "answer": "...",
  "score": 0.65,
  "feedback": "...",
  "citations": []
}
```

### SkillProgress

```json
{
  "user_id": "user_1",
  "skill": "pooling",
  "score": 0.48,
  "attempts": 5,
  "last_updated": "2026-07-31"
}
```

---

## 7. Pages frontend

### Page d’accueil

- présentation du projet ;
- bouton « Commencer un entretien » ;
- accès aux corpus existants.

### Page Corpus

- upload de fichiers ;
- état de l’indexation ;
- liste des documents ;
- nombre de chunks ;
- suppression d’un document.

### Page de configuration

- sélection du corpus ;
- choix des thèmes ;
- mode d’entretien ;
- niveau ;
- nombre de questions.

### Page d’entretien

```text
┌──────────────────────────────────────┐
│ Question 3/10          Difficulté 3  │
├──────────────────────────────────────┤
│ Pourquoi utiliser un reranker après │
│ une recherche vectorielle ?         │
│                                      │
│ [ Zone de réponse ]                  │
│                                      │
│                 [ Envoyer ]          │
├──────────────────────────────────────┤
│ Score : 7/10                         │
│ Points corrects                      │
│ Points manquants                     │
│ Sources utilisées                    │
└──────────────────────────────────────┘
```

### Page de résultats

- score global ;
- score par compétence ;
- erreurs récurrentes ;
- questions les plus difficiles ;
- sources recommandées ;
- plan de révision.

---

## 8. API proposée

```text
POST   /api/corpora
GET    /api/corpora
POST   /api/corpora/:id/documents
POST   /api/documents/:id/index

POST   /api/interviews
GET    /api/interviews/:id
POST   /api/interviews/:id/start
POST   /api/interviews/:id/answer
POST   /api/interviews/:id/finish

GET    /api/interviews/:id/report
GET    /api/users/:id/skills
```

La route centrale sera :

```text
POST /api/interviews/:id/answer
```

Entrée :

```json
{
  "answer": "Un reranker permet de..."
}
```

Sortie :

```json
{
  "evaluation": {},
  "next_question": {},
  "skill_updates": []
}
```

---

## 9. Stack recommandée

### Frontend

- React ;
- Vite ou Next.js ;
- Tailwind CSS ;
- Cloudflare Pages.

### Backend

- Cloudflare Workers ;
- TypeScript ;
- Hono pour l’API.

### IA

- Workers AI pour la démo ;
- Ollama ou mocks en développement ;
- modèle d’embedding Cloudflare ;
- petit modèle instruct pour l’évaluation.

### Données

- D1 pour les sessions et les scores ;
- R2 pour les fichiers ;
- Vectorize pour les embeddings ;
- éventuellement KV pour le cache.

```text
Cloudflare Pages
       │
       ▼
Cloudflare Worker / Hono
       │
       ├── Workers AI
       ├── Vectorize
       ├── D1
       ├── R2
       └── KV
```

---

## 10. Répartition entre deux personnes

### Personne 1 : RAG et backend

- ingestion ;
- chunking ;
- embeddings ;
- Vectorize ;
- retrieval ;
- prompt d’évaluation ;
- réponses JSON structurées ;
- métriques du retrieval.

### Personne 2 : frontend et produit

- interface d’upload ;
- création des sessions ;
- écran d’entretien ;
- citations ;
- dashboard ;
- intégration API ;
- déploiement Cloudflare.

### Travail commun

- définition du schéma JSON ;
- création du benchmark ;
- tests end-to-end ;
- README ;
- vidéo de démonstration.

---

## 11. MVP d’une semaine

### Jour 1 — fondations

- repo et monorepo ;
- frontend minimal ;
- API Hono ;
- schéma D1 ;
- upload d’un fichier texte ou Markdown.

### Jour 2 — indexation

- extraction ;
- chunking ;
- embeddings ;
- stockage dans Vectorize ;
- test de recherche sémantique.

### Jour 3 — premier RAG

- génération d’une question ;
- retrieval des sources ;
- réponse du candidat ;
- évaluation JSON.

### Jour 4 — interface d’entretien

- affichage des questions ;
- saisie des réponses ;
- feedback ;
- citations ;
- enchaînement des tours.

### Jour 5 — adaptation

- scores par compétence ;
- choix de la prochaine question ;
- difficulté adaptative ;
- rapport final.

### Jour 6 — qualité

- benchmark de 15 à 30 questions ;
- tests du retrieval ;
- gestion des erreurs ;
- limitation des tokens ;
- cache.

### Jour 7 — démo

- déploiement ;
- design final ;
- README ;
- schéma d’architecture ;
- courte vidéo.

---

## 12. Ce qu’il faut absolument montrer dans la démo

La démo doit illustrer clairement le rôle du RAG :

1. import d’un document ;
2. génération d’une question provenant du document ;
3. mauvaise réponse volontaire ;
4. correction fondée sur des passages précis ;
5. affichage des citations ;
6. question suivante adaptée à l’erreur ;
7. mise à jour du score de compétence.

> **RAG Dojo ne se contente pas de retrouver une réponse : il utilise les sources pour générer, évaluer et adapter un entretien technique personnalisé.**

Frontend : React + TypeScript
Backend  : Cloudflare Worker + TypeScript + Hono
RAG      : TypeScript
Base     : D1 + Vectorize + R2
LLM      : Workers AI


React frontend
      ↓ requête HTTP
Hono API sur Cloudflare Workers
      ↓
Pipeline RAG
      ├── chunking
      ├── embeddings
      ├── Vectorize
      ├── retrieval
      ├── prompt
      └── Workers AI