export type Direction = 'ascending' | 'descending';
export type InputMethod = 'drag' | 'type' | 'both';

export const directionLabel = (d: Direction) =>
  d === 'ascending'
    ? {
        emoji: '🚀',
        label: 'Going Up!',
        subtitle: 'ascending',
      }
    : {
        emoji: '🛝',
        label: 'Going Down!',
        subtitle: 'descending',
      };

export const inputMethodLabel = (m: InputMethod) => {
  switch (m) {
    case 'drag': {
      return { emoji: '✋', label: 'Drag' };
    }
    case 'type': {
      return { emoji: '⌨️', label: 'Type' };
    }
    case 'both': {
      return { emoji: '✨', label: 'Both' };
    }
  }
};
