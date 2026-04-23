import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DraftsPanel } from './DraftsPanel';
import { draftStore } from './draftStore';

beforeEach(async () => {
  await draftStore.__clearAllForTests();
  await draftStore.saveDraft({
    word: 'zzword',
    region: 'aus',
    level: 3,
    ipa: 'zwɜːd',
    syllables: ['zz', 'word'],
    syllableCount: 2,
    graphemes: [
      { g: 'zz', p: 'z' },
      { g: 'word', p: 'wɜːd' },
    ],
    ritaKnown: false,
  });
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('DraftsPanel', () => {
  it('renders one row per draft', async () => {
    render(<DraftsPanel open onClose={() => {}} onEdit={() => {}} />);
    expect(await screen.findByText('zzword')).toBeInTheDocument();
  });

  it('deletes a draft', async () => {
    render(<DraftsPanel open onClose={() => {}} onEdit={() => {}} />);
    await screen.findByText('zzword');
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    await userEvent.click(
      screen.getByRole('button', { name: /delete/i }),
    );
    expect(await draftStore.listDrafts({ region: 'aus' })).toHaveLength(
      0,
    );
  });

  it('triggers a download when Export is clicked', async () => {
    // jsdom does not implement URL.createObjectURL — stub before spying
    (URL as { createObjectURL: unknown }).createObjectURL = () => '';
    (URL as { revokeObjectURL: unknown }).revokeObjectURL = () => {};

    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    render(<DraftsPanel open onClose={() => {}} onEdit={() => {}} />);
    await screen.findByText('zzword');
    await userEvent.click(
      screen.getByRole('button', { name: /export drafts/i }),
    );
    expect(createSpy).toHaveBeenCalled();
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
