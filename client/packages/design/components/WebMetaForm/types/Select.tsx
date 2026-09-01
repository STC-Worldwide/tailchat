import React, { useEffect } from 'react';
import _get from 'lodash/get';
import _isNil from 'lodash/isNil';
import type { FastifyFormFieldComponent } from 'react-fastify-form';
import { MetaFormField } from './Field';

interface FastifyFormSelectOptionsItem {
  label: string;
  value: string;
}

export const FastifyFormSelect: FastifyFormFieldComponent<{
  options: FastifyFormSelectOptionsItem[];
}> = React.memo((props) => {
  const { name, label, value, onChange, onBlur, options } = props;

  useEffect(() => {
    if (_isNil(value) || value === '') {
      // 如果没有值的话则自动设置默认值
      onChange(_get(options, [0, 'value']));
    }
  }, []);

  return (
    <MetaFormField label={label}>
      <select
        className="h-8 w-full rounded-lg border border-control-border bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      >
        {options.map((option, i) => (
          <option key={`${option.value}${i}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </MetaFormField>
  );
});
FastifyFormSelect.displayName = 'FastifyFormSelect';
