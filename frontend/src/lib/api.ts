// Client fetch minimal vers le Worker Hono (base URL via import.meta.env.VITE_API_URL)
// cf. section 8 (API proposée) du plan pour la liste des routes
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  throw new Error("TODO");
}
