// Génère les embeddings via Workers AI (@cf/baai/bge-base-en-v1.5 ou équivalent) puis upsert dans Vectorize
import type { Chunk } from "../ingestion/chunking";

export async function embedAndStore(ai: Ai, vectorize: VectorizeIndex, chunks: Chunk[]): Promise<void> {
  throw new Error("TODO");
}
