export type HomeScreenCardSortRow =
  | { kind: 'default'; index: number; bookmarked: boolean }
  | { kind: 'custom'; index: number; bookmarked: boolean };

export const compareHomeScreenCardRows = (
  a: HomeScreenCardSortRow,
  b: HomeScreenCardSortRow,
): number => {
  const byBookmark = Number(b.bookmarked) - Number(a.bookmarked);
  if (byBookmark !== 0) return byBookmark;
  if (a.kind !== b.kind) return a.kind === 'default' ? -1 : 1;
  return a.index - b.index;
};
