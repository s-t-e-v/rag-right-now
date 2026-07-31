// Petites fonctions d'accès D1 (pas d'ORM pour aller vite - requêtes préparées directes)
export function getDb(binding: D1Database) {
  return binding;
}
