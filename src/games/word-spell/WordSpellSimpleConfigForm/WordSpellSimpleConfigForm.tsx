import { useTranslation } from 'react-i18next';
import { WordSpellLibrarySource } from '../WordSpellLibrarySource/WordSpellLibrarySource';
import type { JSX, KeyboardEvent } from 'react';
import { ChunkGroup } from '@/components/config/ChunkGroup';
import { getRegisteredSkins } from '@/lib/skin/registry';

type Props = {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

const SKIN_RADIO_NAME = 'word-spell-skin';

const focusRadioByIndex = (index: number): void => {
  const all = [
    ...document.querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${SKIN_RADIO_NAME}"]`,
    ),
  ];
  all[index]?.focus();
};

export const WordSpellSimpleConfigForm = ({
  config,
  onChange,
}: Props): JSX.Element => {
  const { t } = useTranslation('games');
  const inputMethod =
    config.inputMethod === 'type' || config.inputMethod === 'both'
      ? config.inputMethod
      : 'drag';

  const skins = getRegisteredSkins('word-spell');
  const showSkinRadio = skins.length >= 2;
  const selectedSkin =
    typeof config.skin === 'string' ? config.skin : 'classic';

  const handleSkinKeyDown =
    (index: number) =>
    (event: KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        focusRadioByIndex((index + 1) % skins.length);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        focusRadioByIndex((index - 1 + skins.length) % skins.length);
      }
    };

  const skinLabel = t('instructions.skin');

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
      {showSkinRadio && (
        <fieldset
          role="radiogroup"
          aria-label={skinLabel}
          className="flex flex-col gap-1 text-sm font-semibold text-foreground"
        >
          <legend>{skinLabel}</legend>
          <div className="flex flex-col gap-2">
            {skins.map((skin, index) => {
              const isSelected = selectedSkin === skin.id;
              return (
                <label
                  key={skin.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3"
                >
                  <input
                    type="radio"
                    name={SKIN_RADIO_NAME}
                    value={skin.id}
                    checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onChange={() =>
                      onChange({ ...config, skin: skin.id })
                    }
                    onKeyDown={handleSkinKeyDown(index)}
                    className="h-5 w-5 accent-primary"
                  />
                  {skin.name}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
};
