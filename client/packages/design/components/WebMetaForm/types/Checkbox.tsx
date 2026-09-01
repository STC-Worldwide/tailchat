import React from 'react';
import type { FastifyFormFieldComponent } from 'react-fastify-form';
import { MetaFormField } from './Field';

export const FastifyFormCheckbox: FastifyFormFieldComponent = React.memo(
  (props) => {
    const { name, label, value, onChange, error } = props;

    return (
      <MetaFormField label={undefined} error={error}>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            name={name}
            checked={Boolean(value)}
            className="size-4 rounded border-control-border accent-primary"
            onChange={(e) => onChange(e.target.checked)}
          />
          {label}
        </label>
      </MetaFormField>
    );
  }
);
FastifyFormCheckbox.displayName = 'FastifyFormCheckbox';
