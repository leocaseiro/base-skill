export type Direction = 'ascending' | 'descending';
export type InputMethod = 'drag' | 'type' | 'both';

type DirectionLabel = {
  emoji: string;
  label: string;
  subtitle: string;
};

type InputMethodLabel = {
  emoji: string;
  label: string;
};

export const directionLabel = (d: Direction): DirectionLabel =>
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

export const inputMethodLabel = (m: InputMethod): InputMethodLabel => {
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
