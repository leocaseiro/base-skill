import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConfigDraft } from './useConfigDraft';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';

const baseInput = {
  config: { direction: 'ascending' } as Record<string, unknown>,
  onConfigChange: vi.fn(),
  initialName: 'Skip by 2',
  initialColor: 'amber' as GameColorKey,
  initialCover: undefined,
  identity: 'abc',
};

describe('useConfigDraft', () => {
  it('exposes the live draft from props + meta initials', () => {
    const onConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    expect(result.current.draft).toEqual({
      config: { direction: 'ascending' },
      name: 'Skip by 2',
      color: 'amber',
      cover: undefined,
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('setDraft routes config patches through onConfigChange', () => {
    const onConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    act(() => {
      result.current.setDraft({
        config: { direction: 'descending' },
      });
    });
    expect(onConfigChange).toHaveBeenCalledWith({
      direction: 'descending',
    });
  });

  it('setDraft updates meta locally', () => {
    const onConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    act(() => {
      result.current.setDraft({ name: 'Skip by 5' });
    });
    expect(result.current.draft.name).toBe('Skip by 5');
    expect(onConfigChange).not.toHaveBeenCalled();
  });

  it('setDraft clears cover when explicitly set to undefined', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(() =>
      useConfigDraft({ ...baseInput, onConfigChange }),
    );
    act(() => {
      const cover: Cover = { kind: 'emoji', emoji: '⭐' };
      result.current.setDraft({ cover });
    });
    rerender();
    expect(result.current.draft.cover).toEqual({
      kind: 'emoji',
      emoji: '⭐',
    });
    act(() => {
      result.current.setDraft({ cover: undefined });
    });
    rerender();
    expect(result.current.draft.cover).toBeUndefined();
  });

  it('isDirty becomes true when draft differs from baseline', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }: { config: Record<string, unknown> }) =>
        useConfigDraft({ ...baseInput, config, onConfigChange }),
      { initialProps: { config: { direction: 'ascending' } } },
    );
    rerender({ config: { direction: 'descending' } });
    expect(result.current.isDirty).toBe(true);
  });

  it('discard reverts config and meta to the modal-open snapshot', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }: { config: Record<string, unknown> }) =>
        useConfigDraft({ ...baseInput, config, onConfigChange }),
      { initialProps: { config: { direction: 'ascending' } } },
    );
    act(() => {
      result.current.openModalSnapshot();
    });
    rerender({ config: { direction: 'descending' } });
    act(() => {
      result.current.setDraft({ name: 'Different Name' });
    });
    onConfigChange.mockClear();
    act(() => {
      result.current.discard();
    });
    expect(onConfigChange).toHaveBeenCalledWith({
      direction: 'ascending',
    });
    rerender({ config: { direction: 'ascending' } });
    expect(result.current.draft.name).toBe('Skip by 2');
  });

  it('commitSaved updates baseline so isDirty resets to false', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ config }: { config: Record<string, unknown> }) =>
        useConfigDraft({ ...baseInput, config, onConfigChange }),
      { initialProps: { config: { direction: 'ascending' } } },
    );
    rerender({ config: { direction: 'descending' } });
    act(() => {
      result.current.setDraft({ name: 'Skip by 5' });
    });
    rerender({ config: { direction: 'descending' } });
    expect(result.current.isDirty).toBe(true);
    act(() => {
      result.current.commitSaved({
        config: { direction: 'descending' },
        name: 'Skip by 5',
        color: 'amber',
        cover: undefined,
      });
    });
    rerender({ config: { direction: 'descending' } });
    expect(result.current.isDirty).toBe(false);
  });

  it('resets baseline and meta when identity changes', () => {
    const onConfigChange = vi.fn();
    const { result, rerender } = renderHook(
      ({
        identity,
        initialName,
        config,
      }: {
        identity: string;
        initialName: string;
        config: Record<string, unknown>;
      }) =>
        useConfigDraft({
          ...baseInput,
          config,
          onConfigChange,
          identity,
          initialName,
        }),
      {
        initialProps: {
          identity: 'abc',
          initialName: 'Skip by 2',
          config: { direction: 'ascending' },
        },
      },
    );
    act(() => {
      result.current.setDraft({ name: 'Edited' });
    });
    rerender({
      identity: 'xyz',
      initialName: 'Other Custom',
      config: { direction: 'descending' },
    });
    expect(result.current.draft.name).toBe('Other Custom');
    expect(result.current.isDirty).toBe(false);
  });
});
