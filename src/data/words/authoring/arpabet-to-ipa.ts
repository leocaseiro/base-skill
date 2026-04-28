export const ARPABET_TO_IPA: Readonly<Record<string, string>> = {
  aa: 'ɑ',
  ae: 'æ',
  ah: 'ʌ',
  ao: 'ɔ',
  aw: 'aʊ',
  ay: 'aɪ',
  b: 'b',
  ch: 'tʃ',
  d: 'd',
  dh: 'ð',
  eh: 'ɛ',
  er: 'ɜ',
  ey: 'eɪ',
  f: 'f',
  g: 'g',
  hh: 'h',
  ih: 'ɪ',
  iy: 'i',
  jh: 'dʒ',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  ng: 'ŋ',
  ow: 'oʊ',
  oy: 'ɔɪ',
  p: 'p',
  r: 'r',
  s: 's',
  sh: 'ʃ',
  t: 't',
  th: 'θ',
  uh: 'ʊ',
  uw: 'u',
  v: 'v',
  w: 'w',
  y: 'j',
  z: 'z',
  zh: 'ʒ',
};

const STRESS_SUFFIX = /[0-9]+$/;

export const arpabetTokenToIpa = (token: string): string => {
  const stripped = token
    .trim()
    .toLowerCase()
    .replace(STRESS_SUFFIX, '');
  const ipa = ARPABET_TO_IPA[stripped];
  if (!ipa) {
    throw new Error(`unknown ARPABET token: ${token}`);
  }
  return ipa;
};

export const arpabetStringToIpa = (input: string): string[] => {
  if (!input.trim()) return [];
  return input
    .trim()
    .split(/\s+/)
    .flatMap((syll) => syll.split('-').filter(Boolean))
    .map((token) => arpabetTokenToIpa(token));
};
