import type { Decorator } from '@storybook/react';
import { createStorybookDatabase } from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';

export const withDb: Decorator = (Story) => (
  <DbProvider openDatabase={createStorybookDatabase}>
    <Story />
  </DbProvider>
);
