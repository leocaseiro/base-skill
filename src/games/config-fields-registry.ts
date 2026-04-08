import { numberMatchConfigFields } from './number-match/types';
import { SortNumbersConfigForm } from './sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm';
import { sortNumbersConfigFields } from './sort-numbers/types';
import { wordSpellConfigFields } from './word-spell/types';
import type { ConfigField } from '@/lib/config-fields';
import type { JSX } from 'react';

export const getConfigFields = (gameId: string): ConfigField[] => {
  switch (gameId) {
    case 'word-spell': {
      return wordSpellConfigFields;
    }
    case 'number-match': {
      return numberMatchConfigFields;
    }
    case 'sort-numbers': {
      return sortNumbersConfigFields;
    }
    default: {
      return [];
    }
  }
};

type ConfigFormRendererProps = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

type ConfigFormRenderer = (
  props: ConfigFormRendererProps,
) => JSX.Element;

export const getConfigFormRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'sort-numbers': {
      return SortNumbersConfigForm;
    }
    default: {
      return undefined;
    }
  }
};
