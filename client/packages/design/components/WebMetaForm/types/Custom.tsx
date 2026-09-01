import React from 'react';
import type {
  FastifyFormFieldComponent,
  FastifyFormFieldProps,
} from 'react-fastify-form';
import { CustomField } from 'react-fastify-form';
import { MetaFormField } from './Field';

export const FastifyFormCustom: FastifyFormFieldComponent<{
  render: (props: FastifyFormFieldProps) => React.ReactNode;
}> = React.memo((props) => {
  const { label } = props;

  return (
    <MetaFormField label={label}>
      <CustomField {...props} />
    </MetaFormField>
  );
});
FastifyFormCustom.displayName = 'FastifyFormCustom';
