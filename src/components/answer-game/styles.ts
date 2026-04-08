import type { CSSProperties } from 'react';

/** Skeuomorphic tile button style — applied to all draggable tile buttons. */
export const skeuoStyle: CSSProperties = {
  background:
    'linear-gradient(180deg, transparent 70.48%, var(--skeuo-highlight, rgba(255,255,255,1)) 93.62%, transparent 100%), var(--card, #FAFAFA)',
  boxShadow:
    'var(--skeuo-ring, rgba(0,0,0,0.08)) 0 0 0 1px, var(--skeuo-inset-bottom, rgba(0,0,0,0.08)) 0 -2px 1px 0 inset, var(--skeuo-inset-top, rgba(255,255,255,0.5)) 0 2px 1px 0 inset, 0 2px 5px -1px rgba(0,0,0,0.05), 0 1px 3px -1px rgba(0,0,0,0.3)',
  textShadow: '0px 1px 1px var(--skeuo-text-shadow, rgba(0,0,0,0.12))',
};
