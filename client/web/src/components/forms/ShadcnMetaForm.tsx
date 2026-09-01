import React, { useEffect, useId } from 'react';
import {
  setWebMetaFormConfig,
  type FastifyFormContainerComponent,
  type FastifyFormFieldComponent,
  type FastifyFormFieldProps,
} from 'tailchat-design';
import { LoaderCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/official/button';
import { Checkbox } from '@/components/ui/official/checkbox';
import {
  Field,
  FieldError,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/official/field';
import { Input } from '@/components/ui/official/input';
import { Label } from '@/components/ui/official/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/official/select';
import { Textarea } from '@/components/ui/official/textarea';

interface MetaFormSelectOption {
  label: React.ReactNode;
  value: string | number;
}

function useMetaFormIds(name: string) {
  const reactId = useId().replace(/:/g, '');
  const controlId = `meta-form-${name}-${reactId}`;

  return {
    controlId,
    errorId: `${controlId}-error`,
  };
}

const ShadcnMetaFormField: React.FC<{
  controlId?: string;
  errorId: string;
  label?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}> = ({ controlId, errorId, label, error, children }) => (
  <Field className="gap-2">
    {label &&
      (controlId ? (
        <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      ) : (
        <FieldTitle>{label}</FieldTitle>
      ))}
    {children}
    <FieldError
      id={errorId}
      errors={error ? [{ message: error }] : undefined}
    />
  </Field>
);

const ShadcnMetaFormText: FastifyFormFieldComponent = React.memo((props) => {
  const {
    name,
    label,
    value,
    onChange,
    onBlur,
    error,
    maxLength,
    placeholder,
    disabled,
    readOnly,
    autoComplete,
    autoFocus,
  } = props;
  const { controlId, errorId } = useMetaFormIds(name);

  return (
    <ShadcnMetaFormField
      controlId={controlId}
      errorId={errorId}
      label={label}
      error={error}
    >
      <Input
        id={controlId}
        name={name}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value ?? ''}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </ShadcnMetaFormField>
  );
});
ShadcnMetaFormText.displayName = 'ShadcnMetaFormText';

const ShadcnMetaFormPassword: FastifyFormFieldComponent = React.memo(
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
      disabled,
      readOnly,
      autoComplete,
      autoFocus,
    } = props;
    const { controlId, errorId } = useMetaFormIds(name);

    return (
      <ShadcnMetaFormField
        controlId={controlId}
        errorId={errorId}
        label={label}
        error={error}
      >
        <Input
          id={controlId}
          name={name}
          type="password"
          maxLength={maxLength}
          placeholder={placeholder}
          value={value ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      </ShadcnMetaFormField>
    );
  }
);
ShadcnMetaFormPassword.displayName = 'ShadcnMetaFormPassword';

const ShadcnMetaFormTextArea: FastifyFormFieldComponent = React.memo(
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
      disabled,
      readOnly,
      rows = 4,
    } = props;
    const { controlId, errorId } = useMetaFormIds(name);

    return (
      <ShadcnMetaFormField
        controlId={controlId}
        errorId={errorId}
        label={label}
        error={error}
      >
        <Textarea
          id={controlId}
          name={name}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      </ShadcnMetaFormField>
    );
  }
);
ShadcnMetaFormTextArea.displayName = 'ShadcnMetaFormTextArea';

const ShadcnMetaFormSelect: FastifyFormFieldComponent<{
  options: MetaFormSelectOption[];
}> = React.memo((props) => {
  const {
    name,
    label,
    value,
    onChange,
    onBlur,
    error,
    options,
    disabled,
    placeholder,
  } = props;
  const { controlId, errorId } = useMetaFormIds(name);
  const selectItems = options.map((option) => ({
    label: option.label,
    value: String(option.value),
  }));
  const selectedValue = String(value ?? options[0]?.value ?? '');

  useEffect(() => {
    if ((value === undefined || value === null || value === '') && options[0]) {
      onChange(options[0].value);
    }
  }, [onChange, options, value]);

  return (
    <ShadcnMetaFormField
      controlId={controlId}
      errorId={errorId}
      label={label}
      error={error}
    >
      <Select
        name={name}
        value={selectedValue}
        items={selectItems}
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (nextValue === null) {
            return;
          }

          const selectedOption = options.find(
            (option) => String(option.value) === nextValue
          );
          if (selectedOption) {
            onChange(selectedOption.value);
          }
        }}
      >
        <SelectTrigger
          id={controlId}
          className="w-full"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {selectItems.map((option, index) => (
            <SelectItem key={`${option.value}-${index}`} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ShadcnMetaFormField>
  );
});
ShadcnMetaFormSelect.displayName = 'ShadcnMetaFormSelect';

const ShadcnMetaFormCheckbox: FastifyFormFieldComponent = React.memo(
  (props) => {
    const { name, label, value, onChange, onBlur, error, disabled } = props;
    const { controlId, errorId } = useMetaFormIds(name);

    return (
      <ShadcnMetaFormField errorId={errorId} error={error}>
        <div className="flex items-center gap-2">
          <Checkbox
            id={controlId}
            name={name}
            checked={Boolean(value)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
            onBlur={onBlur}
          />
          <Label htmlFor={controlId} className="cursor-pointer">
            {label}
          </Label>
        </div>
      </ShadcnMetaFormField>
    );
  }
);
ShadcnMetaFormCheckbox.displayName = 'ShadcnMetaFormCheckbox';

const ShadcnMetaFormCustom: FastifyFormFieldComponent<{
  render: (props: FastifyFormFieldProps) => React.ReactNode;
}> = React.memo((props) => {
  const { name, label, error, render, ...fieldProps } = props;
  const { controlId, errorId } = useMetaFormIds(name);

  return (
    <ShadcnMetaFormField
      controlId={controlId}
      errorId={errorId}
      label={label}
      error={error}
    >
      {render({ name, label, error, controlId, errorId, ...fieldProps })}
    </ShadcnMetaFormField>
  );
});
ShadcnMetaFormCustom.displayName = 'ShadcnMetaFormCustom';

const ShadcnMetaFormContainer: FastifyFormContainerComponent = React.memo(
  (props) => {
    const suffixElement = props.extraProps?.suffixElement;
    const disabled = props.loading || props.canSubmit === false;

    return (
      <form
        data-slot="meta-form"
        data-layout={props.layout ?? 'horizontal'}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled) {
            props.handleSubmit();
          }
        }}
      >
        {props.children}
        {suffixElement}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={disabled}
          aria-busy={props.loading}
        >
          {props.loading && <LoaderCircleIcon className="animate-spin" />}
          {props.submitLabel}
        </Button>
      </form>
    );
  }
);
ShadcnMetaFormContainer.displayName = 'ShadcnMetaFormContainer';

export function registerShadcnMetaForm() {
  setWebMetaFormConfig({
    fields: {
      text: ShadcnMetaFormText,
      textarea: ShadcnMetaFormTextArea,
      password: ShadcnMetaFormPassword,
      select: ShadcnMetaFormSelect,
      checkbox: ShadcnMetaFormCheckbox,
      custom: ShadcnMetaFormCustom,
    },
    container: ShadcnMetaFormContainer,
  });
}
