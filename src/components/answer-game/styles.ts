import type { CSSProperties } from 'react';

/** Skeuomorphic tile button style — applied to all draggable tile buttons. */
export const skeuoStyle: CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0) 70.48%, #FFF 93.62%, rgba(255,255,255,0) 100%), linear-gradient(180deg, rgba(30,54,87,0) 0%, rgba(30,54,87,0.01) 100%), #FAFAFA',
  boxShadow:
    'rgba(0,0,0,0.08) 0 0 0 1px, rgba(0,0,0,0.08) 0 -2px 1px 0 inset, rgba(255,255,255,0.5) 0 2px 1px 0 inset, 0 2px 5px -1px rgba(0,0,0,0.05), 0 1px 3px -1px rgba(0,0,0,0.3)',
  textShadow: '0px 1px 1px rgba(0,0,0,0.12)',
};
