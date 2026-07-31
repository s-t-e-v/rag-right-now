import { z } from "zod";

// Schémas Zod partagés frontend/backend - source de vérité unique pour les objets JSON
// échangés via l'API (cf. section 4 et 6 du plan). À définir ensemble avant de coder les routes.

// export const InterviewModeSchema = z.enum(["pedagogique", "recruteur", "senior"]);

// export const GeneratedQuestionSchema = z.object({
//   question: z.string(),
//   topic: z.string(),
//   skill: z.string(),
//   difficulty: z.number(),
//   expected_concepts: z.array(z.string()),
//   source_chunk_ids: z.array(z.string()),
// });

// export const AnswerEvaluationSchema = z.object({
//   score: z.number(),
//   verdict: z.enum(["correct", "partially_correct", "incorrect"]),
//   correct_points: z.array(z.string()),
//   missing_points: z.array(z.string()),
//   incorrect_points: z.array(z.string()),
//   feedback: z.string(),
//   next_question: z.string(),
//   skill_updates: z.array(z.object({ skill: z.string(), delta: z.number() })),
//   citations: z.array(z.object({ chunk_id: z.string(), reason: z.string() })),
// });
