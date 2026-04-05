// src/components/ConfigFormFields.tsx
import type { ConfigField } from '@/lib/config-fields';
import type { JSX } from 'react';

type ConfigFormFieldsProps = {
  fields: ConfigField[];
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
};

export const ConfigFormFields = ({
  fields,
  config,
  onChange,
}: ConfigFormFieldsProps): JSX.Element => (
  <div className="flex flex-col gap-3">
    {fields.map((field) => {
      if (field.type === 'select') {
        return (
          <label
            key={field.key}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <select
              aria-label={field.label}
              value={String(config[field.key] ?? '')}
              onChange={(e) =>
                onChange({ ...config, [field.key]: e.target.value })
              }
              className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        );
      }

      if (field.type === 'nested-number') {
        const nested = config[field.key] as
          | Record<string, unknown>
          | undefined;
        return (
          <label
            key={`${field.key}.${field.subKey}`}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <input
              type="number"
              aria-label={field.label}
              value={Number(nested?.[field.subKey] ?? field.min)}
              min={field.min}
              max={field.max}
              onChange={(e) =>
                onChange({
                  ...config,
                  [field.key]: {
                    ...nested,
                    [field.subKey]: Number(e.target.value),
                  },
                })
              }
              className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
        );
      }

      if (field.type === 'number') {
        return (
          <label
            key={field.key}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <input
              type="number"
              aria-label={field.label}
              value={Number(config[field.key] ?? field.min)}
              min={field.min}
              max={field.max}
              onChange={(e) =>
                onChange({
                  ...config,
                  [field.key]: Number(e.target.value),
                })
              }
              className="h-12 w-28 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </label>
        );
      }

      // checkbox
      return (
        <label
          key={field.key}
          className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold text-foreground"
        >
          <input
            type="checkbox"
            aria-label={field.label}
            checked={Boolean(config[field.key])}
            onChange={(e) =>
              onChange({ ...config, [field.key]: e.target.checked })
            }
            className="h-5 w-5 accent-primary"
          />
          {field.label}
        </label>
      );
    })}
  </div>
);
