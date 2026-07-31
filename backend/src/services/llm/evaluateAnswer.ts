// Étape 4 du pipeline : UN SEUL appel LLM qui note, corrige, relance et met à jour les compétences
// cf. section 4 du plan pour le schéma JSON de sortie complet (score, verdict, correct/missing/incorrect_points,
// feedback, next_question, skill_updates, citations)
export async function evaluateAnswer(ai: Ai, /* params */) {
  throw new Error("TODO");
}
