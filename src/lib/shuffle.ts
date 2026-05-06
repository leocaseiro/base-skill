export const shuffleArray = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

export const shuffleAvoidingOrder = <T>(
  arr: T[],
  correctOrder: T[],
  maxAttempts = 10,
): T[] => {
  if (arr.length <= 1) return [...arr];
  if (arr.length !== correctOrder.length) return shuffleArray(arr);

  const isCorrectOrder = (candidate: T[]) =>
    candidate.every((v, i) => v === correctOrder[i]);

  let result = shuffleArray(arr);
  let attempts = 0;
  while (isCorrectOrder(result) && attempts < maxAttempts) {
    result = shuffleArray(arr);
    attempts++;
  }
  return result;
};
