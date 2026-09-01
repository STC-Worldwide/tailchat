import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  createMetaFormSchema,
  type MetaFormFieldMeta,
  metaFormFieldSchema,
  WebMetaForm,
} from 'tailchat-design';
import { registerShadcnMetaForm } from '../ShadcnMetaForm';

beforeAll(() => {
  if (typeof DOMRect === 'undefined') {
    Object.defineProperty(globalThis, 'DOMRect', {
      configurable: true,
      value: {
        fromRect: (rect: Partial<DOMRect> = {}) => ({
          x: rect.x ?? 0,
          y: rect.y ?? 0,
          width: rect.width ?? 0,
          height: rect.height ?? 0,
          top: rect.y ?? 0,
          left: rect.x ?? 0,
          right: (rect.x ?? 0) + (rect.width ?? 0),
          bottom: (rect.y ?? 0) + (rect.height ?? 0),
          toJSON: () => ({}),
        }),
      },
    });
  }

  registerShadcnMetaForm();
});

const fields: MetaFormFieldMeta[] = [
  { type: 'text', name: 'displayName', label: 'Display name' },
  { type: 'password', name: 'password', label: 'Password' },
  { type: 'textarea', name: 'about', label: 'About' },
  {
    type: 'select',
    name: 'role',
    label: 'Role',
    options: [
      { value: 0, label: 'Member' },
      { value: 1, label: 'Admin' },
    ],
  },
  { type: 'checkbox', name: 'alerts', label: 'Enable alerts' },
];

describe('ShadcnMetaForm', () => {
  test('registers official Shadcn controls for metadata-driven forms', async () => {
    const onSubmit = jest.fn();

    render(
      <WebMetaForm
        fields={fields}
        submitLabel="Save changes"
        initialValues={{
          displayName: 'Tim',
          password: 'secret',
          about: 'Hello',
          alerts: false,
        }}
        onSubmit={onSubmit}
      />
    );

    expect(document.querySelector('[data-slot="meta-form"]')).toBeTruthy();
    expect(
      screen.getByLabelText('Display name').getAttribute('data-slot')
    ).toBe('input');
    expect(screen.getByLabelText('Password').getAttribute('data-slot')).toBe(
      'input'
    );
    expect(screen.getByLabelText('About').getAttribute('data-slot')).toBe(
      'textarea'
    );

    const role = screen.getByRole('combobox', { name: 'Role' });
    expect(role.getAttribute('data-slot')).toBe('select-trigger');
    fireEvent.click(role);
    const adminOption = await screen.findByRole('option', { name: 'Admin' });
    expect(adminOption.getAttribute('data-slot')).toBe('select-item');
    fireEvent.pointerDown(adminOption, { button: 0 });
    fireEvent.pointerUp(adminOption, { button: 0 });
    fireEvent.click(adminOption);
    fireEvent.blur(role);
    await waitFor(() => expect(role.textContent).toContain('Admin'));

    const alerts = screen.getByRole('checkbox', { name: 'Enable alerts' });
    expect(alerts.getAttribute('data-slot')).toBe('checkbox');
    fireEvent.click(alerts);
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Tim F.' },
    });

    const submit = screen.getByRole('button', { name: 'Save changes' });
    expect(submit.getAttribute('data-slot')).toBe('button');
    fireEvent.click(submit);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        displayName: 'Tim F.',
        password: 'secret',
        about: 'Hello',
        role: 1,
        alerts: true,
      })
    );
  });

  test('associates validation feedback with the invalid control', async () => {
    const onSubmit = jest.fn();
    const schema = createMetaFormSchema({
      displayName: metaFormFieldSchema.string().required('Name is required'),
    });

    render(
      <WebMetaForm
        fields={[{ type: 'text', name: 'displayName', label: 'Display name' }]}
        schema={schema}
        submitLabel="Continue"
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Name is required'
    );
    const input = screen.getByLabelText('Display name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByRole('alert').id
    );

    fireEvent.change(input, { target: { value: 'Tailchat' } });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
      expect(
        screen
          .getByRole('button', { name: 'Continue' })
          .hasAttribute('disabled')
      ).toBe(false);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ displayName: 'Tailchat' })
    );
  });
});
