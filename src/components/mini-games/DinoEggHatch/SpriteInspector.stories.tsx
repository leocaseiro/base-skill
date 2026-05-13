import { SpriteFrame } from './SpriteFrame';
import {
  ANIMALS,
  ANIMAL_FRAMES,
  ANIMAL_KEYS,
  EGG_FRAMES,
  getDisplayTweak,
  stripUrl,
  tweakToTransform,
} from './sprites';
import type { Animal } from './sprites';
import type { Meta, StoryObj } from '@storybook/react';

interface InspectorArgs {
  source: Animal | 'egg';
  frameIndex: number;
  displayWidth: number;
  displayHeight: number;
  backgroundColor: string;
  showBorder: boolean;
  borderColor: string;
}

const SingleSpriteFrame = ({
  source,
  frameIndex,
  displayWidth,
  displayHeight,
  backgroundColor,
  showBorder,
  borderColor,
}: InspectorArgs) => {
  const totalFrames = source === 'egg' ? EGG_FRAMES : ANIMAL_FRAMES;
  const safeFrame = Math.min(Math.max(0, frameIndex), totalFrames - 1);
  const tweak = getDisplayTweak(source);
  const transform = tweakToTransform(tweak);
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8"
      style={{ backgroundColor }}
    >
      <div
        style={{
          outline: showBorder ? `2px dashed ${borderColor}` : 'none',
          outlineOffset: '0px',
        }}
      >
        <div style={transform ? { transform } : undefined}>
          <SpriteFrame
            src={stripUrl(source)}
            totalFrames={totalFrames}
            frameIndex={safeFrame}
            displayWidth={displayWidth}
            displayHeight={displayHeight}
            alt={`${source} frame ${safeFrame.toString()}`}
          />
        </div>
      </div>
      <div className="rounded bg-white/90 px-3 py-1 font-mono text-sm text-black">
        {source} · frame {safeFrame.toString()} / {totalFrames - 1}
        {transform ? ` · ${transform}` : ''}
      </div>
    </div>
  );
};

const meta: Meta<typeof SingleSpriteFrame> = {
  component: SingleSpriteFrame,
  title: 'MiniGames/DinoEggHatch/SpriteInspector',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Asset QA tool — pick any sprite and frame, toggle the boundary box, and try background colors to spot bleed from neighbouring frames or transparent edges that disappear against certain backgrounds.',
      },
    },
  },
  argTypes: {
    source: {
      control: { type: 'select' },
      options: ['egg', ...ANIMAL_KEYS],
    },
    frameIndex: {
      control: {
        type: 'range',
        min: 0,
        max: ANIMAL_FRAMES - 1,
        step: 1,
      },
    },
    displayWidth: {
      control: { type: 'range', min: 120, max: 600, step: 20 },
    },
    displayHeight: {
      control: { type: 'range', min: 120, max: 700, step: 20 },
    },
    backgroundColor: { control: { type: 'color' } },
    borderColor: { control: { type: 'color' } },
    showBorder: { control: { type: 'boolean' } },
  },
  args: {
    source: 'owl',
    frameIndex: 3,
    displayWidth: 240,
    displayHeight: 268,
    backgroundColor: '#7e48c0',
    showBorder: true,
    borderColor: '#ff00ff',
  },
};

export default meta;

type Story = StoryObj<typeof SingleSpriteFrame>;

export const SingleFrame: Story = {};

/**
 * Grid that lays out every frame of every sprite in the catalog. Use this
 * to scan all assets at once for cropping, alignment drift, or transparent
 * edges — the boundary outline makes frame-bleed instantly visible.
 */
export const AllFrames: StoryObj<{
  backgroundColor: string;
  showBorder: boolean;
  borderColor: string;
  cellWidth: number;
  cellHeight: number;
}> = {
  argTypes: {
    backgroundColor: { control: { type: 'color' } },
    borderColor: { control: { type: 'color' } },
    showBorder: { control: { type: 'boolean' } },
    cellWidth: {
      control: { type: 'range', min: 80, max: 320, step: 20 },
    },
    cellHeight: {
      control: { type: 'range', min: 90, max: 360, step: 20 },
    },
  },
  args: {
    backgroundColor: '#7e48c0',
    showBorder: true,
    borderColor: '#ff00ff',
    cellWidth: 160,
    cellHeight: 178,
  },
  render: ({
    backgroundColor,
    showBorder,
    borderColor,
    cellWidth,
    cellHeight,
  }) => {
    // Egg is shown as a reference card with only its intact frame (no
    // cracks) so it sits at the top of the grid as a visual baseline for
    // animal sizes. `framesInStrip` is the strip's real frame count
    // (passed to SpriteFrame for correct background-position math);
    // `framesToShow` controls how many cells we actually render.
    const sources: Array<{
      key: Animal | 'egg';
      label: string;
      framesInStrip: number;
      framesToShow: number;
    }> = [
      {
        key: 'egg',
        label: 'Egg (intact — reference)',
        framesInStrip: EGG_FRAMES,
        framesToShow: 1,
      },
      ...ANIMAL_KEYS.map((key) => ({
        key,
        label: ANIMALS[key].name,
        framesInStrip: ANIMAL_FRAMES,
        framesToShow: ANIMAL_FRAMES,
      })),
    ];

    return (
      <div className="min-h-screen p-6" style={{ backgroundColor }}>
        <div className="flex flex-col gap-6">
          {sources.map(
            ({ key, label, framesInStrip, framesToShow }) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="font-mono text-sm font-bold text-white">
                  {label}{' '}
                  <span className="text-sm font-normal">
                    ({key} · {framesInStrip.toString()} frames)
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: framesToShow }, (_, i) => {
                    const cellTransform = tweakToTransform(
                      getDisplayTweak(key),
                    );
                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1"
                      >
                        <div
                          style={{
                            outline: showBorder
                              ? `2px dashed ${borderColor}`
                              : 'none',
                          }}
                        >
                          <div
                            style={
                              cellTransform
                                ? { transform: cellTransform }
                                : undefined
                            }
                          >
                            <SpriteFrame
                              src={stripUrl(key)}
                              totalFrames={framesInStrip}
                              frameIndex={i}
                              displayWidth={cellWidth}
                              displayHeight={cellHeight}
                              alt={`${key} frame ${i.toString()}`}
                            />
                          </div>
                        </div>
                        <div className="font-mono text-xs text-white">
                          frame {i}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  },
};
