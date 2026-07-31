// Découpage en chunks de 300-500 tokens, overlap 50-80 tokens, sans couper un paragraphe
// cf. section 3.B du plan pour le format de sortie { chunk_id, content, document_id, page, section, token_count }
export type Chunk = {
  chunkId: string;
  content: string;
  documentId: string;
  page?: number;
  section?: string;
  tokenCount: number;
};

export function chunkText(text: string, documentId: string): Chunk[] {
  throw new Error("TODO");
}
