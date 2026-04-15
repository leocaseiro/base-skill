export const suggestBookmarkName = (
  gameTitle: string,
  existing: readonly string[],
): string => {
  const base = `My ${gameTitle}`;
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} #${n}`)) n++;
  return `${base} #${n}`;
};
