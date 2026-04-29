export interface DebugRoundRow {
  index: number;
  cells: Record<string, string>;
}

const stringify = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const formatRounds = (
  gameId: string,
  rounds: unknown,
): { columns: string[]; rows: DebugRoundRow[] } => {
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return { columns: [], rows: [] };
  }

  if (gameId === 'word-spell') {
    const columns = ['#', 'word', 'emoji'];
    const rows = rounds.map((round, index) => {
      const r = round as Record<string, unknown>;
      return {
        index,
        cells: {
          '#': String(index + 1),
          word: stringify(r.word),
          emoji: stringify(r.emoji),
        },
      };
    });
    return { columns, rows };
  }

  if (gameId === 'number-match') {
    const columns = ['#', 'value'];
    const rows = rounds.map((round, index) => {
      const r = round as Record<string, unknown>;
      return {
        index,
        cells: {
          '#': String(index + 1),
          value: stringify(r.value),
        },
      };
    });
    return { columns, rows };
  }

  if (gameId === 'sort-numbers') {
    const columns = ['#', 'sequence', 'answer'];
    const rows = rounds.map((round, index) => {
      const r = round as Record<string, unknown>;
      const sequence = Array.isArray(r.sequence)
        ? (r.sequence as unknown[]).map((v) => stringify(v)).join(', ')
        : stringify(r.sequence);
      const answer = Array.isArray(r.answer)
        ? (r.answer as unknown[]).map((v) => stringify(v)).join(', ')
        : stringify(r.answer);
      return {
        index,
        cells: {
          '#': String(index + 1),
          sequence,
          answer,
        },
      };
    });
    return { columns, rows };
  }

  const columns = ['#', 'json'];
  const rows = rounds.map((round, index) => ({
    index,
    cells: {
      '#': String(index + 1),
      json: stringify(round),
    },
  }));
  return { columns, rows };
};
