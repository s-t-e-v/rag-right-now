import { Hono } from "hono";
import type { Bindings } from "../index";

// POST /            -> créer une InterviewSession
// GET  /:id          -> détail session
// POST /:id/start     -> première question (generateQuestion)
// POST /:id/answer    -> route centrale : retrieval + evaluateAnswer -> { evaluation, next_question, skill_updates }
// POST /:id/finish    -> clôture la session
// GET  /:id/report    -> rapport final (scores, lacunes, plan de révision)
const app = new Hono<{ Bindings: Bindings }>();

export default app;
