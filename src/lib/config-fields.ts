// src/lib/config-fields.ts
export type ConfigField =
  | {
      type: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | {
      type: 'number';
      key: string;
      label: string;
      min: number;
      max: number;
    }
  | { type: 'checkbox'; key: string; label: string };
