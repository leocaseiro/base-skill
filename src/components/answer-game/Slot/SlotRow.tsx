import type { ReactNode } from 'react';

interface SlotRowProps {
  className?: string;
  children: ReactNode;
}

export const SlotRow = ({ className, children }: SlotRowProps) => (
  <ol
    className={['flex flex-wrap items-center justify-center', className]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </ol>
);
