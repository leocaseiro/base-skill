import { WordSpellLibrarySource } from '../WordSpellLibrarySource/WordSpellLibrarySource';
import type { JSX } from 'react';
import { ChunkGroup } from '@/components/config/ChunkGroup';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const WordSpellSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const inputMethod =
    config.inputMethod === 'type' || config.inputMethod === 'both'
      ? config.inputMethod
      : 'drag';

  return (
    <div className="flex flex-col gap-4">
      <WordSpellLibrarySource config={config} onChange={onChange} />
      <ChunkGroup
        label="How do you answer?"
        options={[
          { value: 'drag', emoji: '✋', label: 'Drag' },
          { value: 'type', emoji: '⌨️', label: 'Type' },
          { value: 'both', emoji: '✨', label: 'Both' },
        ]}
        value={inputMethod}
        onChange={(m) => onChange({ ...config, inputMethod: m })}
      />
    </div>
  );
};
