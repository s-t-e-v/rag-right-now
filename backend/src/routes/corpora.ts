import { Hono } from "hono";
import type { Bindings } from "../index";

// POST /  -> créer un corpus
// GET  /  -> lister les corpus
// POST /:id/documents -> upload d'un document (cf. services/ingestion)
const app = new Hono<{ Bindings: Bindings }>();

export default app;
