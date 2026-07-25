// Helpers de posicionamento fracionário para ordenar cards e colunas do board.
// Convenção: menor posição = mais ao topo/esquerda. Ordenar sempre ASC.

export const POSITION_STEP = 1000;

/**
 * Calcula uma posição entre `before` e `after`.
 * - Sem vizinhos: POSITION_STEP.
 * - Só `before` (fim da lista): before + STEP.
 * - Só `after` (início da lista): after - STEP.
 * - Ambos: ponto médio.
 */
export function positionBetween(
  before: number | null | undefined,
  after: number | null | undefined
): number {
  const hasBefore = typeof before === "number" && Number.isFinite(before);
  const hasAfter = typeof after === "number" && Number.isFinite(after);

  if (hasBefore && hasAfter) {
    return (before! + after!) / 2;
  }
  if (hasBefore) {
    return before! + POSITION_STEP;
  }
  if (hasAfter) {
    return after! - POSITION_STEP;
  }
  return POSITION_STEP;
}

/**
 * Distância mínima segura entre posições antes de precisar rebalancear.
 * Floats perdem precisão após muitas divisões pela metade.
 */
export const MIN_POSITION_GAP = 0.0001;

export function needsRebalance(before: number | null, after: number | null): boolean {
  if (before === null || after === null) return false;
  return Math.abs(after - before) < MIN_POSITION_GAP;
}

/** Reindexa uma lista ordenada em múltiplos de POSITION_STEP. */
export function normalizedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, index) => (index + 1) * POSITION_STEP);
}
