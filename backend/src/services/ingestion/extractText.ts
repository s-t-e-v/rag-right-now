// Extraction du texte brut à partir d'un fichier (PDF/Markdown/texte) + détection du type
// PDF: envisager "unpdf" ou "pdf-parse" (compatibles Workers) ; Markdown/texte: lecture directe
export async function extractText(file: ArrayBuffer, sourceType: string): Promise<string> {
  throw new Error("TODO");
}
