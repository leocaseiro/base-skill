export type TextSegment = { type: 'text'; value: string };
export type GapSegment = { type: 'gap'; index: number };
export type SentenceSegment = TextSegment | GapSegment;

const GAP_REGEX = /\{(\d+)\}/g;

export const parseSentenceTemplate = (
  template: string,
): SentenceSegment[] => {
  const segments: SentenceSegment[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(GAP_REGEX)) {
    const matchStart = match.index;
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        value: template.slice(lastIndex, matchStart),
      });
    }
    segments.push({
      type: 'gap',
      index: Number.parseInt(match[1]!, 10),
    });
    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ type: 'text', value: template.slice(lastIndex) });
  }

  return segments;
};
