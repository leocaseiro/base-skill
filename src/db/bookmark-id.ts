export type BookmarkTargetType = 'game' | 'customGame';

export type BookmarkTarget = {
  profileId: string;
  targetType: BookmarkTargetType;
  targetId: string;
};

export const bookmarkId = (
  profileId: string,
  targetType: BookmarkTargetType,
  targetId: string,
): string => `${profileId}:${targetType}:${targetId}`;

const TARGET_TYPES: ReadonlySet<BookmarkTargetType> = new Set([
  'game',
  'customGame',
]);

export const parseBookmarkId = (id: string): BookmarkTarget | null => {
  const firstColon = id.indexOf(':');
  if (firstColon === -1) return null;
  const profileId = id.slice(0, firstColon);
  const rest = id.slice(firstColon + 1);
  const secondColon = rest.indexOf(':');
  if (secondColon === -1) return null;
  const targetType = rest.slice(0, secondColon);
  const targetId = rest.slice(secondColon + 1);
  if (!TARGET_TYPES.has(targetType as BookmarkTargetType)) return null;
  if (targetId === '') return null;
  return {
    profileId,
    targetType: targetType as BookmarkTargetType,
    targetId,
  };
};
