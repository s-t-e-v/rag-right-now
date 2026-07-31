import { Hono } from "hono";
import type { Bindings } from "../index";

// GET /:id/skills -> SkillProgress agrégé (mémoire de progression)
const app = new Hono<{ Bindings: Bindings }>();

export default app;
