import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CoverPicker } from './CoverPicker';
import type { Cover } from '@/games/cover-type';

const Harness = () => {
  const [cover, setCover] = useState<Cover | undefined>();
  return <CoverPicker value={cover} onChange={setCover} />;
};

describe('CoverPicker', () => {
  it('selecting an emoji updates the cover', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /🦁/ }));
    expect(screen.getByRole('button', { name: /🦁/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('typing a URL switches to image mode', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const url = screen.getByPlaceholderText(/image url/i);
    await user.type(url, 'https://example.com/cat.png');
    expect(url).toHaveValue('https://example.com/cat.png');
  });

  it('pressing "Use game default" clears the cover', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: /🦁/ }));
    await user.click(
      screen.getByRole('button', { name: /use game default/i }),
    );
    expect(screen.getByRole('button', { name: /🦁/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
