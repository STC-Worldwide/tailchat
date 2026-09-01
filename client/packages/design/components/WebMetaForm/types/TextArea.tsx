import React from 'react';
import type { FastifyFormFieldComponent } from 'react-fastify-form';
import { MetaFormField } from './Field';

export const FastifyFormTextArea: FastifyFormFieldComponent = React.memo(
  (props) => {
    const {
      name,
      label,
      value,
      onChange,
      onBlur,
      error,
      maxLength,
      placeholder,
    } = props;

    return (
      <MetaFormField label={label} error={error}>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-control-border bg-transparent px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          name={name}
          rows={4}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      </MetaFormField>
    );
  }
);
FastifyFormTextArea.displayName = 'FastifyFormTextArea';
