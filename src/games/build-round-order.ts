/**
 * Build play order for config `rounds` indices `0..length-1`.
 * When `roundsInOrder` is true, order is sequential. Otherwise indices are shuffled (Fisher–Yates).
 */
export function buildRoundOrder(
  length: number,
  roundsInOrder: boolean,
): number[] {
  if (length <= 0) return [];
  const order = Array.from({ length }, (_, i) => i);
  if (roundsInOrder || length <= 1) return order;
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}
