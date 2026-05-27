import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('@fireworks-js/react', () => ({
  Fireworks: () => null,
}));

// FireworksPainter is the post-game celebration mini-game. In integration tests
// we don't want to wait out its 10s timer, so fire onComplete on mount and skip
// the canvas / timer / hint UI entirely.
vi.mock(
  '@/components/mini-games/FireworksPainter/FireworksPainter',
  () => ({
    FireworksPainter: ({ onComplete }: { onComplete?: () => void }) => {
      queueMicrotask(() => {
        onComplete?.();
      });
      return null;
    },
  }),
);
