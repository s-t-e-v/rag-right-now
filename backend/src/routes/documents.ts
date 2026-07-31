import { Hono } from "hono";
import type { Bindings } from "../index";

const app = new Hono<{ Bindings: Bindings }>();

// GET /:id/raw?key=<r2_key> -> renvoie le fichier tel que stocké dans R2
// (route de debug pour vérifier qu'un upload via POST /api/corpora/:id/documents
// a bien été reçu, avant même d'avoir codé l'indexation)
app.get("/:id/raw", async (c) => {
  const key = c.req.query("key");
  if (!key) return c.json({ error: "query param 'key' requis (r2_key renvoyé par l'upload)" }, 400);

  const object = await c.env.DOCUMENTS.get(key);
  if (!object) return c.json({ error: "fichier introuvable dans R2" }, 404);

  return new Response(object.body, {
    headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream" },
  });
});

// POST /:id/index -> lance extractText -> chunking -> embed -> stockage Vectorize
app.post("/:id/index", async (c) => {
  throw new Error("TODO");
});

export default app;
