import { NumberMatchSimpleConfigForm } from './number-match/NumberMatchSimpleConfigForm/NumberMatchSimpleConfigForm';
import { numberMatchConfigFields } from './number-match/types';
import { SortNumbersSimpleConfigForm } from './sort-numbers/SortNumbersSimpleConfigForm/SortNumbersSimpleConfigForm';
import { sortNumbersConfigFields } from './sort-numbers/types';
import { wordSpellConfigFields } from './word-spell/types';
import { WordSpellLibrarySource } from './word-spell/WordSpellLibrarySource/WordSpellLibrarySource';
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

const WordSpellAdvancedHeader = (props: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => <WordSpellLibrarySource {...props} />;

export const getAdvancedHeaderRenderer = (
  gameId: string,
): ConfigFormRenderer | undefined => {
  switch (gameId) {
    case 'word-spell': {
      return WordSpellAdvancedHeader;
    }
    default: {
      return undefined;
    }
  }
};
