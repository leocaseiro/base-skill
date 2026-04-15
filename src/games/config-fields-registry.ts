import { NumberMatchSimpleConfigForm } from './number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm';
import { numberMatchConfigFields } from './number-match/types';
import { SortNumbersConfigForm } from './sort-numbers/SortNumbersConfigForm/SortNumbersConfigForm';
import { SortNumbersSimpleConfigForm } from './sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm';
import { sortNumbersConfigFields } from './sort-numbers/types';
import { wordSpellConfigFields } from './word-spell/types';
import { WordSpellSimpleConfigForm } from './word-spell/WordSpellSimpleConfigForm/WordSpellSimpleConfigForm';
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

export const getAdvancedConfigFields = getConfigFields;

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

export const getSimpleConfigFormRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'word-spell': {
      return WordSpellSimpleConfigForm;
    }
    case 'number-match': {
      return NumberMatchSimpleConfigForm;
    }
    case 'sort-numbers': {
      return SortNumbersSimpleConfigForm;
    }
    default: {
      return undefined;
    }
  }
};
