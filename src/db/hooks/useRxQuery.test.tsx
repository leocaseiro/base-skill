import { render, screen, waitFor } from '@testing-library/react';
import { useMemo } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRxQuery } from './useRxQuery';
import type { ThemeDoc } from '@/db/schemas/themes';
import type { BaseSkillDatabase } from '@/db/types';
import { createTestDatabase, destroyTestDatabase } from '@/db/create-database';

const now = '2024-01-01T00:00:00.000Z';

function oceanPreset(id: string, name: string): ThemeDoc {
  return {
    id,
    name,
    isPreset: true,
    ownedByProfileId: null,
    ownedByFamily: false,
    colors: {
      primary: '#0077B6',
      secondary: '#00B4D8',
      background: '#CAF0F8',
      surface: '#FFFFFF',
      text: '#03045E',
      accent: '#F77F00',
    },
    typography: { fontFamily: 'Edu NSW ACT Foundation', baseSize: 18 },
    backgroundPattern: 'waves',
    createdAt: now,
    updatedAt: now,
  };
}

const ThemeCount = ({ db }: { db: BaseSkillDatabase }) => {
  const obs = useMemo(() => db.themes.find().$, [ db ]);
  const docs = useRxQuery(obs, [] as ThemeDoc[]);
  return <span data-testid="count">{docs.length}</span>;
};

describe('useRxQuery', () => {
  let db: BaseSkillDatabase | undefined;
  afterEach(async () => {
    if (db) await destroyTestDatabase(db);
    db = undefined;
  });

  it('updates when collection gains documents', async () => {
    db = await createTestDatabase();
    render(<ThemeCount db={db} />);

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await db.themes.insert(oceanPreset('theme_a', 'A'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    await db.themes.insert(oceanPreset('theme_b', 'B'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
  });
});
