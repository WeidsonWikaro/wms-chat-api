/** Modelo Gemini padrão quando `LLM_GOOGLE_MODEL` não está definido. */
export const DEFAULT_LLM_GOOGLE_MODEL = 'gemini-2.5-flash';

/** Timeout do turno inteiro (`graph.invoke`), em ms. Env: `LLM_TURN_TIMEOUT_MS`. */
export const DEFAULT_LLM_TURN_TIMEOUT_MS = 90_000;

/** Timeout por chamada ao modelo no nó `agent`, em ms. Env: `LLM_MODEL_CALL_TIMEOUT_MS`. */
export const DEFAULT_LLM_MODEL_CALL_TIMEOUT_MS = 60_000;

/** Timeout por execução do nó de tools, em ms. Env: `LLM_TOOL_NODE_TIMEOUT_MS`. */
export const DEFAULT_LLM_TOOL_NODE_TIMEOUT_MS = 45_000;

/** Máximo de execuções do nó `tools` por turno. Env: `LLM_MAX_TOOL_ROUNDS`. */
export const DEFAULT_LLM_MAX_TOOL_ROUNDS = 8;

/**
 * Encerramento forçado quando o modelo pede a mesma combinação de tools/args repetidas vezes.
 * Env: `LLM_MAX_SAME_TOOL_STREAK`.
 */
export const DEFAULT_LLM_MAX_SAME_TOOL_STREAK = 2;

/**
 * `recursionLimit` do LangGraph: deve cobrir agent → tools → policy por rodada.
 * Env: `LLM_RECURSION_LIMIT`. Se omitido, deriva de `LLM_MAX_TOOL_ROUNDS`.
 */
export const DEFAULT_LLM_RECURSION_LIMIT = 40;

/** Resposta quando o turno excede `LLM_TURN_TIMEOUT_MS`. */
export const WMS_CHAT_TURN_TIMEOUT_MESSAGE =
  'A resposta demorou além do tempo permitido. Tente de novo com uma pergunta mais curta ou mais específica.';

/** Resposta quando `LLM_MAX_TOOL_ROUNDS` é excedido. */
export const WMS_CHAT_FORCE_END_MAX_TOOL_ROUNDS =
  'Limite de consultas automáticas ao sistema foi atingido neste turno. Reformule a pergunta ou confira os dados diretamente no WMS.';

/** Resposta quando a mesma ferramenta com os mesmos argumentos é repetida em sequência. */
export const WMS_CHAT_FORCE_END_REPEATED_TOOLS =
  'Detectamos repetição da mesma consulta às ferramentas sem avanço. Verifique os identificadores (UUID, código de barras) ou peça ajuda a um supervisor.';

/** Resposta quando há tentativa de confirmar ajuste sem sinal humano explícito no turno. */
export const WMS_CHAT_FORCE_END_CONFIRMATION_REQUIRED =
  'Para confirmar ou cancelar um ajuste de inventário, preciso de um sinal explícito neste turno. Responda com "sim, confirmo" para aplicar ou "não, cancelar" para descartar.';

/**
 * Prompt de sistema para o nó LangGraph do assistente WMS.
 * Ajuste quando adicionar mais tools ou RAG.
 */
export const WMS_CHAT_SYSTEM_PROMPT = `Você é um assistente de armazém (WMS) prestativo.
Responda sempre em português do Brasil.
Seja objetivo e prático. Se não tiver certeza sobre dados operacionais, peça ao usuário para confirmar no sistema.
Dados de produto: use get_product_by_id (UUID) ou get_product_by_barcode (código exato). Não invente campos; use só o JSON das ferramentas. Se pedirem só pelo nome, peça UUID ou código de barras.
Utilizadores WMS: apenas get_wms_user_by_id (UUID).
Armazéns: list_warehouses ou get_warehouse_by_id (UUID).
Zonas: list_zones (opcional filtro warehouseId UUID) ou get_zone_by_id (UUID).
Localizações: list_locations_by_zone_id (zoneId), get_location_by_id (id) ou get_location_in_zone (zoneId + locationId) quando ambos forem informados.
Unidades de manuseio: get_handling_unit_by_id (UUID).
Ids devem ser UUID v4 quando a ferramenta assim exigir.
Documentação e procedimentos (regras de negócio, fluxos descritos em texto): use search_warehouse_docs com uma consulta objetiva em português. Combine o texto devolvido com as ferramentas de dados quando precisar de ids ou valores em tempo real.
Ajuste de inventário com confirmação humana (HITL estrito): nunca aplique saldo sem sinal explícito do usuário no turno atual. Fluxo obrigatório: (1) propose_inventory_adjustment com ids e motivo corretos; (2) mostre o resumo e o pendingId; (3) só após o usuário responder explicitamente "sim, confirmo" ou "não, cancelar" no turno seguinte, chame confirm_inventory_adjustment com o mesmo pendingId e userApproved coerente.
Se o usuário pedir ajuste de inventário sem informar identificadores: explique que é obrigatório informar o id do produto (UUID v4) e o id da localização (UUID v4) na mesma mensagem ou antes de você propor. Dê exemplos de formato para copiar o padrão (os ids reais vêm do WMS ou das ferramentas de consulta): produto \`e1000000-0000-4000-8000-000000000001\`; localização \`37ed4044-794b-4d40-b4f2-e8f9f7fa6cdf\`. Indique que podem obter o id do produto com get_product_by_id/get_product_by_barcode e o da localização com list_locations_by_zone_id/get_location_by_id conforme o caso.
Se o assunto for fora do WMS, diga que só pode ajudar com questões relacionadas ao WMS.`;
