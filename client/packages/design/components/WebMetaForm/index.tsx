import React, { useMemo } from 'react';
import {
  FastifyForm,
  regField,
  FastifyFormFieldComponent,
  FastifyFormContainerComponent,
  regFormContainer,
} from 'react-fastify-form';

import { FastifyFormText } from './types/Text';
import { FastifyFormTextArea } from './types/TextArea';
import { FastifyFormPassword } from './types/Password';
import { FastifyFormSelect } from './types/Select';
import { FastifyFormCheckbox } from './types/Checkbox';
import { FastifyFormCustom } from './types/Custom';

regField('text', FastifyFormText);
regField('textarea', FastifyFormTextArea);
regField('password', FastifyFormPassword);
regField('select', FastifyFormSelect);
regField('checkbox', FastifyFormCheckbox);
regField('custom', FastifyFormCustom);

const webFastifyFormConfig = {
  submitLabel: 'Submit',
};

export interface WebFastifyFormConfig {
  submitLabel?: string;
  fields?: Record<string, FastifyFormFieldComponent<any>>;
  container?: FastifyFormContainerComponent;
}

export function setWebFastifyFormConfig(config: WebFastifyFormConfig) {
  if (typeof config.submitLabel === 'string') {
    webFastifyFormConfig.submitLabel = config.submitLabel;
  }

  Object.entries(config.fields ?? {}).forEach(([type, component]) => {
    regField(type, component);
  });

  if (config.container) {
    const ConfiguredContainer: FastifyFormContainerComponent = (props) => {
      const Container = config.container as FastifyFormContainerComponent;

      return (
        <Container
          {...props}
          submitLabel={props.submitLabel ?? webFastifyFormConfig.submitLabel}
        />
      );
    };
    ConfiguredContainer.displayName = 'ConfiguredWebFastifyFormContainer';
    regFormContainer(ConfiguredContainer);
  }
}

const WebFastifyFormContainer: FastifyFormContainerComponent = React.memo(
  (props) => {
    const layout = props.layout;
    const suffixElement = props.extraProps?.suffixElement;

    const submitButtonRender = useMemo(() => {
      return (
        <button
          type="submit"
          disabled={props.loading || props.canSubmit === false}
          aria-busy={props.loading}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {props.submitLabel ?? webFastifyFormConfig.submitLabel}
        </button>
      );
    }, [
      props.loading,
      props.handleSubmit,
      props.canSubmit,
      props.submitLabel,
      layout,
    ]);

    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          props.handleSubmit();
        }}
        className="space-y-4"
      >
        {props.children}
        {suffixElement}
        {submitButtonRender}
      </form>
    );
  }
);
WebFastifyFormContainer.displayName = 'WebFastifyFormContainer';
regFormContainer(WebFastifyFormContainer);

export const WebMetaForm = FastifyForm;
(WebMetaForm as any).displayName = 'WebMetaForm';
