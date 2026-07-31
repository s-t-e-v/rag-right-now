import { Hono } from "hono";
import type { Bindings } from "../index";

const app = new Hono<{ Bindings: Bindings }>();

// POST / -> créer un corpus
// TODO: persister en D1 (table corpora) au lieu de juste échoer l'id généré
app.post("/", async (c) => {
  const body = await c.req.json<{ name: string; description?: string }>();
  if (!body?.name) return c.json({ error: "'name' requis" }, 400);

  const id = `corpus_${crypto.randomUUID()}`;
  return c.json({ id, name: body.name, description: body.description ?? null });
});

// GET / -> lister les corpus
// TODO: lire depuis D1
app.get("/", async (c) => {
  return c.json([]);
});

// POST /:id/documents -> upload d'un document (multipart/form-data, champ "file")
// Stocke le fichier brut dans R2 ; l'extraction/chunking/embedding se fait ensuite
// via POST /api/documents/:id/index (cf. services/ingestion, services/embeddings).
app.post("/:id/documents", async (c) => {
  const corpusId = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    return c.json({ error: "champ 'file' manquant (envoyer en multipart/form-data)" }, 400);
  }

  const topic = typeof body["topic"] === "string" ? body["topic"] : undefined;
  const documentId = `doc_${crypto.randomUUID()}`;
  const r2Key = `${corpusId}/${documentId}-${file.name}`;

  await c.env.DOCUMENTS.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  // TODO: insérer la ligne document en D1 (status: "uploaded", en attente de /index)
  return c.json({
    id: documentId,
    corpus_id: corpusId,
    filename: file.name,
    source_type: file.type || "application/octet-stream",
    size: file.size,
    topic: topic ?? null,
    r2_key: r2Key,
    status: "uploaded",
  });
});

export default app;
