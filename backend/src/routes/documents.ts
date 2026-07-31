import { Hono } from "hono";
import type { Bindings } from "../index";

// POST /:id/index -> lance extractText -> chunking -> embed -> stockage Vectorize
const app = new Hono<{ Bindings: Bindings }>();

export default app;
