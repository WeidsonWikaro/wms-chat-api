/** Modelo de embedding só texto (Gemini API). */
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Limite de entrada em tokens do modelo de embedding (documentação Google).
 * Usado para calcular o tamanho máximo de chunk (ex.: 80% deste valor).
 */
export const GEMINI_EMBEDDING_001_MAX_INPUT_TOKENS = 2048;

/** Proporção do limite do modelo usada como teto por chunk (margem de segurança). */
export const RAG_CHUNK_TOKEN_RATIO = 0.8;

/** Sobreposição entre chunks consecutivos, como fração do tamanho máximo do chunk. */
export const RAG_OVERLAP_FRACTION_OF_CHUNK = 0.1;

/**
 * Chunks com menos tokens que este valor são fundidos ao vizinho quando couber
 * no teto (evita fragmentos sem contexto após divisão por cabeçalhos).
 */
export const RAG_MIN_CHUNK_TOKENS = 96;

/** Quantidade de trechos devolvidos na busca semântica (tool RAG). */
export const RAG_DEFAULT_TOP_K = 5;

export function getRagChunkMaxTokens(): number {
  return Math.floor(
    GEMINI_EMBEDDING_001_MAX_INPUT_TOKENS * RAG_CHUNK_TOKEN_RATIO,
  );
}

export function getRagOverlapTokenBudget(): number {
  const chunkMax = getRagChunkMaxTokens();
  return Math.max(64, Math.floor(chunkMax * RAG_OVERLAP_FRACTION_OF_CHUNK));
}

export function getRagMinChunkTokens(): number {
  return RAG_MIN_CHUNK_TOKENS;
}
