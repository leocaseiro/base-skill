// src/components/ConfigFormFields.tsx
import type { ConfigField, VisibleWhen } from '@/lib/config-fields';
import type { JSX } from 'react';

const isFieldVisible = (
  field: ConfigField,
  config: Record<string, unknown>,
): boolean => {
  const vw: VisibleWhen | undefined =
    'visibleWhen' in field ? field.visibleWhen : undefined;
  if (!vw) return true;
  const { key, subKey, value } = vw;
  const configValue = subKey
    ? (config[key] as Record<string, unknown> | undefined)?.[subKey]
    : config[key];
  return configValue === value;
};

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
      if (!isFieldVisible(field, config)) return null;

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

      if (field.type === 'nested-select') {
        const nested = config[field.key] as
          | Record<string, unknown>
          | undefined;
        return (
          <label
            key={`${field.key}.${field.subKey}`}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            {field.label}
            <select
              aria-label={field.label}
              value={String(nested?.[field.subKey] ?? '')}
              onChange={(e) =>
                onChange({
                  ...config,
                  [field.key]: {
                    ...nested,
                    [field.subKey]: e.target.value,
                  },
                })
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

      if (field.type === 'nested-select-or-number') {
        const nested = config[field.key] as
          | Record<string, unknown>
          | undefined;
        const currentValue = nested?.[field.subKey];
        const selectOptions = field.options ?? [
          { value: 'all', label: 'all' },
        ];
        const isStringOption =
          typeof currentValue === 'string' &&
          selectOptions.some((o) => o.value === currentValue);
        return (
          <div
            key={`${field.key}.${field.subKey}`}
            className="flex flex-col gap-1 text-sm font-semibold text-foreground"
          >
            <span>{field.label}</span>
            <div className="flex gap-2">
              <select
                aria-label={`${field.label} type`}
                value={isStringOption ? String(currentValue) : 'number'}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = val === 'number' ? field.min : val;
                  onChange({
                    ...config,
                    [field.key]: { ...nested, [field.subKey]: next },
                  });
                }}
                className="h-12 rounded-lg border border-input bg-background px-3 text-sm"
              >
                {selectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value="number">number</option>
              </select>
              {!isStringOption && (
                <input
                  type="number"
                  aria-label={`${field.label} value`}
                  value={
                    typeof currentValue === 'number'
                      ? currentValue
                      : field.min
                  }
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
              )}
            </div>
          </div>
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
