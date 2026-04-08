// src/lib/config-fields.ts
export type VisibleWhen = {
  key: string;
  subKey?: string;
  value: unknown;
};

export type ConfigField =
  | {
      type: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'number';
      key: string;
      label: string;
      min: number;
      max: number;
      visibleWhen?: VisibleWhen;
    }
  | {
      /** A number field that reads/writes from a nested object: config[key][subKey] */
      type: 'nested-number';
      key: string;
      subKey: string;
      label: string;
      min: number;
      max: number;
      visibleWhen?: VisibleWhen;
    }
  | {
      /** A select that reads/writes from a nested object: config[key][subKey] */
      type: 'nested-select';
      key: string;
      subKey: string;
      label: string;
      options: { value: string; label: string }[];
      visibleWhen?: VisibleWhen;
    }
  | {
      /**
       * A hybrid field: a type-selector ('all' | 'number') plus a number input
       * when the current value is numeric. Reads/writes config[key][subKey].
       */
      type: 'nested-select-or-number';
      key: string;
      subKey: string;
      label: string;
      min: number;
      max: number;
      options?: { value: string; label: string }[];
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'checkbox';
      key: string;
      label: string;
      visibleWhen?: VisibleWhen;
    };
