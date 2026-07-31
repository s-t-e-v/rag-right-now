import { Hono } from "hono";
import corpora from "./routes/corpora";
import documents from "./routes/documents";
import interviews from "./routes/interviews";
import users from "./routes/users";

export type Bindings = {
  AI: Ai;
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  VECTORIZE: VectorizeIndex;
  CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// TODO: middleware CORS + auth (cf. middleware/)
app.route("/api/corpora", corpora);
app.route("/api/documents", documents);
app.route("/api/interviews", interviews);
app.route("/api/users", users);

export default app;
