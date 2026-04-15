export type Cover =
  | {
      kind: 'emoji';
      emoji: string;
      gradient?: [string, string];
    }
  | {
      kind: 'image';
      src: string;
      alt?: string;
      background?: string;
    };
