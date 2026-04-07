import { describe, expect, it } from 'vitest';
import { parseSentenceTemplate } from './parse-sentence-template';

describe('parseSentenceTemplate', () => {
  it('parses a single gap', () => {
    const result = parseSentenceTemplate('The {0} sat on the mat.');
    expect(result).toEqual([
      { type: 'text', value: 'The ' },
      { type: 'gap', index: 0 },
      { type: 'text', value: ' sat on the mat.' },
    ]);
  });

  it('parses multiple gaps', () => {
    const result = parseSentenceTemplate('The {0} sat on the {1}.');
    expect(result).toEqual([
      { type: 'text', value: 'The ' },
      { type: 'gap', index: 0 },
      { type: 'text', value: ' sat on the ' },
      { type: 'gap', index: 1 },
      { type: 'text', value: '.' },
    ]);
  });

  it('handles gap at start', () => {
    const result = parseSentenceTemplate('{0} is a cat.');
    expect(result).toEqual([
      { type: 'gap', index: 0 },
      { type: 'text', value: ' is a cat.' },
    ]);
  });

  it('handles gap at end', () => {
    const result = parseSentenceTemplate('I see a {0}');
    expect(result).toEqual([
      { type: 'text', value: 'I see a ' },
      { type: 'gap', index: 0 },
    ]);
  });

  it('handles no gaps (plain text)', () => {
    const result = parseSentenceTemplate('No gaps here.');
    expect(result).toEqual([{ type: 'text', value: 'No gaps here.' }]);
  });

  it('handles adjacent gaps', () => {
    const result = parseSentenceTemplate('{0}{1}');
    expect(result).toEqual([
      { type: 'gap', index: 0 },
      { type: 'gap', index: 1 },
    ]);
  });
});
